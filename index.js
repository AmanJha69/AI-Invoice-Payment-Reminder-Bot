const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = require('./middleware/auth');
const User = require('./models/user');
const Invoice = require('./models/invoice');
const Client = require('./models/client');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err.message));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  company: user.company,
  timezone: user.timezone,
});

const buildInvoicePayload = (invoice, user) => ({
  event: 'payment_reminder.requested',
  requestedAt: new Date().toISOString(),
  invoice: {
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    status: invoice.status,
    description: invoice.description,
    notes: invoice.notes,
    paymentMethod: invoice.paymentMethod,
  },
  client: invoice.clientId
    ? {
        id: invoice.clientId._id,
        name: invoice.clientId.name,
        email: invoice.clientId.email,
        phone: invoice.clientId.phone,
        company: invoice.clientId.company,
      }
    : null,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    company: user.company,
    timezone: user.timezone,
  },
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, company, phone });
    res.status(201).json({ token: createToken(user._id), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not create account', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: createToken(user._id), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not login', error: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load profile', error: error.message });
  }
});

app.get('/api/clients', auth, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Could not load clients', error: error.message });
  }
});

app.post('/api/clients', auth, async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, userId: req.userId });
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: 'Could not create client', error: error.message });
  }
});

app.get('/api/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId })
      .populate('clientId', 'name email company')
      .sort({ dueDate: 1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Could not load invoices', error: error.message });
  }
});

app.post('/api/invoices', auth, async (req, res) => {
  try {
    const invoice = await Invoice.create({ ...req.body, userId: req.userId });
    const populatedInvoice = await invoice.populate('clientId', 'name email company');
    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(400).json({ message: 'Could not create invoice', error: error.message });
  }
});

app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const [invoices, clients] = await Promise.all([
      Invoice.find({ userId: req.userId }).populate('clientId', 'name email company'),
      Client.find({ userId: req.userId }).sort({ createdAt: -1 }),
    ]);

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const totals = invoices.reduce(
      (summary, invoice) => {
        summary.totalAmount += invoice.amount || 0;
        if (invoice.status === 'paid') summary.paidAmount += invoice.amount || 0;
        if (invoice.status === 'overdue' || new Date(invoice.dueDate) < now) {
          summary.overdueAmount += invoice.amount || 0;
          summary.overdueCount += 1;
        }
        if (new Date(invoice.dueDate) >= now && new Date(invoice.dueDate) <= sevenDaysFromNow) {
          summary.dueSoonCount += 1;
        }
        return summary;
      },
      { totalAmount: 0, paidAmount: 0, overdueAmount: 0, overdueCount: 0, dueSoonCount: 0 }
    );

    res.json({
      stats: {
        ...totals,
        invoiceCount: invoices.length,
        clientCount: clients.length,
        collectionRate: totals.totalAmount
          ? Math.round((totals.paidAmount / totals.totalAmount) * 100)
          : 0,
      },
      invoices,
      clients,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load dashboard', error: error.message });
  }
});

app.post('/api/n8n/reminders/:invoiceId/send', auth, async (req, res) => {
  try {
    if (!process.env.N8N_REMINDER_WEBHOOK_URL) {
      return res.status(400).json({
        message: 'N8N_REMINDER_WEBHOOK_URL is not configured in .env',
      });
    }

    const [invoice, user] = await Promise.all([
      Invoice.findOne({ _id: req.params.invoiceId, userId: req.userId }).populate('clientId'),
      User.findById(req.userId),
    ]);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const payload = buildInvoicePayload(invoice, user);
    const n8nResponse = await fetch(process.env.N8N_REMINDER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Invoice-Bot-Secret': process.env.N8N_CALLBACK_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await n8nResponse.text();
    if (!n8nResponse.ok) {
      return res.status(502).json({
        message: 'n8n webhook returned an error',
        status: n8nResponse.status,
        details: responseText,
      });
    }

    res.json({
      message: 'Reminder sent to n8n workflow',
      n8nStatus: n8nResponse.status,
      n8nResponse: responseText,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not send reminder to n8n', error: error.message });
  }
});

app.post('/api/n8n/reminder-status', async (req, res) => {
  try {
    const expectedSecret = process.env.N8N_CALLBACK_SECRET;
    const receivedSecret = req.header('X-Invoice-Bot-Secret');

    if (expectedSecret && receivedSecret !== expectedSecret) {
      return res.status(401).json({ message: 'Invalid n8n callback secret' });
    }

    const { invoiceId, status, paymentMethod, notes } = req.body;
    const allowedStatuses = ['draft', 'sent', 'pending', 'paid', 'overdue'];

    if (!invoiceId || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'invoiceId and a valid status are required' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status, paymentMethod, notes },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice status updated', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Could not update reminder status', error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

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
const Activity = require('./models/activity');
const N8nQueue = require('./models/n8nQueue');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();

const rateLimit = require('express-rate-limit');

// Middleware
app.use(cors());
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Temporarily increased for testing (was 100)
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const n8nLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Temporarily increased for testing (was 5)
  message: { message: 'You have reached the maximum number of email automation requests for now. Please try again later.' }
});

app.use('/api/', globalLimiter);

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
  notificationPreference: invoice.clientId?.notificationPreference || 'email',
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    company: user.company,
    timezone: user.timezone,
  },
});

const logActivity = async (userId, action, targetType, targetId, description, metadata = {}) => {
  try {
    await Activity.create({ userId, action, targetType, targetId, description, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

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

app.post('/api/clients', auth, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Client name is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    const client = await Client.create({ ...req.body, userId: req.userId });
    await logActivity(req.userId, 'client_created', 'client', client._id, `Added client ${client.name}`);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/clients/:id', auth, async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found or unauthorized.' });
    }
    
    // Optionally delete all invoices associated with this client
    await Invoice.deleteMany({ clientId: client._id });
    
    await logActivity(req.userId, 'client_deleted', 'client', client._id, `Deleted client ${client.name}`);
    res.json({ message: 'Client and associated invoices deleted successfully.' });
  } catch (error) {
    next(error);
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

app.post('/api/invoices', auth, async (req, res, next) => {
  try {
    const { clientId, amount, items } = req.body;
    if (!clientId) {
      return res.status(400).json({ message: 'Client is required to create an invoice.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invoice amount must be greater than zero.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one line item is required.' });
    }
    const invoice = await Invoice.create({ ...req.body, userId: req.userId });
    const populatedInvoice = await invoice.populate('clientId', 'name email company');
    await logActivity(req.userId, 'invoice_created', 'invoice', invoice._id, `Created invoice ${invoice.invoiceNumber}`, { amount: invoice.amount });
    res.status(201).json(populatedInvoice);
  } catch (error) {
    next(error);
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

// --- Queue Helper Function ---
async function sendOrQueueN8n(webhookUrl, payload, invoiceId, userId, clientId, taskType) {
  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Invoice-Bot-Secret': process.env.N8N_CALLBACK_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await n8nResponse.text();
    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook error: ${n8nResponse.status} ${responseText}`);
    }
    return { success: true, message: 'Sent to n8n workflow' };
  } catch (error) {
    await N8nQueue.create({
      invoiceId,
      userId,
      clientId,
      payload,
      status: 'pending',
      errorLog: error.message
    });
    
    const logLine = `[${new Date().toISOString()}] FAILED to send ${taskType} for Invoice ${invoiceId}: ${error.message}\n`;
    fs.appendFileSync(path.join(__dirname, 'n8n-failures.log'), logLine);
    
    return { success: false, message: 'n8n offline or failed. Task securely queued for retry.' };
  }
}

app.post('/api/n8n/reminders/:invoiceId/send', n8nLimiter, auth, async (req, res) => {
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
    
    const result = await sendOrQueueN8n(
      process.env.N8N_REMINDER_WEBHOOK_URL,
      payload,
      invoice._id,
      user._id,
      invoice.clientId?._id,
      'reminder'
    );

    if (result.success) {
      await logActivity(req.userId, 'reminder_sent', 'reminder', invoice._id, `Sent payment reminder for ${invoice.invoiceNumber} to ${invoice.clientId?.name || 'client'}`, { amount: invoice.amount });
    } else {
      await logActivity(req.userId, 'reminder_queued', 'reminder', invoice._id, `Queued payment reminder for ${invoice.invoiceNumber} (n8n offline)`);
    }

    res.json({
      message: result.message,
      n8nStatus: result.success ? 200 : 503,
      n8nResponse: result.message,
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

// --- Single Invoice ---
app.get('/api/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId })
      .populate('clientId', 'name email company phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Could not load invoice', error: error.message });
  }
});

// --- Update Invoice ---
app.put('/api/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    ).populate('clientId', 'name email company');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    await logActivity(req.userId, 'invoice_updated', 'invoice', invoice._id,
      `Updated invoice ${invoice.invoiceNumber}`, { status: invoice.status });
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Could not update invoice', error: error.message });
  }
});

// --- Delete Invoice ---
app.delete('/api/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    await logActivity(req.userId, 'invoice_deleted', 'invoice', invoice._id,
      `Deleted invoice ${invoice.invoiceNumber}`, { amount: invoice.amount });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete invoice', error: error.message });
  }
});

// --- Single Client with their invoices ---
app.get('/api/clients/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.userId });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const invoices = await Invoice.find({ clientId: req.params.id, userId: req.userId })
      .sort({ dueDate: -1 });
    res.json({ client, invoices });
  } catch (error) {
    res.status(500).json({ message: 'Could not load client', error: error.message });
  }
});

// --- Update Client ---
app.put('/api/clients/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    await logActivity(req.userId, 'client_updated', 'client', client._id,
      `Updated client ${client.name}`);
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: 'Could not update client', error: error.message });
  }
});

// --- Delete Client ---
app.delete('/api/clients/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    await logActivity(req.userId, 'client_deleted', 'client', client._id,
      `Deleted client ${client.name}`);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete client', error: error.message });
  }
});

// --- Activity Logs ---
app.get('/api/activity', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Could not load activity logs', error: error.message });
  }
});

// --- Send Invoice via n8n ---
app.post('/api/n8n/invoices/:invoiceId/send', n8nLimiter, auth, async (req, res) => {
  try {
    if (!process.env.N8N_INVOICE_WEBHOOK_URL) {
      return res.status(400).json({
        message: 'N8N_INVOICE_WEBHOOK_URL is not configured in .env',
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
    payload.event = 'invoice.send_requested';

    const result = await sendOrQueueN8n(
      process.env.N8N_INVOICE_WEBHOOK_URL,
      payload,
      invoice._id,
      user._id,
      invoice.clientId?._id,
      'invoice'
    );

    if (result.success) {
      await logActivity(req.userId, 'invoice_sent', 'invoice', invoice._id, `Sent invoice ${invoice.invoiceNumber} to ${invoice.clientId?.name || 'client'}`, { amount: invoice.amount });
    } else {
      await logActivity(req.userId, 'invoice_queued', 'invoice', invoice._id, `Queued invoice ${invoice.invoiceNumber} (n8n offline)`);
    }

    res.json({
      message: result.message,
      n8nStatus: result.success ? 200 : 503,
      n8nResponse: result.message,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not send invoice via n8n', error: error.message });
  }
});

app.get('/api/n8n/daily-checks', async (req, res) => {
  try {
    const expectedSecret = process.env.N8N_CALLBACK_SECRET;
    const receivedSecret = req.header('X-Invoice-Bot-Secret');

    if (expectedSecret && receivedSecret !== expectedSecret) {
      return res.status(401).json({ message: 'Invalid n8n callback secret' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Find invoices due today or exactly in 7 days, that are not paid/draft
    const invoices = await Invoice.find({
      status: { $nin: ['paid', 'draft'] },
      $or: [
        { dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        { dueDate: { $gte: sevenDaysFromNow, $lt: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000) } }
      ]
    }).populate('clientId').populate('userId');

    // Build payload for each
    const payloads = invoices.map(inv => buildInvoicePayload(inv, inv.userId));
    
    res.json({ invoices: payloads });
  } catch (error) {
    res.status(500).json({ message: 'Error checking daily invoices', error: error.message });
  }
});

// --- Queue Processor & Cron Job ---
app.get('/api/n8n/status', auth, async (req, res) => {
  try {
    const recentFails = await N8nQueue.countDocuments({
      status: 'failed',
      lastAttempt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    
    // If there are failures in the last hour, we consider n8n offline or degraded
    res.json({ status: recentFails > 0 ? 'offline' : 'online', recentFails });
  } catch (error) {
    res.status(500).json({ status: 'unknown' });
  }
});

app.get('/api/n8n/failed', auth, async (req, res) => {
  try {
    const failedTasks = await N8nQueue.find({
      userId: req.userId,
      $or: [
        { status: 'failed', retries: { $gte: 10 } },
        { status: 'failed' } // Just return all failed/pending ones to be safe, but sort by retries
      ]
    }).populate('clientId', 'name company email').sort('-createdAt');
    res.json(failedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching failed tasks' });
  }
});

app.delete('/api/n8n/failed/:id', auth, async (req, res) => {
  try {
    await N8nQueue.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting failed task' });
  }
});

// Process Queue every 5 minutes
setInterval(async () => {
  try {
    const pendingTasks = await N8nQueue.find({ status: { $in: ['pending', 'failed'] }, retries: { $lt: 10 } }).limit(20);
    for (const task of pendingTasks) {
      task.lastAttempt = new Date();
      task.retries += 1;
      
      const webhookUrl = task.payload.event === 'invoice.send_requested' 
        ? process.env.N8N_INVOICE_WEBHOOK_URL 
        : process.env.N8N_REMINDER_WEBHOOK_URL;
        
      if (!webhookUrl) continue;

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Invoice-Bot-Secret': process.env.N8N_CALLBACK_SECRET || '',
          },
          body: JSON.stringify(task.payload),
        });

        if (response.ok) {
          task.status = 'completed';
          task.errorLog = '';
        } else {
          task.status = 'failed';
          task.errorLog = `n8n returned ${response.status}`;
        }
      } catch (err) {
        task.status = 'failed';
        task.errorLog = err.message;
      }
      await task.save();
    }
  } catch (err) {
    console.error('Queue Processor Error:', err.message);
  }
}, 5 * 60 * 1000);

// Daily Cron Job at 9:00 AM
async function runDailyInvoiceCheck() {
  console.log('Running daily invoice check via Express Cron...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Save last run date to file
    fs.writeFileSync(path.join(__dirname, '.cron-last-run'), new Date().toDateString());

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const invoices = await Invoice.find({
      status: { $nin: ['paid', 'draft'] },
      $or: [
        { dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        { dueDate: { $gte: sevenDaysFromNow, $lt: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000) } },
        { dueDate: { $gte: threeDaysAgo, $lt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000) } },
        { dueDate: { $gte: sevenDaysAgo, $lt: new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000) } }
      ]
    }).populate('clientId').populate('userId');

    for (const inv of invoices) {
      const payload = buildInvoicePayload(inv, inv.userId);
      
      // Determine reminder type based on due date
      const invDueDate = new Date(inv.dueDate).setHours(0,0,0,0);
      if (invDueDate === sevenDaysFromNow.getTime()) payload.reminderType = 'upcoming';
      else if (invDueDate === today.getTime()) payload.reminderType = 'due_today';
      else payload.reminderType = 'overdue';

      await sendOrQueueN8n(
        process.env.N8N_REMINDER_WEBHOOK_URL,
        payload,
        inv._id,
        inv.userId._id,
        inv.clientId?._id,
        'automated_reminder'
      );
      
      // Rate limiting: sleep for 2 seconds to avoid SMTP spam filters
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (err) {
    console.error('Daily cron error:', err);
  }
}

cron.schedule('0 9 * * *', runDailyInvoiceCheck, { timezone: 'Asia/Kolkata' });

// Catch-up script on server boot
setTimeout(() => {
  const dateStr = new Date().toDateString();
  let lastRun = '';
  try { lastRun = fs.readFileSync(path.join(__dirname, '.cron-last-run'), 'utf8'); } catch(e) {}
  
  if (lastRun !== dateStr && new Date().getHours() >= 9) {
    console.log('Missed 9:00 AM cron, running catch-up now...');
    runDailyInvoiceCheck();
  }
}, 5000);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

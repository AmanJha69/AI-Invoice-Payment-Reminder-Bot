import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSearch,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import CreateClientModal from '../components/CreateClientModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import '../styles/Dashboard.css';

const tabs = [
  { id: 'overview', label: 'Overview', icon: FiHome },
  { id: 'invoices', label: 'Invoices', icon: FiFileText },
  { id: 'clients', label: 'Clients', icon: FiUsers },
  { id: 'reminders', label: 'Reminders', icon: FiBell },
  { id: 'activity', label: 'Activity Logs', icon: FiActivity },
  { id: 'bot', label: 'AI Bot', icon: FiMessageSquare },
  { id: 'payments', label: 'Payments', icon: FiCreditCard },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#64748b'];

const fallbackInvoices = [
  {
    _id: 'demo-1',
    invoiceNumber: 'INV-1007',
    clientId: { name: 'Acme Cloud', company: 'Acme Cloud' },
    amount: 52000,
    currency: 'INR',
    dueDate: '2026-06-05',
    status: 'pending',
  },
  {
    _id: 'demo-2',
    invoiceNumber: 'INV-1008',
    clientId: { name: 'BluePeak Studio', company: 'BluePeak Studio' },
    amount: 28000,
    currency: 'INR',
    dueDate: '2026-05-27',
    status: 'overdue',
  },
  {
    _id: 'demo-3',
    invoiceNumber: 'INV-1009',
    clientId: { name: 'Nexus Retail', company: 'Nexus Retail' },
    amount: 74500,
    currency: 'INR',
    dueDate: '2026-06-12',
    status: 'sent',
  },
];

const fallbackClients = [
  { _id: 'client-1', name: 'Riya Sharma', company: 'Acme Cloud', email: 'riya@acme.example' },
  { _id: 'client-2', name: 'Arjun Mehta', company: 'BluePeak Studio', email: 'arjun@bluepeak.example' },
  { _id: 'client-3', name: 'Neha Rao', company: 'Nexus Retail', email: 'neha@nexus.example' },
];

const apiEndpoints = [
  { label: 'Register user', path: '/auth/register' },
  { label: 'Login user', path: '/auth/login' },
  { label: 'Dashboard data', path: '/dashboard' },
  { label: 'Create client', path: '/clients' },
  { label: 'Create invoice', path: '/invoices' },
  { label: 'Send reminder', path: '/n8n/reminders/:id/send' },
];

const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboard, setDashboard] = useState({ stats: {}, invoices: [], clients: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState('');

  // Modal states
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [isCreateClientOpen, setCreateClientOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiMessage('');

    try {
      const [dashboardRes, activityRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/activity').catch(() => ({ data: [] }))
      ]);
      setDashboard({ ...dashboardRes.data, activities: activityRes.data });
    } catch (error) {
      setApiMessage('Could not load dashboard data from server. Showing demo data.');
      setDashboard({
        stats: {
          totalAmount: 154500,
          paidAmount: 64000,
          overdueAmount: 28000,
          overdueCount: 1,
          dueSoonCount: 1,
          invoiceCount: 3,
          clientCount: 3,
          collectionRate: 41,
        },
        invoices: fallbackInvoices,
        clients: fallbackClients,
      });
    } finally {
      setLoading(false);
    }
  }, [user.email, user.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const invoices = dashboard.invoices?.length ? dashboard.invoices : fallbackInvoices;
  const clients = dashboard.clients?.length ? dashboard.clients : fallbackClients;
  const activities = dashboard.activities || [];
  const stats = dashboard.stats || {};

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch = `${invoice.invoiceNumber} ${invoice.clientId?.company || ''} ${invoice.clientId?.name || ''} ${invoice.status}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'overdue' || new Date(invoice.dueDate) < new Date());
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');

  const sendReminder = async (invoice) => {
    if (invoice._id?.startsWith('demo-')) {
      setApiMessage('Create a real invoice in MongoDB before sending it to n8n.');
      return;
    }

    setSendingReminderId(invoice._id);
    setApiMessage('');

    try {
      const { data } = await api.post(`/n8n/reminders/${invoice._id}/send`);
      setApiMessage(data.message || 'Reminder sent to n8n workflow.');
    } catch (error) {
      setApiMessage(error.response?.data?.message || 'Could not send reminder to n8n.');
    } finally {
      setSendingReminderId('');
    }
  };

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <section className="metric-grid">
            <MetricCard icon={FiDollarSign} label="Total receivables" value={formatCurrency(stats.totalAmount)} note={`${stats.invoiceCount || 0} invoices tracked`} tone="green" />
            <MetricCard icon={FiCheckCircle} label="Paid amount" value={formatCurrency(stats.paidAmount)} note={`${stats.collectionRate || 0}% collection rate`} tone="blue" />
            <MetricCard icon={FiClock} label="Overdue" value={formatCurrency(stats.overdueAmount)} note={`${stats.overdueCount || 0} invoices need action`} tone="red" />
            <MetricCard icon={FiUsers} label="Clients" value={stats.clientCount || clients.length} note="Active clients" tone="yellow" />
          </section>

          <section className="dashboard-grid" style={{ marginTop: '24px' }}>
            <div className="panel wide-panel">
              <PanelTitle icon={FiTrendingUp} title="Invoice Status Breakdown" action="All time" />
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Paid', amount: stats.paidAmount || 0 },
                    { name: 'Pending', amount: (stats.totalAmount || 0) - (stats.paidAmount || 0) - (stats.overdueAmount || 0) },
                    { name: 'Overdue', amount: stats.overdueAmount || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="n8n-strip">
            <div>
              <span className="connector-pill"><FiShield /> Express + n8n</span>
              <h2>Auth and data run on Express. Reminders are powered by n8n.</h2>
              <p>Login, signup, dashboard, invoices, and clients are handled by your Express server. n8n handles AI-powered payment reminders.</p>
            </div>
            <button className="outline-action" onClick={() => setActiveTab('bot')}>
              View endpoints <FiArrowRight />
            </button>
          </section>

          <section className="dashboard-grid">
            <div className="panel wide-panel">
              <PanelTitle icon={FiActivity} title="Reminder command center" action="Today" />
              <div className="timeline">
                {overdueInvoices.slice(0, 4).map((invoice) => (
                  <TimelineItem
                    key={invoice._id}
                    invoice={invoice}
                    onSend={sendReminder}
                    sending={sendingReminderId === invoice._id}
                  />
                ))}
                {!overdueInvoices.length && <p className="empty-state">No overdue invoices. The reminder queue is clear.</p>}
              </div>
            </div>
            <div className="panel">
              <PanelTitle icon={FiTrendingUp} title="Collection Rate" action="Analytics" />
              <div className="score-ring" style={{ marginBottom: '20px' }}>
                <span>{stats.collectionRate || 0}%</span>
                <small>collected</small>
              </div>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={[
                      { name: 'Collected', value: stats.paidAmount || 1 },
                      { name: 'Outstanding', value: (stats.totalAmount || 0) - (stats.paidAmount || 0) || 1 }
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <InvoiceSection 
            invoices={filteredInvoices} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onOpenInvoice={setSelectedInvoice}
            compact 
          />
        </>
      );
    }

    if (activeTab === 'invoices') {
      return (
        <InvoiceSection 
          invoices={filteredInvoices} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onOpenInvoice={setSelectedInvoice}
        />
      );
    }

    if (activeTab === 'clients') {
      return (
        <section className="panel">
          <div className="table-toolbar" style={{ marginBottom: '20px' }}>
            <PanelTitle icon={FiUsers} title="Client directory" action={`${clients.length} contacts`} />
            <button className="create-button" onClick={() => setCreateClientOpen(true)}>
              <FiPlus /> Add Client
            </button>
          </div>
          <div className="client-grid">
            {clients.map((client) => (
              <div className="client-card" key={client._id}>
                <div className="avatar">{(client.company || client.name || 'C').charAt(0)}</div>
                <strong>{client.company || client.name}</strong>
                <span>{client.name}</span>
                <p>{client.email}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'reminders') {
      return (
        <section className="panel">
          <PanelTitle icon={FiBell} title="Reminder queue" action="Automated follow-ups" />
          <div className="reminder-list">
            {invoices.map((invoice, index) => (
              <div className="reminder-row" key={invoice._id}>
                <span className={`status-dot ${invoice.status}`} />
                <div>
                  <strong>{invoice.invoiceNumber}</strong>
                  <p>{invoice.clientId?.company || invoice.clientId?.name || 'Client'} gets {index % 2 ? 'a WhatsApp reminder' : 'an email reminder'} on the next n8n run.</p>
                </div>
                <button onClick={() => sendReminder(invoice)} disabled={sendingReminderId === invoice._id}>
                  {sendingReminderId === invoice._id ? 'Sending' : 'Send'}
                </button>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'activity') {
      return (
        <section className="panel">
          <PanelTitle icon={FiActivity} title="Activity Logs" action="Recent actions" />
          <div className="timeline" style={{ padding: '20px' }}>
            {activities.length > 0 ? activities.map(act => (
              <div className="timeline-item" key={act._id}>
                <span className={`status-dot ${act.targetType === 'invoice' ? 'sent' : act.targetType === 'client' ? 'paid' : 'overdue'}`} />
                <div>
                  <strong>{act.action.replace('_', ' ').toUpperCase()}</strong>
                  <p>{act.description}</p>
                  <small style={{ color: '#64748b' }}>{new Date(act.createdAt).toLocaleString()}</small>
                </div>
              </div>
            )) : <p className="empty-state">No activity logs found yet.</p>}
          </div>
        </section>
      );
    }

    if (activeTab === 'bot') {
      return (
        <section className="dashboard-grid">
          <div className="panel wide-panel">
            <PanelTitle icon={FiMessageSquare} title="API endpoint map" action="Express + n8n" />
            <div className="workflow">
              {['React request', 'Express API', 'MongoDB', 'AI message', 'Respond'].map((step, index) => (
                <div className="workflow-step" key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="endpoint-list">
              {apiEndpoints.map((endpoint) => (
                <div key={endpoint.path}>
                  <strong>{endpoint.label}</strong>
                  <code>{endpoint.path}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <PanelTitle icon={FiSettings} title="Automation controls" action="Local n8n" />
            <label className="toggle-row"><input type="checkbox" defaultChecked /> Webhook workflows active</label>
            <label className="toggle-row"><input type="checkbox" defaultChecked /> MongoDB Atlas credential saved</label>
            <label className="toggle-row"><input type="checkbox" /> Email or WhatsApp credential connected</label>
            <div className="webhook-base">
              <span>API base</span>
              <code>{process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}</code>
            </div>
          </div>
        </section>
      );
    }

    if (activeTab === 'payments') {
      return (
        <section className="panel">
          <PanelTitle icon={FiCreditCard} title="Payment tracking" action={formatCurrency(stats.paidAmount)} />
          <div className="payment-strip">
            <div><span>Received</span><strong>{formatCurrency(stats.paidAmount)}</strong></div>
            <div><span>Outstanding</span><strong>{formatCurrency((stats.totalAmount || 0) - (stats.paidAmount || 0))}</strong></div>
            <div><span>Overdue</span><strong>{formatCurrency(stats.overdueAmount)}</strong></div>
          </div>
          <InvoiceTable invoices={filteredInvoices} onOpenInvoice={setSelectedInvoice} />
        </section>
      );
    }

    return (
      <section className="panel">
        <PanelTitle icon={FiSettings} title="Workspace settings" action="MongoDB Atlas" />
        <div className="settings-grid">
          <div><span>Signed in as</span><strong>{user.email}</strong></div>
          <div><span>Company</span><strong>{user.company || 'Not set'}</strong></div>
          <div><span>Timezone</span><strong>{user.timezone || 'UTC'}</strong></div>
          <div><span>Backend mode</span><strong>Express server</strong></div>
          <div><span>API base</span><strong>{process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}</strong></div>
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><FiCreditCard /></div>
          <div>
            <strong>InvoicePilot</strong>
            <span>AI reminder bot</span>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="logout-button" onClick={onLogout}><FiLogOut /> Logout</button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <button className="icon-control" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle navigation"><FiMenu /></button>
          <div>
            <p className="eyebrow">MongoDB Atlas workspace</p>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-control" onClick={loadDashboard} aria-label="Refresh dashboard"><FiRefreshCw /></button>
            <button className="create-button outline-action" onClick={() => setCreateClientOpen(true)}><FiUsers /> Add Client</button>
            <button className="create-button" onClick={() => setCreateInvoiceOpen(true)}><FiPlus /> New invoice</button>
          </div>
        </header>

        {apiMessage && <div className="notice">{apiMessage}</div>}
        {loading ? <div className="panel loading-panel">Loading dashboard data...</div> : renderContent()}
      </main>

      <CreateInvoiceModal 
        isOpen={isCreateInvoiceOpen} 
        onClose={() => setCreateInvoiceOpen(false)} 
        onCreated={loadDashboard} 
        clients={clients} 
      />
      <CreateClientModal 
        isOpen={isCreateClientOpen} 
        onClose={() => setCreateClientOpen(false)} 
        onCreated={loadDashboard} 
      />
      <InvoiceDetailModal 
        isOpen={!!selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
        invoice={selectedInvoice} 
        onUpdated={loadDashboard} 
        onDeleted={loadDashboard} 
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon"><Icon /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, action }) {
  return (
    <div className="panel-title">
      <div><Icon /><h2>{title}</h2></div>
      <span>{action}</span>
    </div>
  );
}

function InvoiceSection({ invoices, searchTerm, setSearchTerm, statusFilter, setStatusFilter, onOpenInvoice, compact }) {
  return (
    <section className="panel">
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <PanelTitle icon={FiFileText} title={compact ? 'Recent invoices' : 'Invoice management'} action={`${invoices.length} shown`} />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <div className="search-box">
            <FiSearch />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search invoice..." />
          </div>
        </div>
      </div>
      <InvoiceTable invoices={compact ? invoices.slice(0, 5) : invoices} onOpenInvoice={onOpenInvoice} />
    </section>
  );
}
function InvoiceTable({ invoices, onOpenInvoice }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Due date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td><strong>{invoice.invoiceNumber}</strong></td>
              <td>{invoice.clientId?.company || invoice.clientId?.name || 'Unassigned'}</td>
              <td>{formatCurrency(invoice.amount, invoice.currency)}</td>
              <td>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</td>
              <td><span className={`status-pill ${invoice.status}`}>{invoice.status}</span></td>
              <td><button className="small-button" onClick={() => onOpenInvoice && onOpenInvoice(invoice)}>Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineItem({ invoice, onSend, sending }) {
  return (
    <div className="timeline-item">
      <span className="status-dot overdue" />
      <div>
        <strong>{invoice.clientId?.company || invoice.clientId?.name || 'Client'} payment follow-up</strong>
        <p>{invoice.invoiceNumber} is due on {new Date(invoice.dueDate).toLocaleDateString('en-IN')} for {formatCurrency(invoice.amount, invoice.currency)}.</p>
      </div>
      <button className="small-button" onClick={() => onSend(invoice)} disabled={sending}>
        <FiSend /> {sending ? 'Sending' : 'Send'}
      </button>
    </div>
  );
}

export default Dashboard;

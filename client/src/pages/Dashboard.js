import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
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
  FiMoon,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import CreateClientModal from '../components/CreateClientModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import ClientDetailModal from '../components/ClientDetailModal';
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

const aiCapabilities = [
  { label: 'Smart Email Reminders', desc: 'Automatically dispatches styled emails to clients with overdue balances.' },
  { label: 'Dynamic PDFs', desc: 'Attaches instantly generated PDF invoices to outbound email reminders.' },
  { label: 'Invoice Processing', desc: 'Analyzes MongoDB data to calculate exact collection rates and outstanding dues.' },
  { label: 'Automated Dunning', desc: 'Executes scheduled n8n workflows based on due date timelines without manual input.' },
  { label: 'Status Sync', desc: 'Automatically updates dashboard UI when a payment is marked as received.' },
  { label: 'Client Analytics', desc: 'Builds financial profiles for each client based on their payment history.' },
];

const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

function Dashboard({ user, onLogout, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboard, setDashboard] = useState({ invoices: [], clients: [], activities: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [n8nStatus, setN8nStatus] = useState({ status: 'online', recentFails: 0 });
  const [apiMessage, setApiMessage] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState('');

  // Modal states
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [isCreateClientOpen, setCreateClientOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isFailedTasksOpen, setFailedTasksOpen] = useState(false);
  const [failedTasks, setFailedTasks] = useState([]);
  
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
  }, []);

  useEffect(() => {
    loadDashboard();
    
    // Check n8n queue status
    const checkN8nHealth = async () => {
      try {
        const { data } = await api.get('/n8n/status');
        setN8nStatus(data);
        
        // Fetch failed tasks list if there are any recent fails or overall fails
        const failsRes = await api.get('/n8n/failed');
        setFailedTasks(failsRes.data);
      } catch (err) {
        console.error('Could not check n8n health');
      }
    };
    checkN8nHealth();
    
    // Periodically check n8n health every 2 minutes
    const interval = setInterval(checkN8nHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
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

  const deleteClient = async (clientId) => {
    if (clientId.startsWith('demo-')) {
      setApiMessage('Cannot delete demo clients.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this client? All their invoices will also be deleted.')) {
      try {
        await api.delete(`/clients/${clientId}`);
        setApiMessage('Client deleted successfully.');
        loadDashboard();
      } catch (error) {
        setApiMessage(error.response?.data?.message || 'Could not delete client.');
      }
    }
  };

  const downloadCSV = () => {
    const headers = ['Invoice Number', 'Client', 'Amount', 'Due Date', 'Status'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.clientId?.company || inv.clientId?.name || 'Unknown',
      inv.amount,
      new Date(inv.dueDate).toLocaleDateString(),
      inv.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'payments_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <section className="metric-grid">
            <MetricCard 
              icon={FiDollarSign} label="Total receivables" value={formatCurrency(stats.totalAmount)} note={`${stats.invoiceCount || 0} invoices tracked`} tone="green" 
              trend="+12%" trendDirection="up" onClick={() => setActiveTab('invoices')} 
            />
            <MetricCard 
              icon={FiCheckCircle} label="Paid amount" value={formatCurrency(stats.paidAmount)} note={`${stats.collectionRate || 0}% collection rate`} tone="blue" 
              trend="+5%" trendDirection="up" onClick={() => { setActiveTab('invoices'); setStatusFilter('paid'); }} 
            />
            <MetricCard 
              icon={FiClock} label="Overdue" value={formatCurrency(stats.overdueAmount)} note={`${stats.overdueCount || 0} invoices need action`} tone="red" 
              trend="Action req" trendDirection="down" onClick={() => setActiveTab('reminders')} 
            />
            <MetricCard 
              icon={FiUsers} label="Clients" value={stats.clientCount || clients.length} note="Active clients" tone="yellow" 
              trend="+2" trendDirection="up" onClick={() => setActiveTab('clients')} 
            />
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
                    <defs>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.2)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} stroke="var(--text-secondary)" />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      <Cell fill="url(#colorPaid)" />
                      <Cell fill="url(#colorPending)" />
                      <Cell fill="url(#colorOverdue)" />
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
            <div className="panel" style={{ cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => setActiveTab('payments')} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <PanelTitle icon={FiTrendingUp} title="Collection Rate" action="Analytics" />
              <div style={{ width: '100%', height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', display: 'block' }}>{stats.collectionRate || 0}%</span>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Collected</small>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="colorPie" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <Pie data={[
                      { name: 'Collected', value: stats.paidAmount || 1 },
                      { name: 'Outstanding', value: (stats.totalAmount || 0) - (stats.paidAmount || 0) || 1 }
                    ]} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      <Cell fill="url(#colorPie)" style={{ filter: 'drop-shadow(0px 10px 15px rgba(79, 70, 229, 0.3))' }} />
                      <Cell fill="rgba(100, 116, 139, 0.1)" />
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }} />
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
            {clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', gridColumn: '1 / -1', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '15px' }}>No clients found. Click "Add Client" to get started.</p>
              </div>
            ) : clients.map((client) => (
              <div className="client-card clickable" key={client._id} onClick={() => setSelectedClient(client)}>
                <div className="avatar">{(client.company || client.name || 'C').charAt(0).toUpperCase()}</div>
                <strong>{client.company || client.name}</strong>
                <span>{client.name}</span>
                <p>{client.email}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteClient(client._id); }} 
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', borderRadius: '50%', color: 'var(--danger-color)', cursor: 'pointer', padding: '8px', zIndex: 2 }}
                  title="Delete Client"
                >
                  <FiTrash2 />
                </button>
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
                <div style={{ position: 'relative', width: '10px', height: '10px' }}>
                  <span className={`status-dot ${invoice.status}`} style={{ position: 'absolute', top: 0, left: 0 }} />
                  {invoice.status !== 'paid' && <span className={`status-dot ${invoice.status}`} style={{ position: 'absolute', top: 0, left: 0, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '15px' }}>{invoice.invoiceNumber}</strong>
                    <span className="bot-badge email">
                      EMAIL
                    </span>
                  </div>
                  <p>AI will send an automated reminder to {invoice.clientId?.company || invoice.clientId?.name || 'Client'} on the next n8n run.</p>
                </div>
                <button className="create-button outline-action" onClick={() => sendReminder(invoice)} disabled={sendingReminderId === invoice._id} style={{ height: '36px', padding: '0 16px', background: 'transparent' }}>
                  {sendingReminderId === invoice._id ? 'Sending...' : 'Send now'}
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
            <PanelTitle icon={FiMessageSquare} title="AI Capabilities Map" action="Express + n8n" />
            <div className="workflow">
              {['Invoice scan', 'Data analysis', 'Channel routing', 'AI Generation', 'Dispatch'].map((step, index, arr) => (
                <React.Fragment key={step}>
                  <div className="workflow-step">
                    <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Phase {index + 1}</span>
                    <strong style={{ fontSize: '15px' }}>{step}</strong>
                  </div>
                  {index < arr.length - 1 && <FiArrowRight className="workflow-arrow" />}
                </React.Fragment>
              ))}
            </div>
            <div className="endpoint-list">
              {aiCapabilities.map((cap) => (
                <div key={cap.label}>
                  <strong>{cap.label}</strong>
                  <code style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{cap.desc}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <PanelTitle icon={FiSettings} title="Automation controls" action="Local n8n" />
            <label className="toggle-row">
              <span style={{ fontWeight: 600 }}>Webhook workflows active</span>
              <div className="custom-toggle active"></div>
            </label>
            <label className="toggle-row">
              <span style={{ fontWeight: 600 }}>MongoDB Atlas credential saved</span>
              <div className="custom-toggle active"></div>
            </label>
            <label className="toggle-row">
              <span style={{ fontWeight: 600 }}>Gmail API credential connected</span>
              <div className="custom-toggle"></div>
            </label>
            <div className="webhook-base">
              <span>API base</span>
              <code style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)' }}>{process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}</code>
            </div>
          </div>
        </section>
      );
    }

    if (activeTab === 'payments') {
      const chartData = [
        { name: 'Week 1', revenue: (stats.paidAmount || 5000) * 0.2 },
        { name: 'Week 2', revenue: (stats.paidAmount || 5000) * 0.4 },
        { name: 'Week 3', revenue: (stats.paidAmount || 5000) * 0.65 },
        { name: 'Week 4', revenue: stats.paidAmount || 5000 }
      ];
      return (
        <section className="panel">
          <div className="table-toolbar">
            <PanelTitle icon={FiCreditCard} title="Payment tracking" action={formatCurrency(stats.paidAmount)} />
            <button className="create-button outline-action" onClick={downloadCSV} style={{ background: 'transparent' }}>Download CSV</button>
          </div>
          
          <div style={{ height: '200px', width: '100%', marginBottom: '24px', marginTop: '16px' }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip formatter={(val) => formatCurrency(val)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
      <section className="panel" style={{ maxWidth: '800px' }}>
        <PanelTitle icon={FiSettings} title="Workspace settings" action="MongoDB Atlas" />
        <div className="settings-grid" style={{ gridTemplateColumns: '1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Signed in as (Read only)</label>
            <input type="text" className="settings-input" value={user.email} disabled style={{ opacity: 0.7 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Company Name</label>
              <input type="text" className="settings-input" defaultValue={user.company || 'Not set'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Timezone</label>
              <select className="settings-input">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Asia/Kolkata</option>
                <option>Europe/London</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>API Base URL</label>
            <input type="text" className="settings-input" defaultValue={process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'} />
          </div>
          <div style={{ marginTop: '12px' }}>
            <button className="create-button" style={{ width: '100%', justifyContent: 'center' }}>Save Preferences</button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>
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
            <button className="icon-control" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            {failedTasks.length > 0 && (
              <button className="create-button outline-action" onClick={() => setFailedTasksOpen(true)} style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                <FiAlertCircle /> Failed Deliveries ({failedTasks.length})
              </button>
            )}
            <button className="icon-control" onClick={loadDashboard} aria-label="Refresh dashboard"><FiRefreshCw /></button>
            <button className="create-button outline-action" onClick={() => setCreateClientOpen(true)}><FiUsers /> Add Client</button>
            <button className="create-button" onClick={() => setCreateInvoiceOpen(true)}><FiPlus /> New invoice</button>
          </div>
        </header>

        {n8nStatus.status === 'offline' && (
          <div className="notice" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span>⚠️</span> n8n automation is currently offline. Reminders are securely queued and will be sent automatically when the system recovers.
          </div>
        )}

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
      <ClientDetailModal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        invoices={invoices}
      />
      <FailedTasksModal 
        isOpen={isFailedTasksOpen} 
        onClose={() => setFailedTasksOpen(false)} 
        tasks={failedTasks}
        onRefresh={loadDashboard}
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, trend, trendDirection, onClick }) {
  return (
    <div className={`metric-card ${tone} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="metric-card-header">
        <div className="metric-icon"><Icon /></div>
        {trend && (
          <span className={`trend-badge ${trendDirection}`}>
            {trendDirection === 'up' ? '↗' : '↘'} {trend}
          </span>
        )}
      </div>
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
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
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
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No invoices found. Click "New invoice" to get started.
              </td>
            </tr>
          ) : invoices.map((invoice) => (
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

function FailedTasksModal({ isOpen, onClose, tasks, onRefresh }) {
  if (!isOpen) return null;

  const dismissTask = async (id) => {
    try {
      await api.delete(`/n8n/failed/${id}`);
      onRefresh();
      if (tasks.length === 1) onClose(); // close if last one dismissed
    } catch (err) {
      console.error('Failed to dismiss task');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Failed Automated Reminders</h2>
          <button className="icon-control" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {tasks.length === 0 ? (
            <p>No failed deliveries! 🎉</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Error</th>
                    <th>Retries</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id}>
                      <td>{new Date(task.createdAt).toLocaleString()}</td>
                      <td>{task.clientId?.name || 'Unknown'}</td>
                      <td>{task.clientId?.email || 'N/A'}</td>
                      <td style={{ color: 'var(--danger-color)' }}>{task.errorLog}</td>
                      <td>{task.retries} / 10</td>
                      <td>
                        <button className="small-button outline-action" onClick={() => dismissTask(task._id)}>Dismiss</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

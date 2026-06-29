import React from 'react';
import { FiX, FiMail, FiMapPin, FiDollarSign, FiClock, FiCheckCircle, FiPhone } from 'react-icons/fi';
import '../styles/Modals.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const ClientDetailModal = ({ isOpen, onClose, client, invoices = [] }) => {
  if (!isOpen || !client) return null;

  // Calculate client specific stats
  const clientInvoices = invoices.filter(inv => 
    inv.clientId?._id === client._id || inv.clientId === client._id
  );
  
  const stats = clientInvoices.reduce((acc, inv) => {
    acc.total += inv.amount || 0;
    if (inv.status === 'paid') acc.paid += inv.amount || 0;
    if (inv.status === 'overdue' || (inv.status !== 'paid' && new Date(inv.dueDate) < new Date())) {
      acc.overdue += inv.amount || 0;
    }
    return acc;
  }, { total: 0, paid: 0, overdue: 0 });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '24px', background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary-color)' }}>
              {(client.company || client.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>{client.company || client.name}</h2>
              {client.company && <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>{client.name}</p>}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)' }}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="client-contact-info" style={{ display: 'grid', gap: '12px', background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <FiMail /> <span>{client.email}</span>
            </div>
            {client.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                <FiPhone /> <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: 'var(--text-secondary)' }}>
                <FiMapPin style={{ marginTop: '4px' }} /> 
                <span>{client.address}<br/>{client.city}, {client.state} {client.zipCode}<br/>{client.country}</span>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>Financial Overview</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
              <FiDollarSign style={{ color: 'var(--primary-color)', marginBottom: '8px', fontSize: '20px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Billed</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(stats.total)}</div>
            </div>
            
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <FiCheckCircle style={{ color: 'var(--success-color)', marginBottom: '8px', fontSize: '20px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Paid</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(stats.paid)}</div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
              <FiClock style={{ color: 'var(--danger-color)', marginBottom: '8px', fontSize: '20px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overdue</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(stats.overdue)}</div>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>Recent Invoices</h3>
          {clientInvoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No invoices found for this client.</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {clientInvoices.slice(0, 5).map(inv => (
                <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{inv.invoiceNumber}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(inv.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong>{formatCurrency(inv.amount)}</strong>
                    <span className={`status-pill ${inv.status}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;

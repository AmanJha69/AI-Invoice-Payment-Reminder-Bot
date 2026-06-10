import React, { useState } from 'react';
import { FiX, FiSave, FiSend, FiTrash2, FiMail } from 'react-icons/fi';
import api from '../services/api';
import '../styles/Modals.css';

const InvoiceDetailModal = ({ isOpen, onClose, invoice, onUpdated, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'save', 'reminder', 'invoice', 'delete'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    status: invoice?.status || 'draft',
    notes: invoice?.notes || '',
    paymentMethod: invoice?.paymentMethod || '',
  });

  if (!isOpen || !invoice) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setActionLoading('save');
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/invoices/${invoice._id}`, formData);
      setSuccess('Invoice updated successfully');
      onUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    setActionLoading('delete');
    setError('');

    try {
      await api.delete(`/invoices/${invoice._id}`);
      onDeleted(invoice._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
      setActionLoading(null);
    }
  };

  const handleSendReminder = async () => {
    setActionLoading('reminder');
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/n8n/reminders/${invoice._id}/send`);
      setSuccess(response.data.message || 'Reminder sent successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvoice = async () => {
    setActionLoading('invoice');
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/n8n/invoices/${invoice._id}/send`);
      setSuccess(response.data.message || 'Invoice sent successfully');
      
      // If it was a draft, update local state to reflect it's likely sent now
      if (formData.status === 'draft') {
        setFormData(prev => ({ ...prev, status: 'sent' }));
        onUpdated({ ...invoice, status: 'sent' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invoice {invoice.invoiceNumber}</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          {success && <div className="modal-success">{success}</div>}

          <div className="modal-detail-grid">
            <div className="modal-detail-card">
              <h3>Client Details</h3>
              <div className="modal-detail-row">
                <span>Name:</span> <span>{invoice.clientId?.name || 'Unknown'}</span>
              </div>
              <div className="modal-detail-row">
                <span>Company:</span> <span>{invoice.clientId?.company || 'N/A'}</span>
              </div>
              <div className="modal-detail-row">
                <span>Email:</span> <span>{invoice.clientId?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="modal-detail-card">
              <h3>Invoice Summary</h3>
              <div className="modal-detail-row">
                <span>Amount:</span> <span>{invoice.amount} {invoice.currency}</span>
              </div>
              <div className="modal-detail-row">
                <span>Due Date:</span> <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="modal-detail-row">
                <span>Created:</span> <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="modal-form-grid">
            <div className="modal-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="modal-form-group">
              <label>Payment Method</label>
              <input type="text" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} placeholder="e.g. Bank Transfer, Stripe" />
            </div>
            <div className="modal-form-group full-width">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <>
              <h3 className="modal-section-title">Line Items</h3>
              <div className="modal-items-container">
                {invoice.items.map((item, index) => (
                  <div key={index} className="modal-item-row" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr' }}>
                    <div className="modal-form-group">
                      <strong>{item.description}</strong>
                    </div>
                    <div>Qty: {item.quantity}</div>
                    <div>{invoice.currency} {item.unitPrice}</div>
                    <div className="modal-item-total">{invoice.currency} {item.total}</div>
                  </div>
                ))}
              </div>
              <div className="modal-grand-total" style={{ marginTop: '12px', padding: '12px' }}>
                <span>Grand Total</span>
                <span>{invoice.currency} {invoice.amount}</span>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            <button className="modal-btn modal-btn-danger" onClick={handleDelete} disabled={actionLoading !== null}>
              <FiTrash2 /> {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="modal-btn modal-btn-cancel" onClick={handleSendInvoice} disabled={actionLoading !== null}>
              <FiMail /> {actionLoading === 'invoice' ? 'Sending...' : 'Send Invoice'}
            </button>
            <button className="modal-btn modal-btn-secondary" onClick={handleSendReminder} disabled={actionLoading !== null}>
              <FiSend /> {actionLoading === 'reminder' ? 'Sending...' : 'Send Reminder'}
            </button>
            <button className="modal-btn modal-btn-submit" onClick={handleUpdate} disabled={actionLoading !== null}>
              <FiSave /> {actionLoading === 'save' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

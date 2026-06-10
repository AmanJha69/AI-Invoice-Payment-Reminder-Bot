import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import '../styles/Modals.css';

const CreateInvoiceModal = ({ isOpen, onClose, onCreated, clients }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    clientId: '',
    currency: 'USD',
    dueDate: '',
    description: '',
    notes: '',
  });
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].total = qty * price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }
    
    setLoading(true);
    setError('');

    const invoiceData = {
      ...formData,
      amount: grandTotal,
      items: items.filter(i => i.description.trim() !== '')
    };

    try {
      const response = await api.post('/invoices', invoiceData);
      onCreated(response.data);
      onClose();
      // Reset form
      setFormData({
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        clientId: '',
        currency: 'USD',
        dueDate: '',
        description: '',
        notes: '',
      });
      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Invoice</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <form onSubmit={handleSubmit} id="create-invoice-form">
            <div className="modal-form-grid">
              <div className="modal-form-group">
                <label>Invoice Number *</label>
                <input type="text" name="invoiceNumber" required value={formData.invoiceNumber} onChange={handleChange} />
              </div>
              <div className="modal-form-group">
                <label>Client *</label>
                <select name="clientId" required value={formData.clientId} onChange={handleChange}>
                  <option value="">Select a client...</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-form-group">
                <label>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}>
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="modal-form-group">
                <label>Due Date *</label>
                <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} />
              </div>
              <div className="modal-form-group full-width">
                <label>Invoice Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Web Design Services - May 2026" />
              </div>
            </div>

            <h3 className="modal-section-title">Line Items</h3>
            <div className="modal-items-container">
              {items.map((item, index) => (
                <div key={index} className="modal-item-row">
                  <div className="modal-form-group">
                    <label>Description</label>
                    <input type="text" required placeholder="Item description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                  </div>
                  <div className="modal-form-group">
                    <label>Qty</label>
                    <input type="number" min="0.1" step="0.1" required value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                  </div>
                  <div className="modal-form-group">
                    <label>Price</label>
                    <input type="number" min="0" step="0.01" required value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="modal-item-total">
                    ${item.total.toFixed(2)}
                  </div>
                  <button type="button" className="modal-remove-btn" onClick={() => removeItem(index)} disabled={items.length === 1}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <button type="button" className="modal-add-item-btn" onClick={addItem}>
              <FiPlus /> Add another item
            </button>

            <div className="modal-grand-total">
              <span>Grand Total</span>
              <span>{formData.currency === 'INR' ? '₹' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '$'} {grandTotal.toFixed(2)}</span>
            </div>

            <h3 className="modal-section-title">Additional Info</h3>
            <div className="modal-form-group">
              <label>Notes (shown on invoice)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Thank you for your business!"></textarea>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="create-invoice-form" className="modal-btn modal-btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;

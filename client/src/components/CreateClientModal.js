import React, { useState } from 'react';
import { FiX, FiUser, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import '../styles/Modals.css';

const CreateClientModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.trim() === '') {
      setError('Client name cannot be empty');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (formData.phone && formData.phone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid phone number (at least 7 digits)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/clients', formData);
      onCreated(response.data);
      onClose();
      // Reset form
      setFormData({
        name: '', email: '', phone: '', company: '',
        address: '', city: '', state: '', zipCode: '', country: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Client</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <form onSubmit={handleSubmit} id="create-client-form">
            <h3 className="modal-section-title"><FiUser /> Basic Info</h3>
            <div className="modal-form-grid">
              <div className="modal-form-group">
                <label>Client Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="modal-form-group">
                <label>Company Name</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Corp" />
              </div>
              <div className="modal-form-group">
                <label>Email Address *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              </div>
              <div className="modal-form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <h3 className="modal-section-title"><FiMapPin /> Billing Address</h3>
            <div className="modal-form-grid">
              <div className="modal-form-group full-width">
                <label>Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Suite 100" />
              </div>
              <div className="modal-form-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="New York" />
              </div>
              <div className="modal-form-group">
                <label>State/Province</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="NY" />
              </div>
              <div className="modal-form-group">
                <label>Zip/Postal Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="10001" />
              </div>
              <div className="modal-form-group">
                <label>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="USA" />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="create-client-form" className="modal-btn modal-btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClientModal;

import React, { useState } from 'react';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import InvoiceTable from './InvoiceTable';
import '../styles/InvoicePanel.css';

function InvoicePanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-001',
      client: 'Acme Corp',
      amount: '$2,500',
      dueDate: '2024-06-15',
      status: 'pending',
    },
    {
      id: 2,
      invoiceNumber: 'INV-002',
      client: 'Tech Solutions',
      amount: '$1,800',
      dueDate: '2024-06-20',
      status: 'paid',
    },
    {
      id: 3,
      invoiceNumber: 'INV-003',
      client: 'Global Industries',
      amount: '$3,200',
      dueDate: '2024-05-30',
      status: 'overdue',
    },
  ]);

  return (
    <div className="invoice-panel">
      <div className="invoice-header">
        <h2>Invoices</h2>
        <button className="create-invoice-btn">
          <FiPlus /> Create Invoice
        </button>
      </div>

      <div className="invoice-controls">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <FiFilter /> Filter
        </button>
      </div>

      <InvoiceTable invoices={invoices} />
    </div>
  );
}

export default InvoicePanel;
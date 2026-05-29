import React from 'react';
import '../styles/InvoiceTable.css';

function InvoiceTable({ invoices }) {
  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  return (
    <div className="invoice-table-container">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.client}</td>
              <td>{invoice.amount}</td>
              <td>{invoice.dueDate}</td>
              <td>
                <span className={getStatusClass(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td>
                <button className="action-btn">View</button>
                <button className="action-btn">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceTable;
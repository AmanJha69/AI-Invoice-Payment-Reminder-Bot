import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import '../styles/Sidebar.css';

function Sidebar({ open }) {
  return (
    <div className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Invoice Bot</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className="nav-link active">
          <FiHome /> Dashboard
        </Link>
        <Link to="/invoices" className="nav-link">
          <FiFileText /> Invoices
        </Link>
        <Link to="/clients" className="nav-link">
          <FiUsers /> Clients
        </Link>
        <Link to="/settings" className="nav-link">
          <FiSettings /> Settings
        </Link>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn">
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
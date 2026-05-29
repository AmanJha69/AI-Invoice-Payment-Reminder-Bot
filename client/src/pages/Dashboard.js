import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InvoicePanel from '../components/InvoicePanel';
import '../styles/Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} />
      <div className="main-content">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-container">
          <InvoicePanel />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
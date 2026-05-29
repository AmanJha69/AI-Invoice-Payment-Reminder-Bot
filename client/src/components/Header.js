import React from 'react';
import { FiMenu, FiBell, FiUser } from 'react-icons/fi';
import '../styles/Header.css';

function Header({ toggleSidebar }) {
  return (
    <div className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <FiMenu />
        </button>
        <h1>Dashboard</h1>
      </div>
      <div className="header-right">
        <button className="icon-btn">
          <FiBell />
        </button>
        <button className="icon-btn">
          <FiUser />
        </button>
      </div>
    </div>
  );
}

export default Header;
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Landing from './pages/Landing';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('invoiceBotTheme') || 'light');

  useEffect(() => {
    const savedUser = localStorage.getItem('invoiceBotUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('invoiceBotToken');
        localStorage.removeItem('invoiceBotUser');
      }
    }
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('invoiceBotTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const logout = () => {
    localStorage.removeItem('invoiceBotToken');
    localStorage.removeItem('invoiceBotUser');
    setUser(null);
  };

  if (checkingSession) {
    return <div className="boot-screen">Loading workspace...</div>;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
          <Route path="/dashboard/*" element={user ? <Dashboard user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

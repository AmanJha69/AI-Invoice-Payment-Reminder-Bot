import React, { useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiCreditCard, FiLock, FiMail, FiUser } from 'react-icons/fi';
import api from '../services/api';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
  });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      const user = data.user || data;
      localStorage.setItem('invoiceBotToken', data.token || `n8n-session-${Date.now()}`);
      localStorage.setItem('invoiceBotUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="brand-lockup">
          <div className="brand-mark">
            <FiCreditCard />
          </div>
          <span>InvoicePilot AI</span>
        </div>
        <div className="showcase-copy">
          <p className="eyebrow">AI invoice and payment reminder bot</p>
          <h1>Track invoices, automate reminders, and keep payment follow-ups moving.</h1>
          <p>
            An enterprise-grade financial command center: seamlessly sync your MongoDB data, track client history, and execute AI-driven n8n bot operations all in one place.
          </p>
        </div>
        <div className="showcase-grid">
          <div>
            <span>Collection rate</span>
            <strong>86%</strong>
          </div>
          <div>
            <span>AI reminders</span>
            <strong>42</strong>
          </div>
          <div>
            <span>Overdue risk</span>
            <strong>Low</strong>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs" aria-label="Authentication mode">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Sign up
            </button>
          </div>

          <div className="auth-heading">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
            <p>{mode === 'login' ? 'Access your invoice dashboard.' : 'Create your account to get started.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <label>
                  <span>Name</span>
                  <div className="input-shell">
                    <FiUser />
                    <input name="name" value={form.name} onChange={updateField} placeholder="Aman Jha" required />
                  </div>
                </label>
                <label>
                  <span>Company</span>
                  <div className="input-shell">
                    <FiCheckCircle />
                    <input name="company" value={form.company} onChange={updateField} placeholder="Internship Project" />
                  </div>
                </label>
              </>
            )}
            <label>
              <span>Email</span>
              <div className="input-shell">
                <FiMail />
                <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-shell">
                <FiLock />
                <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Minimum 6 characters" required />
              </div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-action" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login to dashboard' : 'Create account'}
              <FiArrowRight />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;

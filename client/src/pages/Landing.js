import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCpu, FiClock, FiFileText, FiShield, FiSun, FiMoon } from 'react-icons/fi';
import '../styles/Landing.css';

function Landing({ theme, toggleTheme }) {
  const navigate = useNavigate();

  // Generate random positions and delays for floating symbols
  const floatingElements = React.useMemo(() => {
    const symbols = ['₹', '$', '€', '£', '⚡', 'AI', '📈', '🚀', '💸'];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      left: `${Math.random() * 100}%`,
      animationDuration: `${15 + Math.random() * 15}s`,
      animationDelay: `${Math.random() * 5}s`,
      fontSize: `${1.5 + Math.random() * 2}rem`,
      opacity: 0.1 + Math.random() * 0.2
    }));
  }, []);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="landing-logo">
          <FiCpu className="text-indigo-600" />
          <span>InvoiceBot</span>
        </div>
        <div className="flex items-center" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>
          <button onClick={() => navigate('/login')} className="login-btn">
            Log In
          </button>
          <button onClick={() => navigate('/login')} className="signup-btn">
            Sign Up
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="floating-symbols-container">
            {floatingElements.map(el => (
              <div 
                key={el.id} 
                className="floating-symbol"
                style={{
                  left: el.left,
                  bottom: '-20%',
                  animationDuration: el.animationDuration,
                  animationDelay: el.animationDelay,
                  fontSize: el.fontSize,
                  opacity: el.opacity,
                  color: 'var(--primary-color)'
                }}
              >
                {el.symbol}
              </div>
            ))}
          </div>
          
          <div className="hero-badge">✨ Powered by Google Gemini AI</div>
          <h1 className="hero-title">
            The intelligent way to collect <span>payments.</span>
          </h1>
          <p className="hero-subtitle">
            InvoiceBot is an enterprise-grade SaaS that automatically generates PDFs, tracks your clients, and uses AI to write personalized payment reminders when they are late. Stop chasing money manually.
          </p>
          <button onClick={() => navigate('/login')} className="hero-cta">
            Start automating now <FiArrowRight />
          </button>
        </section>

        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiCpu />
              </div>
              <h3 className="feature-title">AI-Powered Reminders</h3>
              <p className="feature-description">
                Our integration with Google Gemini analyzes exactly how many days a payment is overdue and dynamically generates a polite, contextual, or firm email reminder.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiClock />
              </div>
              <h3 className="feature-title">Automated Cron Jobs</h3>
              <p className="feature-description">
                Set it and forget it. Our background tasks wake up daily to scan your MongoDB database for late payments and automatically dispatch Webhooks to n8n.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FiFileText />
              </div>
              <h3 className="feature-title">Dynamic PDF Generation</h3>
              <p className="feature-description">
                Generate stunning, professional PDF invoices instantly on the server side with PDFKit, securely attached to every dispatched email.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3 className="feature-title">Secure Gmail Delivery</h3>
              <p className="feature-description">
                Bypass cloud SMTP firewalls completely. We use OAuth 2.0 to hook directly into the official Gmail API, ensuring 100% deliverability to the inbox.
              </p>
            </div>
          </div>
        </section>

        <section className="how-it-works-section">
          <h2 className="section-title">How InvoiceBot works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Sync Your Data</h3>
              <p className="step-desc">Connect InvoiceBot to your MongoDB database. It securely pulls your client list and open invoices automatically.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">AI Assessment</h3>
              <p className="step-desc">Google Gemini AI reviews the outstanding balances, due dates, and client history to draft the perfect email or WhatsApp message.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Automated Dispatch</h3>
              <p className="step-desc">n8n workflows take over, securely delivering the AI-generated message and tracking when the invoice is finally paid.</p>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stat-item">
            <div className="stat-number">99%</div>
            <div className="stat-label">On-time Payments</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Invoices Processed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Automated Chasing</div>
          </div>
        </section>

        <section className="steps-section">
          <h2 className="steps-title">How it works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create Client</h3>
              <p className="feature-description">Add your client's details into the secure MongoDB dashboard.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Send Invoice</h3>
              <p className="feature-description">We generate a gorgeous PDF and instantly email it via Gmail API.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">AI Follow-up</h3>
              <p className="feature-description">If they are late, Gemini AI writes and sends the perfect reminder.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Landing;

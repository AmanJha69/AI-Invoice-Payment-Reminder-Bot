import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          height: '100vh', background: '#f8fafc', padding: '40px', fontFamily: 'system-ui, sans-serif'
        }}>
          <FiAlertTriangle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>Something went wrong.</h1>
          <p style={{ color: '#64748b', marginBottom: '20px', maxWidth: '500px', textAlign: 'center' }}>
            We encountered an unexpected issue while rendering the application. 
            Please refresh the page to try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Refresh Application
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: '40px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '800px', overflowX: 'auto' }}>
              <h3 style={{ color: '#ef4444', marginTop: 0 }}>{this.state.error.toString()}</h3>
              <pre style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

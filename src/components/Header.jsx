import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, showLogout = true }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('sessionId');
    
    // Redirect to home page
    navigate('/');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <header style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '1rem 0'
    }}>
      <div className="container">
        <div className="d-flex align-items-center justify-content-between">
          {/* Logo/Brand */}
          <div className="d-flex align-items-center">
            <button 
              onClick={goToDashboard}
              className="btn-modern btn-secondary"
              style={{ 
                padding: '0.5rem 1rem',
                marginRight: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}
            >
              Interview<span className="gradient-text">IQ</span>
            </button>
            {title && (
              <>
                <span style={{ color: 'var(--text-muted)', margin: '0 1rem' }}>|</span>
                <h1 style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '0' 
                }}>
                  {title}
                </h1>
              </>
            )}
          </div>
          
          {/* Navigation Actions */}
          {showLogout && (
            <div className="d-flex align-items-center gap-3">
              <button
                onClick={goToDashboard}
                className="btn-modern btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                <span>🏠</span>
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="btn-modern btn-outline"
                style={{ 
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid var(--danger-color)',
                  color: 'var(--danger-color)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'var(--danger-color)';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--danger-color)';
                }}
              >
                <span>🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

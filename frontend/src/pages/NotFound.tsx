import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center' }}>
      <span style={{ fontSize: '5rem', display: 'block', marginBottom: '24px' }}>🗺️</span>
      <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding: '12px 28px' }}>
        Return to Home Portal
      </Link>
    </div>
  );
};

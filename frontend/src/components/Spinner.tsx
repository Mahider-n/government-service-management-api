import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div className="spinner"></div>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading...</p>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="skeleton" style={{ height: '24px', width: '40%' }}></div>
      <div className="skeleton" style={{ height: '16px', width: '80%' }}></div>
      <div className="skeleton" style={{ height: '16px', width: '60%' }}></div>
      <div className="skeleton" style={{ height: '36px', width: '100%', marginTop: '8px' }}></div>
    </div>
  );
};

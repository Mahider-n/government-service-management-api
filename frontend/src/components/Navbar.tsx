import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
      <div className="container flex items-center justify-between" style={{ height: '72px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          <span style={{ fontSize: '1.8rem' }}>🏛️</span>
          <span>Kebele Portal</span>
        </Link>

        {/* Desktop Menu */}
        <div className="flex items-center gap-3" style={{ display: 'none', md: 'flex' } /* We'll use CSS for responsive hidden/visible */ }>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
              {user.is_admin && (
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Admin Panel</NavLink>
              )}
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button className="btn btn-secondary" onClick={toggleTheme} style={{ padding: '8px 12px', fontSize: '1.1rem', borderRadius: 'var(--radius-full)' }} aria-label="Toggle Theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }} className="hide-mobile">
                Hi, {user.full_name.split(' ')[0]}
              </span>
              {user.profile_picture && (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
                  className="hide-mobile"
                />
              )}
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Register</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={toggleMenu} className="btn btn-secondary mobile-menu-toggle" style={{ padding: '8px 12px', fontSize: '1.2rem' }}>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="glass" style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" onClick={toggleMenu}>Home</Link>
          {user && (
            <>
              <Link to="/dashboard" onClick={toggleMenu}>Dashboard</Link>
              {user.is_admin && (
                <Link to="/admin" onClick={toggleMenu}>Admin Panel</Link>
              )}
              <Link to="/profile" onClick={toggleMenu}>Profile</Link>
            </>
          )}
        </div>
      )}

      {/* Embedded stylesheet rules for Navbar */}
      <style>{`
        .nav-link {
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--primary);
          background-color: var(--primary-glow);
        }
        .mobile-menu-toggle {
          display: none;
        }
        .hide-mobile {
          display: inline-block;
        }
        @media (max-width: 768px) {
          .nav-link {
            display: none;
          }
          .mobile-menu-toggle {
            display: inline-flex;
          }
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

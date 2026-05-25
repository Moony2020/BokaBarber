'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'shop_admin' | 'barber' | 'customer';
  firstName: string;
  lastName: string;
  shopId?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kontrollera om användaren är inloggad via localStorage eller session
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Anropa utloggnings-API
      await fetch('http://localhost:5000/api/v1/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/super';
    if (user.role === 'shop_admin' && user.shopId) return `/admin/${user.shopId}`;
    return '/';
  };

  return (
    <header className="navbar-container">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          Boka<span>Barber</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          <Link href="/sok" className="nav-link">Sök Salong</Link>
          <Link href="/#priser" className="nav-link">Priser</Link>
          <Link href="/#funktioner" className="nav-link">Funktioner</Link>
          
          {!user && (
            <Link href="/registrera-salong" className="nav-link nav-highlight">
              För företag
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              <Link href={getDashboardLink()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                Instrumentpanel
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                Logga ut
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              Logga in
            </Link>
          )}

          {/* Mobile menu button */}
          <button className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {menuOpen && (
        <div className="mobile-nav-panel animate-fade-in">
          <Link href="/sok" className="mobile-link" onClick={() => setMenuOpen(false)}>Sök Salong</Link>
          <Link href="/#priser" className="mobile-link" onClick={() => setMenuOpen(false)}>Priser</Link>
          <Link href="/#funktioner" className="mobile-link" onClick={() => setMenuOpen(false)}>Funktioner</Link>
          {!user && (
            <Link href="/registrera-salong" className="mobile-link mobile-highlight" onClick={() => setMenuOpen(false)}>
              För företag (Registrera Salong)
            </Link>
          )}
          {user ? (
            <>
              <Link href={getDashboardLink()} className="mobile-link" onClick={() => setMenuOpen(false)}>
                Instrumentpanel ({user.firstName})
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="mobile-logout-btn">
                Logga ut
              </button>
            </>
          ) : (
            <Link href="/login" className="mobile-login-btn" onClick={() => setMenuOpen(false)}>
              Logga in
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .navbar-container {
          background-color: var(--glass-bg);
          border-bottom: 1px solid var(--border-color);
          backdrop-filter: var(--glass-blur);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 80px;
          display: flex;
          align-items: center;
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          font-family: var(--font-primary);
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .navbar-logo span {
          color: var(--primary);
        }
        .navbar-nav {
          display: none;
          align-items: center;
          gap: 32px;
        }
        @media (min-width: 768px) {
          .navbar-nav {
            display: flex;
          }
        }
        .nav-link {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .nav-link:hover {
          color: var(--primary);
        }
        .nav-highlight {
          color: var(--primary);
          border-bottom: 2px solid transparent;
        }
        .nav-highlight:hover {
          border-bottom-color: var(--primary);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .menu-toggle {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: transparent;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .menu-toggle {
            display: none;
          }
        }
        .menu-toggle span {
          width: 100%;
          height: 2px;
          background-color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        .menu-toggle.open span:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .menu-toggle.open span:nth-child(2) {
          opacity: 0;
        }
        .menu-toggle.open span:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }
        /* Mobile menu */
        .mobile-nav-panel {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-lg);
        }
        @media (min-width: 768px) {
          .mobile-nav-panel {
            display: none;
          }
        }
        .mobile-link {
          font-family: var(--font-primary);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .mobile-link:hover {
          color: var(--primary);
        }
        .mobile-highlight {
          color: var(--primary);
        }
        .mobile-logout-btn {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: var(--radius-md);
          font-weight: 600;
          color: var(--color-danger);
          cursor: pointer;
        }
        .mobile-login-btn {
          background-color: var(--primary);
          color: var(--text-white);
          padding: 12px;
          border-radius: var(--radius-md);
          font-weight: 600;
          text-align: center;
        }
      `}</style>
    </header>
  );
}

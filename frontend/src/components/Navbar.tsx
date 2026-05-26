'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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
  const [activeHash, setActiveHash] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/super');

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const handleScroll = () => {
      // Trigger area offset for sticky header height
      const scrollPosition = window.scrollY + 120;
      const sections = ['funktioner', 'priser'];
      let found = false;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveHash('#' + sectionId);
            found = true;
            break;
          }
        }
      }

      if (!found && window.scrollY < 200) {
        setActiveHash('');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    // Listen to local and storage events for reactive sync
    window.addEventListener('auth-change', loadUser);
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('auth-change', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/v1/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      setUser(null);
      window.dispatchEvent(new Event('auth-change'));
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
    <header className={`navbar-container ${isDashboard ? 'dashboard-navbar' : 'public-navbar'}`}>
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo" aria-label="BokaBarber startsida">
          <svg className="barber-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', width: 'var(--logo-icon-size, 34px)', height: 'var(--logo-icon-size, 34px)', filter: 'drop-shadow(0 2px 4px rgba(197, 160, 89, 0.15))' }}>
            <circle cx="6" cy="6" r="3" />
            <path d="M8.12 8.12 12 12" />
            <path d="M20 4 12 12" />
            <circle cx="6" cy="18" r="3" />
            <path d="M9.8 14.2 12 12" />
            <path d="M20 20 12 12" />
          </svg>
          <span className="brand-wordmark"><span className="brand-main">Boka</span><span className="brand-accent">Barber</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          <Link href="/sok" className={`nav-link ${pathname === '/sok' ? 'active' : ''}`}>Tjänster</Link>
          <Link href="/#priser" className={`nav-link ${activeHash === '#priser' ? 'active' : ''}`}>Priser</Link>
          <Link href="/#funktioner" className={`nav-link ${activeHash === '#funktioner' ? 'active' : ''}`}>Om oss</Link>
          
          {!user && (
            <Link href="/registrera-salong" className={`nav-link nav-highlight ${pathname === '/registrera-salong' ? 'active' : ''}`}>
              Anslut salong
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              <Link href={getDashboardLink()} className="btn btn-secondary btn-dashboard-nav" aria-label="Instrumentpanel">
                <span className="dashboard-text">Instrumentpanel</span>
                <svg className="dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-logout-nav" style={{ padding: '8px 16px', fontSize: '0.95rem', borderWidth: '1px' }}>
                Logga ut
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-booking-nav" aria-label="Logga in">
              <span className="login-text">Logga in</span>
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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
        <div className={`mobile-nav-panel animate-fade-in ${isDashboard ? 'dashboard-mobile-nav' : 'public-mobile-nav'}`}>
          <Link href="/sok" className={`mobile-link ${pathname === '/sok' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Tjänster</Link>
          <Link href="/#priser" className={`mobile-link ${activeHash === '#priser' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Priser</Link>
          <Link href="/#funktioner" className={`mobile-link ${activeHash === '#funktioner' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Om oss</Link>
          {!user && (
            <Link href="/registrera-salong" className={`mobile-link mobile-highlight ${pathname === '/registrera-salong' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Anslut salong (14 dagar gratis)
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

    </header>
  );
}

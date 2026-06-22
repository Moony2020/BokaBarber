'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/utils/api';

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

  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/super') || pathname === '/dashboard';

  // Shop booking pages — any single-segment path that isn't a known public route
  const KNOWN_PUBLIC = ['/', '/sok', '/login', '/registrera-salong', '/kontakt', '/support',
    '/terms', '/privacy', '/glomt-losenord', '/aterstall-losenord'];
  const isShopPage = !isDashboard && !!pathname &&
    !KNOWN_PUBLIC.includes(pathname) &&
    pathname.split('/').filter(Boolean).length === 1;

  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const handleScroll = () => {
      // Trigger area offset for sticky header height
      const scrollPosition = window.scrollY + 80;
      const sections = ['funktioner', 'design', 'priser', 'faq'];
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

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(prev => prev ? false : prev);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

  useEffect(() => {
    // Load from localStorage immediately so Instrumentpanel shows without waiting for API
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        Promise.resolve().then(() => {
          try {
            setUser(JSON.parse(stored));
          } catch {}
        });
      }
    } catch {}

    const loadUser = async () => {
      try {
        const res = await api.me();
        if (res.ok) {
          const data = res.data as { user: User };
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } catch {
        // Network error — keep localStorage user so Instrumentpanel still works
      }
    };

    loadUser();

    window.addEventListener('auth-change', loadUser);
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('auth-change', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const hideMarketingLinks = isDashboard || isShopPage;

  return (
    <header ref={navbarRef} className={`navbar-container ${isDashboard ? 'dashboard-navbar' : 'public-navbar'}${menuOpen ? ' menu-open' : ''}`}>
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo" aria-label="BokaBarber startsida">
          <Image unoptimized priority src="/brand-logo.png" alt="BokaBarber logo" width={45} height={45} className="barber-logo-icon navbar-logo-icon" style={{ width: '45px', height: 'auto', objectFit: 'contain' }} />
          <span className="brand-wordmark"><span className="brand-main">Boka</span><span className="brand-accent">Barber</span></span>
        </Link>

        {/* Marketing nav — hidden on admin and shop booking pages */}
        {!hideMarketingLinks && (
          <nav className="navbar-nav">
            <Link href="/#funktioner" className={`nav-link ${activeHash === '#funktioner' ? 'active' : ''}`}>Funktioner</Link>
            <Link href="/#priser" className={`nav-link ${activeHash === '#priser' ? 'active' : ''}`}>Prissättning</Link>
            <Link href="/#design" className={`nav-link ${activeHash === '#design' ? 'active' : ''}`}>Design</Link>
            <Link href="/#faq" className={`nav-link ${activeHash === '#faq' ? 'active' : ''}`}>Om Oss</Link>
          </nav>
        )}

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              <button onClick={goToDashboard} className="btn btn-secondary btn-dashboard-nav" aria-label="Instrumentpanel">
                <span className="dashboard-text">Instrumentpanel</span>
                <svg className="dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
              </button>
              <button onClick={handleLogout} className="btn btn-outline btn-logout-nav">
                Logga ut
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-login-nav">Logga in</Link>
              <Link href="/sok" className="btn btn-primary btn-booking-nav" aria-label="Boka nu">
                <span className="login-text">Boka Nu</span>
                <svg className="booking-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button 
            className={`menu-toggle ${menuOpen ? 'open' : ''}`} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
            title={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {menuOpen && (
          <div className={`mobile-nav-panel animate-fade-in ${isDashboard ? 'dashboard-mobile-nav' : 'public-mobile-nav'}`}>
            <Link href="/#funktioner" className={`mobile-link ${activeHash === '#funktioner' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Funktioner</Link>
            <Link href="/#priser" className={`mobile-link ${activeHash === '#priser' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Prissättning</Link>
            <Link href="/#design" className={`mobile-link ${activeHash === '#design' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Design</Link>
            <Link href="/#faq" className={`mobile-link ${activeHash === '#faq' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Om Oss</Link>
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); goToDashboard(); }} className="mobile-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  Instrumentpanel ({user.firstName})
                </button>
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
      </div>

    </header>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/super') || pathname === '/dashboard';
  if (pathname === '/dashboard') return null;

  return (
    <footer className={`footer ${isDashboard ? 'dashboard-footer' : 'public-footer'}`}>
      {!isDashboard ? (
        <>
          <div className="container footer-grid">
            <div className="footer-brand">
              <Link href="/" className="footer-logo" aria-label="BokaBarber startsida">
                <svg className="barber-logo-icon footer-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <path d="M8.12 8.12 12 12" />
                  <path d="M20 4 12 12" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M9.8 14.2 12 12" />
                  <path d="M20 20 12 12" />
                </svg>
                <span className="brand-wordmark"><span className="brand-main">Boka</span><span className="brand-accent">Barber</span></span>
              </Link>
              <p className="brand-text">
                Skandinaviens ledande premiumplattform för professionell barberarservice och salongshantering. Vi förenar tradition med modern SaaS-effektivitet.
              </p>

              {/* Elegant social media icons using custom vector SVGs */}
              <div className="social-links">
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-title">Plattformen</h4>
              <Link href="/sok" className="footer-link">Tjänster</Link>
              <Link href="/#priser" className="footer-link">Priser</Link>
              <Link href="/#funktioner" className="footer-link">Om oss</Link>
              <Link href="/#faq" className="footer-link">Vanliga frågor</Link>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-title">För salonger</h4>
              <Link href="/registrera-salong" className="footer-link">Anslut salong</Link>
              <Link href="/login" className="footer-link">Logga in till Admin</Link>
              <Link href="/#priser" className="footer-link">Prisplaner</Link>
              <Link href="/support" className="footer-link">Support & Manualer</Link>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-title">Populära val</h4>
              <Link href="/sok?q=klippning" className="footer-link">Herrklippning</Link>
              <Link href="/sok?q=skägg" className="footer-link">Skäggtrimning</Link>
              <Link href="/sok?q=ritual" className="footer-link">Signaturritualen</Link>
              <Link href="/sok?q=rakning" className="footer-link">Knivrakning</Link>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-title">Kontakt</h4>

              <a href="mailto:support@bokabarber.se" className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                support@bokabarber.se
              </a>

              <span className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Stockholm, Sverige
              </span>

              <span className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Mån-Fre: 09:00 - 17:00
              </span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="container footer-bottom-inner">
              <p>&copy; {new Date().getFullYear()} BokaBarber AB. Skandinavisk Lyx.</p>
              <div className="footer-legal">
                <Link href="/privacy" className="legal-link">Integritetspolicy</Link>
                <Link href="/terms" className="legal-link">Villkor</Link>
                <Link href="/support" className="legal-link">Support</Link>
                <Link href="/kontakt" className="legal-link">Kontakt</Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="container dashboard-footer-content">
          <div className="dashboard-footer-left">
            <span>BokaBarber Admin Dashboard v1.0</span>
          </div>
          <div className="dashboard-footer-right">
            <span>&copy; {new Date().getFullYear()} BokaBarber AB. Skandinavisk Lyx.</span>
            <Link href="/privacy" className="dashboard-legal-link">Integritet</Link>
            <Link href="/terms" className="dashboard-legal-link">Villkor</Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        .footer {
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        .public-footer {
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          padding: 80px 0 32px 0;
          border-top: 1px solid var(--border-color);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1fr 1.2fr;
          gap: 40px;
          margin-bottom: 64px;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          .footer-brand {
            grid-column: span 3;
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .footer-brand {
            grid-column: span 1;
          }
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          font-family: var(--font-primary);
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          line-height: 1;
          transition: all var(--transition-fast);
        }

        .barber-logo-icon {
          flex-shrink: 0;
          width: var(--logo-icon-size, 22px);
          height: var(--logo-icon-size, 22px);
        }

        .footer-brand-icon {
          color: var(--accent);
          width: var(--logo-icon-size, 34px);
          height: var(--logo-icon-size, 34px);
          filter: drop-shadow(0 2px 4px rgba(197, 160, 89, 0.15));
        }

        .brand-wordmark {
          display: inline-flex;
          align-items: center;
        }

        .brand-main {
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-weight: 800;
        }

        .brand-accent {
          color: var(--accent);
          font-family: var(--font-primary);
          font-weight: 800;
          margin-left: 5px;
        }

        @media (max-width: 600px) {
          .footer-logo {
            font-size: 0.95rem;
            gap: 3px;
          }

          .barber-logo-icon {
            width: var(--logo-icon-size, 18px);
            height: var(--logo-icon-size, 18px);
          }
        }



        .brand-text {
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 320px;
          color: var(--text-secondary);
        }

        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .social-icon:hover {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        .footer-title {
          color: var(--primary);
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 20px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .footer-links-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-link {
          font-size: 0.95rem;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .footer-link:hover {
          color: var(--primary);
        }

        .contact-item {
          font-size: 0.95rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .contact-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .footer-bottom {
          border-top: 1px solid var(--border-color);
          padding-top: 32px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .footer-bottom-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .footer-bottom-inner {
            flex-direction: row;
          }
        }

        .footer-legal {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .legal-link {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .legal-link:hover {
          color: var(--primary);
        }

        /* 🏢 DASHBOARD LIGHT THEME FOOTER */
        .dashboard-footer {
          background-color: var(--bg-secondary) !important;
          border-top: 1px solid var(--border-color) !important;
          color: var(--text-secondary) !important;
          padding: 24px 0 !important;
        }

        .dashboard-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .dashboard-footer-content {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }

        .dashboard-footer-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dashboard-legal-link {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .dashboard-legal-link:hover {
          color: var(--text-primary);
        }
      `}</style>
    </footer>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            Boka<span>Barber</span>
          </Link>
          <p className="brand-text">
            Sveriges premiumplattform för frisörer och barbershops. Hantera bokningar, kunder och intäkter på ett och samma ställe.
          </p>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-title">Plattformen</h4>
          <Link href="/sok" className="footer-link">Sök Salong</Link>
          <Link href="/#funktioner" className="footer-link">Funktioner</Link>
          <Link href="/#priser" className="footer-link">Priser</Link>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-title">För Företag</h4>
          <Link href="/registrera-salong" className="footer-link">Anslut din salong</Link>
          <Link href="/login" className="footer-link">Logga in salong</Link>
          <Link href="/#support" className="footer-link">Support</Link>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-title">Kontakt & Info</h4>
          <p className="contact-item">📧 support@bokabarber.se</p>
          <p className="contact-item">🇸🇪 Stockholm, Sverige</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; {new Date().getFullYear()} BokaBarber. Alla rättigheter reserverade.</p>
          <div className="footer-legal">
            <Link href="/privacy" className="legal-link">Integritetspolicy</Link>
            <Link href="/terms" className="legal-link">Användarvillkor</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background-color: var(--secondary-hover);
          color: #94a3b8; /* Gray 400 */
          padding: 64px 0 24px 0;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 48px;
        }
        .footer-brand {
          grid-column: span 2;
        }
        @media (max-width: 768px) {
          .footer-brand {
            grid-column: span 1;
          }
        }
        .footer-logo {
          font-family: var(--font-primary);
          font-size: 1.8rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.5px;
          display: inline-block;
          margin-bottom: 16px;
        }
        .footer-logo span {
          color: var(--primary);
        }
        .brand-text {
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 320px;
        }
        .footer-title {
          color: #f8fafc;
          font-size: 1.1rem;
          margin-bottom: 20px;
        }
        .footer-links-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-link {
          font-size: 0.95rem;
          transition: color var(--transition-fast);
        }
        .footer-link:hover {
          color: var(--primary);
        }
        .contact-item {
          font-size: 0.95rem;
        }
        .footer-bottom {
          border-top: 1px solid #334155;
          padding-top: 24px;
          font-size: 0.85rem;
        }
        .footer-bottom-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .footer-bottom-inner {
            flex-direction: row;
          }
        }
        .footer-legal {
          display: flex;
          gap: 24px;
        }
        .legal-link:hover {
          color: var(--primary);
        }
      `}</style>
    </footer>
  );
}

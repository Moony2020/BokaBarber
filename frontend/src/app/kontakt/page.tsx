'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="public-theme contact-page-container animate-fade-in">
      <div className="container contact-inner">
        <div className="glass-panel contact-card">
          <div className="contact-header text-center">
            <span className="badge-gold">DITT PREMIUM-SUPPORT</span>
            <h1>Kontakta BokaBarber</h1>
            <p className="subtitle">Vi ser fram emot att hjälpa dig lyckas med din salong</p>
          </div>

          <div className="contact-content-layout">
            {/* Left side: Contact Info */}
            <div className="contact-info-column">
              <div className="info-block">
                <h3>Vårt huvudkontor</h3>
                <p className="address-detail">
                  💈 BokaBarber AB<br />
                  Kungsgatan 12, Plan 3<br />
                  111 35 Stockholm, Sverige
                </p>
              </div>

              <div className="info-block">
                <h3>Support &amp; Försäljning</h3>
                <div className="contact-links-list">
                  <div className="link-item">
                    <span className="icon">✉️</span>
                    <div>
                      <strong>Allmän support:</strong><br />
                      <a href="mailto:support@bokabarber.se" className="gold-link">support@bokabarber.se</a>
                    </div>
                  </div>
                  <div className="link-item">
                    <span className="icon">💼</span>
                    <div>
                      <strong>Salongsanslutning:</strong><br />
                      <a href="mailto:salong@bokabarber.se" className="gold-link">salong@bokabarber.se</a>
                    </div>
                  </div>
                  <div className="link-item">
                    <span className="icon">📞</span>
                    <div>
                      <strong>Telefon:</strong><br />
                      08-123 45 67 (Mån-Fre: 09:00 - 17:00)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Contact Form */}
            <div className="contact-form-column">
              {submitted ? (
                <div className="success-banner card-premium text-center">
                  <span className="success-icon">✉️</span>
                  <h3>Ditt meddelande har skickats!</h3>
                  <p>Tack för att du kontaktar oss. En av våra produktspecialister återkommer till dig inom 2 timmar under ordinarie arbetstid.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label className="form-label">Namn</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Ditt fullständiga namn" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-postadress</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="namn@salong.se" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ämne</label>
                    <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="form-input" placeholder="Vad gäller ditt meddelande?" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meddelande</label>
                    <textarea required value={message} onChange={e => setMessage(e.target.value)} className="form-input" rows={5} placeholder="Skriv ditt meddelande här..." style={{ resize: 'none' }}></textarea>
                  </div>

                  <button type="submit" disabled={sending} className="btn btn-primary send-btn">
                    {sending ? 'Skickar...' : 'Skicka meddelande'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="contact-footer text-center">
            <Link href="/" className="btn btn-primary">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-page-container {
          min-height: calc(100vh - 160px);
          padding: 60px 24px;
          background: radial-gradient(circle at 80% 20%, rgba(197, 160, 89, 0.04) 0%, transparent 50%);
        }
        .contact-inner {
          max-width: 960px;
        }
        .contact-card {
          padding: 32px 28px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
        }
        .contact-header {
          margin-bottom: 14px;
        }
        .badge-gold {
          display: inline-block;
          padding: 6px 14px;
          background-color: var(--primary-light);
          color: var(--primary);
          border: 1px solid rgba(197, 160, 89, 0.3);
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
        }
        .contact-header h1 {
          font-size: 2.4rem;
          color: var(--primary);
          margin-bottom: 6px;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }
        .contact-content-layout {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 24px;
          margin-bottom: 16px;
        }
        .contact-info-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .info-block h3 {
          font-size: 1.3rem;
          color: var(--primary);
          margin-bottom: 8px;
          font-family: var(--font-primary);
        }
        .address-detail {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .contact-links-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .link-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .link-item .icon {
          font-size: 1.3rem;
          line-height: 1.2;
        }
        .gold-link {
          color: var(--accent);
          font-weight: 700;
        }
        .contact-form-column {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .contact-form :global(.form-group) {
          margin-bottom: 0 !important;
          gap: 2px !important;
        }
        .contact-form :global(.form-label) {
          margin-bottom: 1px;
          font-size: 0.92rem;
        }
        .contact-form :global(.form-input) {
          min-height: 44px;
          padding: 9px 12px;
        }
        .send-btn {
          width: 100%;
          min-height: 44px;
          justify-content: center;
          margin-top: 2px;
        }
        .success-banner {
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .success-icon {
          font-size: 3rem;
          line-height: 1;
        }
        .success-banner h3 {
          font-size: 1.4rem;
          color: var(--primary);
        }
        .success-banner p {
          color: var(--text-secondary);
          font-size: 0.98rem;
          line-height: 1.6;
        }
        .contact-footer {
          margin-top: 32px;
          border-top: 1px solid var(--border-color);
          padding-top: 24px;
        }
        @media (max-width: 768px) {
          .contact-content-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 600px) {
          .contact-page-container {
            padding: 40px 16px;
          }
          .contact-card {
            padding: 20px 16px;
          }
          .contact-form-column {
            padding: 16px;
          }
          .contact-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

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
                    <textarea required value={message} onChange={e => setMessage(e.target.value)} className="form-input resize-none" rows={5} placeholder="Skriv ditt meddelande här..." ></textarea>
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

    </div>
  );
}

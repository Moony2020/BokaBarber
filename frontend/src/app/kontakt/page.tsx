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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      {/* Decorative Background Glows */}
      <div className="decor-glow glow-1"></div>
      <div className="decor-glow glow-2"></div>
      <div className="decor-glow glow-3"></div>

      <div className="container contact-inner">
        <div className="glass-panel contact-card">
          <div className="contact-header text-center">
            <div className="badge-gold-wrapper">
              <span className="badge-gold">DITT PREMIUM-SUPPORT</span>
              <span className="support-status-dot-pulse">
                <span className="dot"></span>
                Svarstid: ~15 min
              </span>
            </div>
            <h1>Kontakta BokaBarber</h1>
            <p className="subtitle">Vi ser fram emot att hjälpa dig lyckas med din salong</p>
          </div>

          <div className="contact-content-layout">
            {/* Left side: Contact Info */}
            <div className="contact-info-column">
              <div className="info-block contact-info-card card-hover-effect">
                <div className="info-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-svg">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3>Vårt huvudkontor</h3>
                  <p className="address-detail">
                    <strong>BokaBarber AB</strong><br />
                    Kungsgatan 12, Plan 3<br />
                    111 35 Stockholm, Sverige
                  </p>
                </div>
              </div>

              <div className="info-block support-sales-card">
                <h3>Support &amp; Försäljning</h3>
                <div className="contact-links-list">
                  <a href="mailto:support@bokabarber.se" className="link-item link-hover-card">
                    <div className="link-icon-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <strong>Allmän support</strong>
                      <span className="gold-link block">support@bokabarber.se</span>
                    </div>
                  </a>

                  <a href="mailto:salong@bokabarber.se" className="link-item link-hover-card">
                    <div className="link-icon-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        <rect width="20" height="14" x="2" y="6" rx="2" />
                      </svg>
                    </div>
                    <div>
                      <strong>Salongsanslutning</strong>
                      <span className="gold-link block">salong@bokabarber.se</span>
                    </div>
                  </a>

                  <div className="link-item phone-card">
                    <div className="link-icon-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <strong>Telefon</strong>
                      <span className="phone-number block">08-123 45 67</span>
                      <span className="phone-hours block">Mån-Fre: 09:00 - 17:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Contact Form */}
            <div className="contact-form-column">
              {submitted ? (
                <div className="success-banner card-premium text-center animate-fade-in">
                  <div className="success-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="success-svg">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="m22 4-10 10.01-3-3" />
                    </svg>
                  </div>
                  <h3>Ditt meddelande har skickats!</h3>
                  <p>Tack för att du kontaktar oss. En av våra produktspecialister återkommer till dig inom 2 timmar under ordinarie arbetstid.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className={`form-group-custom ${focusedField === 'name' ? 'focused' : ''} ${name ? 'has-value' : ''}`}>
                    <label className="form-label-custom">Namn</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="form-input-custom" 
                      placeholder="Ditt fullständiga namn" 
                    />
                  </div>

                  <div className={`form-group-custom ${focusedField === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
                    <label className="form-label-custom">E-postadress</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="form-input-custom" 
                      placeholder="namn@salong.se" 
                    />
                  </div>

                  <div className={`form-group-custom ${focusedField === 'subject' ? 'focused' : ''} ${subject ? 'has-value' : ''}`}>
                    <label className="form-label-custom">Ämne</label>
                    <input 
                      type="text" 
                      required 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      className="form-input-custom" 
                      placeholder="Vad gäller ditt meddelande?" 
                    />
                  </div>

                  <div className={`form-group-custom textarea-group ${focusedField === 'message' ? 'focused' : ''} ${message ? 'has-value' : ''}`}>
                    <label className="form-label-custom">Meddelande</label>
                    <textarea 
                      required 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      className="form-input-custom textarea-input" 
                      rows={5} 
                      placeholder="Skriv ditt meddelande här..." 
                    ></textarea>
                  </div>

                  <button type="submit" disabled={sending} className="btn-send-message">
                    {sending ? (
                      <span className="loading-spinner-wrapper">
                        <span className="spinner"></span>
                        Skickar...
                      </span>
                    ) : (
                      <span className="btn-content">
                        Skicka meddelande
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow-icon">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="contact-footer text-center">
            <Link href="/" className="btn-back-home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="back-arrow-icon">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

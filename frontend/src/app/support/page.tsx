'use client';

import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="public-theme support-container animate-fade-in">
      <div className="container support-inner">
        <div className="glass-panel support-card">
          <div className="support-header text-center">
            <span className="badge-gold">BOKABARBER HELP CENTER</span>
            <h1>Support &amp; Manualer</h1>
            <p className="subtitle">Hitta svar på dina frågor eller kontakta vår premiumsupport</p>
          </div>

          <div className="support-search-box flex-center">
            <input type="text" placeholder="Hur kan vi hjälpa dig idag?" className="form-input search-input" />
            <button className="btn btn-primary search-btn">Sök</button>
          </div>

          <div className="support-grid">
            <div className="card-premium support-item-card">
              <span className="icon">🚀</span>
              <h3>Kom igång med din salong</h3>
              <p>Lär dig hur du ställer in din salongsprofil, lägger till din första barberare och publicerar din bokningssida.</p>
              <a href="#" className="read-more">Läs manualen →</a>
            </div>

            <div className="card-premium support-item-card">
              <span className="icon">📅</span>
              <h3>Hantera bokningar</h3>
              <p>Optimera din kalender, ställ in arbetstider, hantera drop-in tider och lär dig hur du gör manuella bokningar.</p>
              <a href="#" className="read-more">Läs manualen →</a>
            </div>

            <div className="card-premium support-item-card">
              <span className="icon">💳</span>
              <h3>Betalningar &amp; Stripe</h3>
              <p>Aktivera onlinebetalningar och depositioner för att helt eliminera uteblivna besök och no-shows på din salong.</p>
              <a href="#" className="read-more">Läs manualen →</a>
            </div>

            <div className="card-premium support-item-card">
              <span className="icon">📦</span>
              <h3>Lager &amp; Produkter</h3>
              <p>Följ lagernivåer, lägg till säljartiklar till dina tjänster och ställ in automatiska påminnelser för inköp.</p>
              <a href="#" className="read-more">Läs manualen →</a>
            </div>
          </div>

          <div className="support-contact-block text-center card-premium">
            <h3>Hittade du inte svaret du sökte?</h3>
            <p>Vår dedikerade supportavdelning för premium-salonger finns tillgänglig för dig.</p>
            <div className="contact-methods">
              <div className="method">
                <span className="method-icon">✉️</span>
                <strong>E-post:</strong> <a href="mailto:support@bokabarber.se" className="gold-link">support@bokabarber.se</a>
              </div>
              <div className="method">
                <span className="method-icon">📞</span>
                <strong>Telefon:</strong> 08-123 45 67 (Mån-Fre: 09:00 - 17:00)
              </div>
            </div>
          </div>

          <div className="support-footer text-center">
            <Link href="/" className="btn btn-primary">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .support-container {
          min-height: calc(100vh - 160px);
          padding: 60px 24px;
          background: radial-gradient(circle at 50% 10%, rgba(197, 160, 89, 0.04) 0%, transparent 50%);
        }
        .support-inner {
          max-width: 900px;
        }
        .support-card {
          padding: 48px 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
        }
        .support-header {
          margin-bottom: 32px;
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
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .support-header h1 {
          font-size: 2.4rem;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }
        .support-search-box {
          max-width: 580px;
          margin: 0 auto 48px auto;
          gap: 12px;
        }
        .search-input {
          flex: 1;
          min-height: 48px;
          padding: 12px 18px;
        }
        .search-btn {
          min-height: 48px;
          padding: 0 24px;
        }
        .support-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }
        .support-item-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 28px;
        }
        .support-item-card .icon {
          font-size: 2rem;
          line-height: 1;
        }
        .support-item-card h3 {
          font-size: 1.25rem;
          color: var(--primary);
        }
        .support-item-card p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .read-more {
          color: var(--accent);
          font-weight: 700;
          font-size: 0.92rem;
          margin-top: auto;
          transition: all var(--transition-fast);
        }
        .read-more:hover {
          color: var(--accent-hover);
          padding-left: 4px;
        }
        .support-contact-block {
          background-color: var(--bg-tertiary) !important;
          border: 1px solid var(--border-color);
          padding: 36px 24px;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }
        .support-contact-block h3 {
          font-size: 1.4rem;
          color: var(--primary);
        }
        .support-contact-block p {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        .contact-methods {
          display: flex;
          gap: 32px;
          margin-top: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .method {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .gold-link {
          color: var(--accent);
          font-weight: 700;
        }
        .support-footer {
          margin-top: 48px;
          border-top: 1px solid var(--border-color);
          padding-top: 32px;
        }
        @media (max-width: 768px) {
          .support-grid {
            grid-template-columns: 1fr;
          }
          .contact-methods {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
        @media (max-width: 600px) {
          .support-card {
            padding: 32px 20px;
          }
          .support-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

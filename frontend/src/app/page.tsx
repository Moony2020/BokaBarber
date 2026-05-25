'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/sok?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/sok');
    }
  };

  return (
    <div className="home-container animate-fade-in">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="badge-new">BokaBarber SaaS v1.0</span>
            <h1 className="hero-title">
              Hitta och boka Sveriges bästa <span>barbershops</span>
            </h1>
            <p className="hero-subtitle">
              Sök efter salonger i din stad, välj din favoritfrisör och boka din nästa tid på under 30 sekunder. Enkelt, smidigt och helt gratis för dig som kund.
            </p>

            <form onSubmit={handleSearch} className="search-bar-form">
              <input
                type="text"
                placeholder="Sök på stad, salong eller tjänst..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary search-btn">
                Sök salong
              </button>
            </form>

            <div className="popular-cities">
              <span>Populära städer:</span>
              <Link href="/sok?q=Stockholm">Stockholm</Link>
              <Link href="/sok?q=Göteborg">Göteborg</Link>
              <Link href="/sok?q=Malmö">Malmö</Link>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="premium-glass-card">
              <div className="card-header-barber">
                <span className="status-indicator">● ÖPPET</span>
                <h3>Royal Cuts</h3>
                <p>Kungsgatan 12, Stockholm</p>
              </div>
              <div className="card-barber-details">
                <div className="rating-row">⭐⭐⭐⭐⭐ (4.9/5)</div>
                <div className="service-row">
                  <span>Herrklippning</span>
                  <span className="price-tag">450 kr</span>
                </div>
                <div className="service-row">
                  <span>Skäggtrimning Deluxe</span>
                  <span className="price-tag">350 kr</span>
                </div>
                <Link href="/royal-cuts" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                  Boka Tid Nu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="funktioner" className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Varför boka med BokaBarber?</h2>
            <p className="section-subtitle">Vi gör det enkelt för både kunder och salongsägare att mötas.</p>
          </div>

          <div className="grid-responsive" style={{ marginTop: '48px' }}>
            <div className="card-premium">
              <div className="feature-icon">⚡</div>
              <h3>Blixtsnabb Bokning</h3>
              <p>Hitta lediga tider hos din favoritfrisör direkt. Välj frisör, tid och bekräfta. Ingen onödig väntetid i telefon.</p>
            </div>
            <div className="card-premium">
              <div className="feature-icon">💳</div>
              <h3>Betala på plats eller online</h3>
              <p>Välj det som passar dig bäst. Betala smidigt vid besöket med kort/Swish, eller betala en deposition tryggt online.</p>
            </div>
            <div className="card-premium">
              <div className="feature-icon">🔔</div>
              <h3>Smarta påminnelser</h3>
              <p>Få automatiskt en bekräftelse och en påminnelse via e-post inför ditt besök. Aldrig mer en bortglömd tid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS SAAS PRICING */}
      <section id="priser" className="pricing-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Äger du en barbershop?</h2>
            <p className="section-subtitle">Få fler bokningar och administrera din verksamhet som ett proffs.</p>
          </div>

          <div className="pricing-grid">
            {/* Plan 1 */}
            <div className="pricing-card glass-panel">
              <h3 className="plan-name">Bas</h3>
              <div className="plan-price">499 kr<span>/mån</span></div>
              <p className="plan-desc">Perfekt för den mindre, lokala salongen.</p>
              <ul className="plan-features">
                <li>✓ Upp till 3 frisörer</li>
                <li>✓ Publik bokningssida</li>
                <li>✓ E-postbekräftelser</li>
                <li>✓ Basrapport för ekonomi</li>
              </ul>
              <Link href="/registrera-salong?plan=bas" className="btn btn-secondary plan-btn">
                Registrera salong
              </Link>
            </div>

            {/* Plan 2 - Recommended */}
            <div className="pricing-card glass-panel premium-plan">
              <div className="plan-badge">REKOMMENDERAS</div>
              <h3 className="plan-name">Professional</h3>
              <div className="plan-price">999 kr<span>/mån</span></div>
              <p className="plan-desc">För salongen som vill växa och optimera intäkterna.</p>
              <ul className="plan-features">
                <li>✓ Obegränsat antal frisörer</li>
                <li>✓ Publik bokningssida under egen rutt</li>
                <li>✓ E-post & SMS-aviseringar</li>
                <li>✓ Avancerad ekonomi & Z-rapport</li>
                <li>✓ Kundregister med anteckningar</li>
              </ul>
              <Link href="/registrera-salong?plan=pro" className="btn btn-primary plan-btn">
                Anslut salong nu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="container cta-inner glass-panel">
          <h2>Är du redo att ta din salong till nästa nivå?</h2>
          <p>Anslut dig till hundratals svenska frisörer som redan använder BokaBarber för att fylla sina kalendrar.</p>
          <div className="cta-actions">
            <Link href="/registrera-salong" className="btn btn-primary">
              Registrera Din Salong Idag
            </Link>
            <Link href="/sok" className="btn btn-secondary">
              Sök Efter Salonger
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 96px;
          padding-bottom: 96px;
        }
        
        /* HERO SECTION */
        .hero-section {
          padding: 80px 0 40px 0;
          background: radial-gradient(circle at 10% 20%, rgba(193, 141, 75, 0.05) 0%, transparent 40%);
        }
        .hero-inner {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 992px) {
          .hero-inner {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .badge-new {
          background-color: var(--primary-lightest);
          color: var(--primary);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .hero-title {
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 20px;
        }
        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.8rem;
          }
        }
        .hero-title span {
          color: var(--primary);
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .search-bar-form {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        @media (min-width: 576px) {
          .search-bar-form {
            flex-direction: row;
            background: var(--bg-secondary);
            padding: 6px;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-md);
          }
          .search-input {
            border: none;
            box-shadow: none;
          }
          .search-input:focus {
            box-shadow: none;
          }
        }
        .search-input {
          flex: 1;
          padding: 14px 20px;
          font-size: 1rem;
          border-radius: var(--radius-md);
        }
        .search-btn {
          padding: 14px 28px;
        }
        .popular-cities {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .popular-cities a {
          color: var(--text-secondary);
          font-weight: 600;
        }
        .popular-cities a:hover {
          color: var(--primary);
        }

        .hero-image-wrapper {
          display: flex;
          justify-content: center;
        }
        .premium-glass-card {
          width: 100%;
          max-width: 380px;
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid rgba(193, 141, 75, 0.3);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-premium);
          color: #f3f4f6;
        }
        .card-header-barber {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .status-indicator {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-success);
          letter-spacing: 1px;
          display: block;
          margin-bottom: 6px;
        }
        .card-header-barber h3 {
          font-size: 1.6rem;
          color: #f3f4f6;
          margin-bottom: 4px;
        }
        .card-header-barber p {
          font-size: 0.9rem;
          color: #9ca3af;
        }
        .rating-row {
          color: #f59e0b;
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 0.95rem;
        }
        .service-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          font-size: 0.95rem;
        }
        .price-tag {
          font-weight: 700;
          color: var(--primary);
        }

        /* SECTION HEADER */
        .section-header {
          max-width: 600px;
          margin: 0 auto;
        }
        .section-title {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }
        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        .text-center {
          text-align: center;
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        /* PRICING PLANS */
        .pricing-section {
          background-color: var(--bg-tertiary);
          padding: 80px 0;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          max-width: 800px;
          margin: 48px auto 0 auto;
        }
        @media (min-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pricing-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .plan-badge {
          position: absolute;
          top: -12px;
          right: 24px;
          background-color: var(--primary);
          color: var(--text-white);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .premium-plan {
          border: 2px solid var(--primary);
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-premium);
        }
        .plan-name {
          font-size: 1.5rem;
          margin-bottom: 16px;
        }
        .plan-price {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .plan-price span {
          font-size: 1rem;
          color: var(--text-muted);
          font-weight: 400;
        }
        .plan-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
          font-size: 0.95rem;
        }
        .plan-features li {
          color: var(--text-secondary);
        }
        .plan-btn {
          width: 100%;
          margin-top: auto;
        }

        /* CTA SECTION */
        .cta-section {
          padding: 0 24px;
        }
        .cta-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .cta-inner h2 {
          font-size: 2.2rem;
          max-width: 600px;
        }
        .cta-inner p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 500px;
        }
        .cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Hur fungerar den 14-dagars kostnadsfria provperioden?',
      a: 'När du registrerar din salong får du automatiskt full tillgång till alla Professional-funktioner i 14 dagar. Inget kreditkort krävs och det finns inga förpliktelser. Du kan ställa in dina barberare, tjänster och kalender direkt.'
    },
    {
      q: 'Kan jag behålla mitt nuvarande kundregister?',
      a: 'Självklart! Vår support hjälper dig att importera ditt befintliga kundregister, produktregister och historik till BokaBarber helt utan kostnad under din provperiod.'
    },
    {
      q: 'Finns det någon bindningstid på BokaBarber?',
      a: 'Nej, vi tror på frihet. Det finns ingen bindningstid eller dolda avgifter på våra månadsprenumerationer. Du kan uppgradera, nedgradera eller avsluta när du vill.'
    },
    {
      q: 'Är mina data säkra hos er?',
      a: 'Ja, absolut. Vi använder branschledande kryptering och serverinfrastruktur i Europa för att skydda alla dina företagsdata, bokningsuppgifter och kundanteckningar i enlighet med GDPR.'
    }
  ];

  return (
    <div className="public-theme home-container animate-fade-in">

      {/* 👑 HERO SECTION WITH FULL-WIDTH BACKGROUND MOCKUP */}
      <section className="hero-section">
        <div className="hero-bg-overlay"></div>
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="badge-gold">FRAMTIDENS BARBERARSYSTEM</span>
            <h1 className="hero-title">
              Skandinavisk elegans för <span>high-end</span> salonger.
            </h1>
            <p className="hero-subtitle">
              BokaBarber förenar traditionellt hantverk med modern SaaS-effektivitet. En exklusiv plattform skapad för att förädla din kundresa.
            </p>

            <div className="hero-actions">
              <Link href="/registrera-salong" className="btn btn-primary btn-hero-primary">
                Starta din 14-dagars gratis provperiod
              </Link>
              <a href="#funktioner" className="btn btn-outline btn-hero-outline">
                Se demo
              </a>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">KUNDLOJALITET</span>
              </div>
              <div className="hero-stat-item">
                <span className="stat-number">150+</span>
                <span className="stat-label">PREMIUM SALONGER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 VALUE PROP / FEATURES INTRO */}
      <section id="funktioner" className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Precision i varje detalj</h2>
            <p className="section-subtitle">
              Vi har digitaliserat de mest kritiska aspekterna av din verksamhet så att du kan fokusera på det du gör bäst: hantverket.
            </p>
          </div>

          <div className="grid-responsive" style={{ marginTop: '56px' }}>
            {/* Feature Card 1 */}
            <div className="card-premium feature-card">
              <div className="feature-header">
                <span className="feature-icon-box">📅</span>
                <h3>Smart Kalender</h3>
              </div>
              <p>
                En intuitiv schemaläggning som minimerar luckor och maximerar intäkter genom automatiserade optimeringsalgoritmer.
              </p>
              <div className="card-visual-calendar">
                <div className="calendar-mini-grid">
                  <div className="grid-cell filled-purple">Bokad</div>
                  <div className="grid-cell filled-gold">Paus</div>
                  <div className="grid-cell filled-purple">Bokad</div>
                  <div className="grid-cell">Ledig</div>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="card-premium feature-card">
              <div className="feature-header">
                <span className="feature-icon-box">👥</span>
                <h3>Kundregister</h3>
              </div>
              <p>
                Skapa personliga profiler med historik, preferenser och allergier. Ge varje kund den kungliga behandling de förväntar sig.
              </p>
              <div className="card-visual-avatars">
                <div className="avatar-circles">
                  <span className="avatar-circle purple-avatar">A</span>
                  <span className="avatar-circle gold-avatar">M</span>
                  <span className="avatar-circle count-avatar">+184</span>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="card-premium feature-card">
              <div className="feature-header">
                <span className="feature-icon-box">💵</span>
                <h3>Ekonomi & Rapporter</h3>
              </div>
              <p>
                Full kontroll på kassaflöde, provisioner och lagervärde. Integrerat med ledande redovisningssystem.
              </p>
              <div className="card-visual-revenue">
                <div className="visual-rev-bar">
                  <div className="rev-progress" style={{ width: '82%' }}></div>
                </div>
                <div className="rev-labels">
                  <span>MÅNADSBOKNINGAR</span>
                  <span className="rev-growth">+12.4%</span>
                </div>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="card-premium feature-card">
              <div className="feature-header">
                <span className="feature-icon-box">📦</span>
                <h3>Smart Lagerhantering</h3>
              </div>
              <p>
                Slipp manuella inventeringar. Systemet varnar automatiskt när dina bästsäljande oljor eller vaxer börjar ta slut.
              </p>
              <div className="card-visual-stock">
                <div className="stock-pill stock-low">Vax Deluxe • FÅ KVAR</div>
                <div className="stock-pill stock-ok">Rakolja Eko • OK</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💰 PRICING GRID */}
      <section id="priser" className="pricing-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Investera i din salongs framtid</h2>
            <p className="section-subtitle">
              Välj en plan som passar din verksamhet. Skalbara lösningar för allt från den enskilda barberaren till de stora premiumkedjorna.
            </p>
          </div>

          <div className="pricing-grid">
            {/* Plan 1: Bas */}
            <div className="pricing-card">
              <span className="plan-tag">BAS</span>
              <div className="plan-price">
                499 kr
                <span>/mån</span>
              </div>

              <ul className="plan-features">
                <li>
                  <span className="check-bullet">✓</span>
                  Upp till 2 anställda
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  Digital kalender
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  SMS-påminnelser
                </li>
                <li className="disabled-feature">
                  <span className="check-bullet">✕</span>
                  Avancerad lagerhantering
                </li>
              </ul>

              <Link href="/registrera-salong?plan=bas" className="btn btn-outline plan-btn">
                Välj Bas
              </Link>
            </div>

            {/* Plan 2: Professional - RECOMMENDED */}
            <div className="pricing-card pricing-recommended">
              <div className="plan-badge">REKOMMENDERAD</div>
              <span className="plan-tag text-purple">PROFESSIONAL</span>
              <div className="plan-price">
                999 kr
                <span>/mån</span>
              </div>

              <ul className="plan-features">
                <li>
                  <span className="check-bullet text-purple">✓</span>
                  <strong>Obegränsat</strong> antal anställda
                </li>
                <li>
                  <span className="check-bullet text-purple">✓</span>
                  Allt i Bas-planen
                </li>
                <li>
                  <span className="check-bullet text-purple">✓</span>
                  Avancerad lagerhantering
                </li>
                <li>
                  <span className="check-bullet text-purple">✓</span>
                  Ekonomisk rapportering
                </li>
                <li>
                  <span className="check-bullet text-purple">✓</span>
                  Prioriterad support 24/7
                </li>
              </ul>

              <Link href="/registrera-salong?plan=pro" className="btn btn-primary plan-btn">
                Starta Professional
              </Link>
            </div>
          </div>

          {/* Inline CTA block inside Pricing */}
          <div className="pricing-inline-cta glass-panel purple-banner">
            <div className="banner-content">
              <h3>Inte redo att binda dig än?</h3>
              <p>Testa alla Professional-funktioner gratis i 14 dagar. Inget kreditkort krävs. Ingen bindningstid.</p>
            </div>
            <div className="banner-actions">
              <Link href="/registrera-salong" className="btn btn-primary">
                Starta gratis testperiod
              </Link>
              <a href="#kontakt" className="btn btn-outline outline-white-btn">
                Boka en demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 🙋 FAQ ACCORDION SECTION */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Vanliga frågor</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${activeFaq === idx ? 'faq-active' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <span className="faq-icon-toggle">{activeFaq === idx ? '−' : '+'}</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📣 DYNAMIC CTA BANNER WITH DEEP PURPLE BACKGROUND & GOLD BUTTONS */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner-purple">
            <h2>Redo att uppgradera din salong?</h2>
            <p>Anslut dig till eliten av svenska barberare. Ingen bindningstid, fullt stöd under hela din uppstartsresa.</p>
            <div className="cta-actions">
              <Link href="/registrera-salong" className="btn btn-primary btn-cta-gold">
                Starta din 14-dagars gratis provperiod
              </Link>
              <a href="#kontakt" className="btn btn-outline outline-white-btn">
                Boka rådgivning
              </a>
            </div>
            <div className="cta-lock-notice">
              <span className="lock-icon">🔒</span>
              Kreditkort krävs ej för provperiod
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 0px;
          padding-bottom: 80px;
          position: relative;
          background-color: var(--bg-primary);
        }

        /* 👑 HERO SECTION WITH FULL-WIDTH BACKGROUND MOCKUP */
        .hero-section {
          padding: 80px 0;
          background-image: url('/hero_mockup.jpg') !important;
          background-size: cover !important;
          background-position: center center !important;
          background-repeat: no-repeat !important;
          position: relative;
          min-height: calc(100vh - 85px);
          display: flex;
          align-items: center;
          width: 100%;
        }

        /* Light elegant cream gradient — fades from left so text is legible, image shows through on right */
        .hero-bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            rgba(250, 249, 246, 0.97) 0%,
            rgba(250, 249, 246, 0.88) 40%,
            rgba(250, 249, 246, 0.4) 65%,
            rgba(250, 249, 246, 0) 100%
          );
          z-index: 1;
        }

        @media (max-width: 1024px) {
          .hero-section {
            min-height: 600px;
          }
          .hero-bg-overlay {
            background: rgba(250, 249, 246, 0.90);
          }
        }

        @media (max-width: 640px) {
          .hero-section {
            min-height: 520px;
            padding: 60px 0;
          }
          .hero-bg-overlay {
            background: rgba(250, 249, 246, 0.94);
          }
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
        }

        /* No card background — text floats cleanly over the overlay gradient */
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 600px;
          padding: 0;
          background: transparent;
        }

        .badge-gold {
          background-color: rgba(197, 160, 89, 0.1);
          border: 1px solid rgba(197, 160, 89, 0.3);
          color: var(--accent);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: 3.8rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.8rem;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2.1rem;
            line-height: 1.2;
            margin-bottom: 14px;
          }

          .hero-subtitle {
            font-size: 0.95rem;
            line-height: 1.55;
            margin-bottom: 22px;
          }

          .hero-actions {
            gap: 10px;
            margin-bottom: 24px;
          }

          .btn-hero-primary,
          .btn-hero-outline {
            width: 100%;
            padding: 12px 14px;
            font-size: 0.9rem;
          }

          .hero-stats-row {
            gap: 20px;
            padding-top: 16px;
          }

          .stat-number {
            font-size: 1.65rem;
          }

          .stat-label {
            font-size: 0.72rem;
          }
        }

        .hero-title span {
          font-style: italic;
          font-family: var(--font-primary);
          color: var(--accent);
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 36px;
          line-height: 1.7;
          max-width: 520px;
        }

        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 44px;
        }

        .btn-hero-primary {
          padding: 15px 30px;
          font-size: 0.97rem;
        }

        .btn-hero-outline {
          padding: 15px 28px;
          font-size: 0.97rem;
          border-width: 1.5px;
          border-color: var(--border-color);
          color: var(--text-primary);
          background: rgba(255,255,255,0.6);
        }

        .btn-hero-outline:hover {
          background: var(--primary);
          color: white !important;
          border-color: var(--primary);
        }

        .hero-stats-row {
          display: flex;
          gap: 40px;
          border-top: 1px solid var(--border-color);
          padding-top: 22px;
          width: 100%;
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .stat-number {
          font-family: var(--font-primary);
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text-muted);
        }

        /* 📸 LUXURY SALON FRAME & DASHBOARD OVERLAY */
        .hero-image-wrapper {
          display: none;
        }

        .premium-salon-frame {
          display: none;
        }

        .dashboard-overlay-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--border-color);
          border-top: 3px solid var(--accent);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: 0 20px 40px rgba(27, 3, 48, 0.15);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .overlay-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .overlay-price {
          font-weight: 800;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .dashboard-overlay-card h4 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dashboard-overlay-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .overlay-timeline {
          height: 6px;
          width: 100%;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .timeline-bar-filled {
          height: 100%;
          width: 65%;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
        }

        .overlay-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .status-gold {
          color: var(--accent);
          font-weight: 700;
        }

        /* 🎯 FEATURES SECTION */
        .features-section {
          padding: 48px 0;
          background-color: #ffffff;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .section-header {
          max-width: 700px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.6rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .section-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .text-center {
          text-align: center;
        }

        .feature-card {
          padding: 36px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 380px;
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .feature-icon-box {
          font-size: 1.8rem;
          color: var(--accent);
        }

        .feature-card h3 {
          font-size: 1.3rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .feature-card p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Card visual elements */
        .card-visual-calendar {
          margin-top: auto;
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          padding: 12px;
          border: 1px dashed var(--border-color);
        }

        .calendar-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .grid-cell {
          padding: 8px 4px;
          border-radius: var(--radius-sm);
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .filled-purple {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .filled-gold {
          background-color: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .card-visual-avatars {
          margin-top: auto;
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          justify-content: center;
          border: 1px dashed var(--border-color);
        }

        .avatar-circles {
          display: flex;
        }

        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: bold;
          border: 2px solid #ffffff;
          margin-left: -10px;
        }

        .avatar-circle:first-child {
          margin-left: 0;
        }

        .purple-avatar {
          background-color: var(--primary);
          color: white;
        }

        .gold-avatar {
          background-color: var(--accent);
          color: white;
        }

        .count-avatar {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .card-visual-revenue {
          margin-top: auto;
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          padding: 16px;
          border: 1px dashed var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .visual-rev-bar {
          height: 8px;
          width: 100%;
          background-color: var(--border-color);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .rev-progress {
          height: 100%;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
        }

        .rev-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .rev-growth {
          color: var(--color-success);
        }

        .card-visual-stock {
          margin-top: auto;
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          padding: 16px;
          border: 1px dashed var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stock-pill {
          padding: 8px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
        }

        .stock-low {
          background-color: rgba(239, 68, 68, 0.08);
          color: var(--color-danger);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .stock-ok {
          background-color: rgba(16, 185, 129, 0.08);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        /* 💰 PRICING GRID & INLINE CTA */
        .pricing-section {
          padding: 48px 0;
          background-color: var(--bg-primary);
        }

        .pricing-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 900px;
          margin: 56px auto 0 auto;
        }

        @media (min-width: 768px) {
          .pricing-grid {
            flex-direction: row;
            align-items: stretch;
          }
          .pricing-card {
            flex: 1;
          }
        }

        .pricing-card {
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 48px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-premium);
        }

        .pricing-recommended {
          border: 2px solid var(--accent);
          box-shadow: var(--shadow-lg);
        }

        .plan-tag {
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .text-purple {
          color: var(--primary) !important;
        }

        .plan-badge {
          position: absolute;
          top: -14px;
          right: 32px;
          background: var(--accent-gradient);
          color: white;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(197, 160, 89, 0.3);
        }

        .plan-price {
          font-size: 3.2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 24px;
          display: flex;
          align-items: baseline;
        }

        .plan-price span {
          font-size: 1.1rem;
          color: var(--text-muted);
          font-weight: 400;
          margin-left: 4px;
        }

        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
          flex-grow: 1;
        }

        .plan-features li {
          color: var(--text-secondary);
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
        }

        .disabled-feature {
          color: var(--text-muted) !important;
          text-decoration: line-through;
          opacity: 0.65;
        }

        .check-bullet {
          color: var(--accent);
          font-weight: bold;
        }

        .plan-btn {
          width: 100%;
        }

        /* Inline CTA inside Pricing */
        .pricing-inline-cta {
          margin-top: 64px;
          background: var(--primary);
          color: white;
          padding: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
          box-shadow: var(--shadow-lg);
        }

        @media (max-width: 768px) {
          .pricing-inline-cta {
            flex-direction: column;
            text-align: center;
            padding: 36px;
            gap: 24px;
          }
        }

        .banner-content h3 {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .banner-content p {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 500px;
        }

        .banner-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .outline-white-btn {
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
        }

        .outline-white-btn:hover {
          background-color: white;
          color: var(--primary);
          border-color: white;
        }

        /* 🙋 FAQ ACCORDION */
        .faq-section {
          padding: 48px 0;
          background-color: #ffffff;
          border-bottom: 1px solid var(--border-color);
        }

        .faq-list {
          max-width: 760px;
          margin: 48px auto 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 24px;
          cursor: pointer;
          transition: all var(--transition-normal);
          overflow: hidden;
        }

        .faq-item:hover {
          border-color: var(--accent);
          background: #ffffff;
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .faq-question h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .faq-icon-toggle {
          font-size: 1.5rem;
          color: var(--accent);
          line-height: 1;
        }

        .faq-answer {
          max-height: 0;
          opacity: 0;
          transition: all var(--transition-normal);
          margin-top: 0;
        }

        .faq-active .faq-answer {
          max-height: 200px;
          opacity: 1;
          margin-top: 16px;
        }

        .faq-answer p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* 📣 DYNAMIC CTA BANNER WITH ROYAL PURPLE BACKGROUND */
        .cta-section {
          padding: 48px 24px;
          background-color: var(--bg-primary);
        }

        .cta-inner-purple {
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 32px;
          background-color: var(--primary);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
          box-shadow: var(--shadow-lg);
        }

        .cta-inner-purple h2 {
          font-size: 2.6rem;
          color: #ffffff;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        @media (max-width: 768px) {
          .cta-inner-purple h2 {
            font-size: 2.1rem;
            line-height: 1.2;
          }
        }

        .cta-inner-purple p {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 580px;
          line-height: 1.65;
        }

        .cta-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 12px;
        }

        .btn-cta-gold {
          padding: 16px 36px;
          font-size: 1.05rem;
        }

        .cta-lock-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 8px;
        }

        @media (max-width: 1200px) {
          .feature-card {
            padding: 24px 20px !important;
          }
          .card-visual-calendar {
            padding: 8px !important;
          }
          .calendar-mini-grid {
            gap: 4px !important;
          }
          .grid-cell {
            padding: 6px 2px !important;
            font-size: 0.65rem !important;
          }
        }

        @media (max-width: 640px) {
          .pricing-card {
            padding: 24px 20px !important;
          }
          .plan-price {
            font-size: 2.35rem !important;
            margin-bottom: 18px !important;
          }
          .plan-price span {
            font-size: 0.9rem !important;
          }
          .feature-card {
            padding: 20px !important;
            min-height: auto !important;
          }
          .cta-inner-purple {
            padding: 32px 20px !important;
            gap: 16px !important;
          }
          .cta-inner-purple h2 {
            font-size: 1.8rem !important;
          }
          .cta-inner-purple p {
            font-size: 1rem !important;
            line-height: 1.5 !important;
          }
          .section-title {
            font-size: 1.8rem !important;
          }
          .cta-section {
            padding: 24px 0px !important;
          }
          .cta-section :global(.container) {
            padding: 0 12px !important;
          }
        }
      `}</style>

    </div>
  );
}

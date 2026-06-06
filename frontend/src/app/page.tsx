'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const slides = [
    '/slide1.webp',
    '/slide2.webp',
    '/slide3.webp'
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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

  const compareFeatures = [
    {
      feature: 'Bokningssystem',
      bas: 'check',
      professional: 'check',
    },
    {
      feature: 'Digital kalender',
      bas: 'check',
      professional: 'check',
    },
    {
      feature: 'SMS-påminnelser',
      bas: 'check',
      professional: 'check',
    },
    {
      feature: 'Lagerhantering',
      bas: 'dash',
      professional: 'check',
    },
    {
      feature: 'Ekonomisk rapportering',
      bas: 'dash',
      professional: 'check',
    },
    {
      feature: 'Prioriterad support',
      bas: 'dash',
      professional: 'check',
    },
  ];

  const renderComparisonValue = (value: string) => {
    if (value === 'check') return <span className="comparison-check">✓</span>;
    if (value === 'dash') return <span className="comparison-dash">-</span>;
    return <span className="comparison-text">{value}</span>;
  };

  return (
    <div className="public-theme home-container animate-fade-in">

      {/* 👑 HERO SECTION WITH FULL-WIDTH BACKGROUND MOCKUP */}
      <section className="hero-section">
        <div className="hero-slides-container">
          {slides.map((slide, index) => (
            <div
              key={slide}
              className={`hero-slide ${currentSlide === index ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>
        <div className="hero-bg-overlay"></div>
        <div className="container hero-inner">
          <div className="hero-mobile-image-container">
            {slides.map((slide, index) => (
              <div
                key={slide}
                className={`hero-mobile-slide ${currentSlide === index ? 'active' : ''}`}
                style={{ backgroundImage: `url(${slide})` }}
              />
            ))}
            <div className="hero-slider-dots mobile-only-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Gå till slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Wrapper for hero content */}
          <div className="hero-content-wrapper">
            <div className="hero-content">
              {/* Desktop Dots */}
              <div className="hero-slider-dots desktop-only-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Gå till slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className="hero-copy-panel">
                <span className="badge-gold">FRAMTIDENS BARBERARSYSTEM</span>
                <h1 className="hero-title">
                  Skandinavisk elegans för <span>high-end</span> salonger.
                </h1>
                <p className="hero-subtitle">
                  BokaBarber förenar traditionellt hantverk med modern SaaS-effektivitet. En exklusiv plattform skapad för att förädla din kundresa.
                </p>
              </div>

              <div className="hero-actions">
                <Link href="/registrera-salong" className="btn btn-primary btn-hero-primary">
                  Starta din 14-dagars gratis provperiod
                </Link>
                <Link href="/royal-cuts" className="btn btn-outline btn-hero-outline">
                  Se demo
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <div className="stat-icon-wrapper">
                <i className="fa-solid fa-star"></i>
              </div>
              <div className="stat-info">
                <span className="stat-number">98%</span>
                <span className="stat-label">KUNDLOJALITET</span>
              </div>
            </div>

            <div className="hero-stat-item">
              <div className="stat-icon-wrapper">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div className="stat-info">
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

          <div className="grid-responsive mt-56" >
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
                  <div className="rev-progress w-82" ></div>
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
                299 kr
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
                399 kr
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

          <div className="pricing-compare-section">
            <div className="pricing-compare-header text-center">
              <h3 className="section-title">Jämför Funktioner</h3>
            </div>

            <div className="pricing-compare-shell">
              <div className="pricing-compare-table-wrap">
                <table className="pricing-compare-table">
                  <thead>
                    <tr>
                      <th>Funktioner</th>
                      <th>Bas</th>
                      <th>Professional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareFeatures.map((row) => (
                      <tr key={row.feature}>
                        <td>{row.feature}</td>
                        <td>{renderComparisonValue(row.bas)}</td>
                        <td>{renderComparisonValue(row.professional)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Exquisite design systems of BokaBarber */}
    </div>
  );
}

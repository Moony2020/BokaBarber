'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HOMEPAGE_CATEGORIES = [
  { label: 'Klippning',    q: 'Klippning',    img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&auto=format&fit=crop' },
  { label: 'Skinfade',     q: 'Skinfade',     img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop' },
  { label: 'Skägg',        q: 'Skäggtrimning',img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop' },
  { label: 'Rakning',      q: 'Rakning',      img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop' },
  { label: 'Styling',      q: 'Styling',      img: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=600&auto=format&fit=crop' },
];

export default function HomePage() {
  const router = useRouter();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [heroSearchQ, setHeroSearchQ] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearchQ.trim();
    router.push(q ? `/sok?city=${encodeURIComponent(q)}` : '/sok');
  };

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
      <section id="hero" className="hero-section">
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
                <Link href="/registrera-salong?plan=pro" className="btn btn-primary btn-hero-primary">
                  Starta din 14-dagars gratis provperiod
                </Link>
                <Link href="/royal-cuts" className="btn btn-outline btn-hero-outline">
                  Se demo
                </Link>
              </div>

              <form className="hero-customer-search" onSubmit={handleHeroSearch}>
                <div className="hero-search-bar">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hero-search-ico"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder="Hitta salong i din stad..."
                    value={heroSearchQ}
                    onChange={e => setHeroSearchQ(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit" className="hero-search-btn">Sök</button>
                </div>
              </form>
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

      {/* 📋 KATEGORIER — Customer booking section */}
      <section className="home-kategorier-section">
        <div className="container">
          <div className="home-kat-header">
            <h2 className="home-kat-title text-serif">Kategorier</h2>
            <Link href="/sok" className="home-kat-link">Visa alla →</Link>
          </div>
          <div className="home-kat-grid">
            {HOMEPAGE_CATEGORIES.map(cat => (
              <Link key={cat.label} href={`/sok?q=${encodeURIComponent(cat.q)}`} className="home-kat-card">
                <div className="home-kat-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.img} alt={cat.label} className="home-kat-img" loading="lazy" />
                  <div className="home-kat-overlay" />
                </div>
                <span className="home-kat-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 VALUE PROP / FEATURES INTRO */}
      <section id="funktioner" className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Exklusivitet i varje funktion</h2>
            <p className="section-subtitle">
              Vårt ekosystem är byggt för att eliminera friktion och förstärka din kundupplevelse.
            </p>
          </div>

          <div className="grid-responsive mt-56">
            <div className="feature-card">
              <div className="feature-header">
                <span className="material-symbols-outlined feature-icon-box" aria-hidden="true">calendar_month</span>
                <div className="feature-copy">
                  <h3>Smart Kalender</h3>
                  <p>Intelligent schemahantering som förutser dina behov och optimerar dina luckor automatiskt.</p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="material-symbols-outlined feature-icon-box" aria-hidden="true">group</span>
                <div className="feature-copy">
                  <h3>Kundregister</h3>
                  <p>Lär känna dina stamgäster på djupet. Preferenser, historik och personliga noteringar på ett ställe.</p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="material-symbols-outlined feature-icon-box" aria-hidden="true">payments</span>
                <div className="feature-copy">
                  <h3>Ekonomi & Rapporter</h3>
                  <p>Analysera din tillväxt med kristallklar data. Insikter som hjälper dig fatta smartare affärsbeslut.</p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="material-symbols-outlined feature-icon-box" aria-hidden="true">inventory_2</span>
                <div className="feature-copy">
                  <h3>Smart Lagerhantering</h3>
                  <p>Håll koll på dina exklusiva produkter. Automatiska varningar när det är dags att beställa nytt.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="design" className="design-story-section">
        <div className="container design-story-grid">
          <div className="design-story-visual-shell">
            <div className="design-story-frame"></div>
            <div className="design-story-visual">
              <img
                src="/trimmer.webp"
                alt="Trimmer på marmorskiva"
                className="design-story-image"
                loading="lazy"
              />
              <div className="design-story-image-overlay"></div>
            </div>
          </div>

          <div className="design-story-copy">
            <h2>Designad för perfektionister.</h2>
            <p>
              Vi förstår att din tid är din mest värdefulla tillgång. Därför har vi skalat bort allt brus och skapat ett gränssnitt som känns lika naturligt som saxen i din hand, optimerat för ljusa premiumsalonger.
            </p>

            <div className="design-story-points">
              <div className="design-story-point">
                <span className="design-story-point-icon" aria-hidden="true"></span>
                <div>
                  <h3>Sömlös integration</h3>
                  <p>Koppla ihop med dina befintliga verktyg och betallösningar utan huvudvärk.</p>
                </div>
              </div>

              <div className="design-story-point">
                <span className="design-story-point-icon" aria-hidden="true"></span>
                <div>
                  <h3>Automatiserad kommunikation</h3>
                  <p>Påminnelser och bekräftelser som håller dina kunder informerade och eliminerar uteblivna besök.</p>
                </div>
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
                Starta med Bas
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
              <Link href="/registrera-salong?plan=pro" className="btn btn-primary btn-hero-primary">
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
            <h2>Redo att lyfta din salong till nästa nivå?</h2>
            <p>Anslut dig till eliten av svenska barberare. Ingen bindningstid, fullt stöd under hela din uppstartsresa.</p>
            <div className="cta-actions">
              <Link href="/registrera-salong?plan=pro" className="btn btn-primary btn-cta-gold">
                Kom igång nu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Exquisite design systems of BokaBarber */}
    </div>
  );
}

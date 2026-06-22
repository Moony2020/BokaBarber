'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="public-theme privacy-container animate-fade-in">
      <div className="container privacy-inner">
        <div className="glass-panel privacy-card">
          <div className="privacy-header text-center">
            <span className="badge-gold">INTEGRITET &amp; SÄKERHET</span>
            <h1>Integritetspolicy</h1>
            <p className="last-updated">Senast uppdaterad: 26 maj 2026</p>
          </div>

          <div className="privacy-content">
            <p className="intro-text">
              På BokaBarber är din integritet och skyddet av dina personuppgifter av yttersta vikt för oss. Denna integritetspolicy beskriver hur vi samlar in, använder, lagrar och delar dina uppgifter när du använder vår webbplats och våra bokningstjänster.
            </p>

            <section className="policy-section">
              <h2>1. Information vi samlar in</h2>
              <p>Vi samlar in information för att kunna tillhandahålla en så smidig och premium bokningsupplevelse som möjligt. Detta inkluderar:</p>
              <ul>
                <li><strong>Personuppgifter:</strong> Namn, e-postadress, telefonnummer och lösenord när du skapar ett konto.</li>
                <li><strong>Bokningsinformation:</strong> Salonger du besöker, tjänster du bokar, datum, tider och eventuella frisörer du föredrar.</li>
                <li><strong>Betalningsuppgifter:</strong> Om du gör onlinebetalningar eller betalar depositioner hanteras detta säkert via vår Stripe-integration. Vi lagrar aldrig dina kortuppgifter på våra servrar.</li>
                <li><strong>Tekniska data:</strong> IP-adress, enhetstyp, operativsystem och interaktionsdata när du navigerar på vår plattform.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>2. Hur vi använder din information</h2>
              <p>Vi använder dina uppgifter för följande ändamål:</p>
              <ul>
                <li>Att administrera ditt konto och bekräfta dina bokningar via e-post och SMS.</li>
                <li>Att göra det möjligt för anslutna salonger att hantera sina kundrelationer och ge dig bästa möjliga service.</li>
                <li>Att analysera plattformens prestanda för att ständigt förbättra användarupplevelsen.</li>
                <li>Att efterleva tillämpliga lagar och förordningar, inklusive bokföringslagen och GDPR.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>3. Datadelning och överföring</h2>
              <p>
                Dina personuppgifter delas med den salong du bokar en tid hos. Vi säljer aldrig dina personuppgifter till tredje part. Vi delar endast information med betrodda leverantörer (såsom betalningsleverantörer och SMS-tjänster) som är nödvändiga för att utföra tjänsten, och som är bundna av strikta dataskyddsavtal.
              </p>
            </section>

            <section className="policy-section">
              <h2>4. Dina rättigheter under GDPR</h2>
              <p>Enligt den allmänna dataskyddsförordningen (GDPR) har du rätt till:</p>
              <ul>
                <li><strong>Tillgång:</strong> Du har rätt att begära en kopia av de personuppgifter vi har om dig.</li>
                <li><strong>Rättelse:</strong> Du kan när som helst uppdatera felaktiga eller ofullständiga uppgifter via din profil.</li>
                <li><strong>Radering ("rätten att bli glömd"):</strong> Du kan begära att vi tar bort dina personuppgifter under vissa förutsättningar.</li>
                <li><strong>Begränsning:</strong> Du kan begära att vi begränsar behandlingen av dina uppgifter.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>5. Kontakta oss</h2>
              <p>
                Om du har några frågor om denna integritetspolicy eller hur vi hanterar dina uppgifter, är du varmt välkommen att kontakta vårt dataskyddsombud på <a href="mailto:privacy@bokabarber.se" className="gold-link">privacy@bokabarber.se</a>.
              </p>
            </section>
          </div>

          <div className="privacy-footer text-center">
            <Link href="/" className="btn btn-primary">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .privacy-container {
          min-height: calc(100vh - 160px);
          padding: 20px 24px 60px;
          background: radial-gradient(circle at 10% 20%, rgba(197, 160, 89, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 90% 80%, rgba(45, 0, 77, 0.02) 0%, transparent 50%);
        }
        .privacy-inner {
          max-width: 1000px;
        }
        .privacy-card {
          padding: 48px 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
        }
        .privacy-header {
          margin-bottom: 40px;
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
        .privacy-header h1 {
          font-size: 2.4rem;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .last-updated {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
        }
        .intro-text {
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--text-primary);
          margin-bottom: 32px;
          font-weight: 500;
        }
        .policy-section {
          margin-bottom: 32px;
        }
        .policy-section h2 {
          font-size: 1.4rem;
          color: var(--primary);
          margin-bottom: 12px;
          font-family: var(--font-primary);
        }
        .policy-section p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .policy-section ul {
          padding-left: 20px;
          margin-bottom: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .policy-section li {
          margin-bottom: 8px;
        }
        .gold-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: underline;
        }
        .gold-link:hover {
          color: var(--accent-hover);
        }
        .privacy-footer {
          margin-top: 48px;
          border-top: 1px solid var(--border-color);
          padding-top: 32px;
        }
        @media (max-width: 600px) {
          .privacy-card {
            padding: 32px 20px;
          }
          .privacy-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

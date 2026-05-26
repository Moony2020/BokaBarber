'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="public-theme terms-container animate-fade-in">
      <div className="container terms-inner">
        <div className="glass-panel terms-card">
          <div className="terms-header text-center">
            <span className="badge-gold">ALLMÄNNA ANVÄNDARVILLKOR</span>
            <h1>Användarvillkor</h1>
            <p className="last-updated">Senast uppdaterad: 26 maj 2026</p>
          </div>

          <div className="terms-content">
            <p className="intro-text">
              Välkommen till BokaBarber! Dessa allmänna användarvillkor reglerar din användning av vår plattform, bokningstjänster och relaterade verktyg. Genom att registrera ett konto, boka tider eller använda vår plattform godkänner du dessa villkor i sin helhet.
            </p>

            <section className="terms-section">
              <h2>1. Bokning och Tjänster</h2>
              <p>BokaBarber är en förmedlingstjänst som kopplar samman dig som kund med anslutna premiumbarberare och frisörsalonger. Följande villkor gäller för alla bokningar:</p>
              <ul>
                <li><strong>Avbokning och Ombokning:</strong> Varje enskild salong sätter sina egna regler för avbokningsfönster (t.ex. 24 timmar innan bokad tid). Om du avbokar för sent har salongen rätt att debitera dig enligt deras gällande policy.</li>
                <li><strong>No-Show (Utebliven ankomst):</strong> Om du missar din bokade tid utan att avboka, förbehåller sig salongen rätten att debitera hela eller delar av beloppet för den bokade tjänsten.</li>
                <li><strong>Ansvar:</strong> BokaBarber ansvarar inte för själva hårklippningen, rakningen eller den fysiska upplevelsen på salongen. Eventuella klagomål eller reklamationer ska riktas direkt till den berörda salongen.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>2. Konton och Registrering</h2>
              <p>När du skapar ett konto på vår plattform förbinder du dig att:</p>
              <ul>
                <li>Tillhandahålla korrekta, aktuella och fullständiga personuppgifter.</li>
                <li>Hålla dina inloggningsuppgifter och lösenord konfidentiella och skydda dem mot obehörig åtkomst.</li>
                <li>Inte använda plattformen för olagliga, vilseledande eller skadliga syften, inklusive spambokningar eller trakasserier.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. Betalningar och Depositioner</h2>
              <p>
                Vissa salonger kan kräva en förskottsbetalning eller deposition för onlinebokningar. Alla betalningstransaktioner sker krypterat och säkert via vår betalningspartner Stripe. Eventuella återbetalningar vid giltiga avbokningar styrs av salongens avbokningspolicy och hanteras av Stripe direkt till ditt ursprungliga betalningsmedel.
              </p>
            </section>

            <section className="terms-section">
              <h2>4. Ansvarsbegränsning</h2>
              <p>
                BokaBarber tillhandahåller plattformen i befintligt skick. Vi strävar efter 100% upptid och driftsäkerhet, men kan inte garantera att plattformen alltid är fri från tillfälliga avbrott eller tekniska störningar. Vi ansvarar inte för direkta eller indirekta skador till följd av missade tider på grund av tekniska fel.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Ändringar i Villkoren</h2>
              <p>
                Vi förbehåller oss rätten att uppdatera och ändra dessa villkor när som helst. De senaste villkoren finns alltid publicerade på denna sida. Genom att fortsätta använda BokaBarber efter att ändringar har gjorts, godkänner du de uppdaterade villkoren.
              </p>
            </section>
          </div>

          <div className="terms-footer text-center">
            <Link href="/" className="btn btn-primary">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .terms-container {
          min-height: calc(100vh - 160px);
          padding: 60px 24px;
          background: radial-gradient(circle at 10% 80%, rgba(197, 160, 89, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 90% 20%, rgba(45, 0, 77, 0.02) 0%, transparent 50%);
        }
        .terms-inner {
          max-width: 800px;
        }
        .terms-card {
          padding: 48px 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
        }
        .terms-header {
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
        .terms-header h1 {
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
        .terms-section {
          margin-bottom: 32px;
        }
        .terms-section h2 {
          font-size: 1.4rem;
          color: var(--primary);
          margin-bottom: 12px;
          font-family: var(--font-primary);
        }
        .terms-section p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .terms-section ul {
          padding-left: 20px;
          margin-bottom: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .terms-section li {
          margin-bottom: 8px;
        }
        .terms-footer {
          margin-top: 48px;
          border-top: 1px solid var(--border-color);
          padding-top: 32px;
        }
        @media (max-width: 600px) {
          .terms-card {
            padding: 32px 20px;
          }
          .terms-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

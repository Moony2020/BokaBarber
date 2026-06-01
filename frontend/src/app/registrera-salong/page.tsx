'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planQuery = searchParams.get('plan') || 'bas';

  // Form states
  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-generate slug from shop name
  useEffect(() => {
    const formatted = shopName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Ta bort konstiga tecken
      .replace(/[\s_]+/g, '-')  // Byt ut mellanslag till bindestreck
      .replace(/--+/g, '-');    // Undvik dubbla bindestreck
    setSlug(formatted);
  }, [shopName]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/register-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          shopName,
          slug,
          address: {
            street,
            city,
            zipCode,
            country: 'Sweden'
          }
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error || 'Registreringen misslyckades.');
      }
    } catch (err) {
      setErrorMsg('Nätverksfel. Kontrollera att servern är aktiv.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrap animate-fade-in">
      <div className="container flex-center">
        <div className="register-card glass-panel">

          {success ? (
            <div className="success-register text-center">
              <span className="success-icon">🎉</span>
              <h2>Salongen har skapats!</h2>
              <p className="success-text">
                Grattis! Ditt konto för <strong>{shopName}</strong> är nu skapat under adressen <strong>bokabarber.se/{slug}</strong>.
              </p>
              <div className="next-steps card-premium">
                <h4>Nästa steg:</h4>
                <p>Logga in på din salongspanel för att lägga till frisörer, arbetstider och tjänster.</p>
              </div>
              <Link href="/login" className="btn btn-primary success-btn">
                Logga in på instrumentpanelen
              </Link>
            </div>
          ) : (
            <>
              <div className="register-header text-center">
                <h2>Registrera din salong</h2>
                <p>Du har valt abonnemangsplanen: <strong className="plan-badge">{planQuery === 'pro' ? 'Professional' : 'Bas'}</strong></p>
              </div>

              {errorMsg && <div className="error-alert">⚠️ {errorMsg}</div>}

              <form onSubmit={handleSubmit} className="register-form">

                <h3 className="form-subheading">1. Salongsdetaljer</h3>

                <div className="form-group">
                  <label htmlFor="shopName" className="form-label">Salongens namn</label>
                  <input
                    id="shopName"
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="form-input"
                    placeholder="t.ex. Royal Cuts"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slug" className="form-label">Din bokningslänk</label>
                  <div className="slug-input-wrapper">
                    <span className="slug-prefix">bokabarber.se/</span>
                    <input
                      id="slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      className="form-input slug-input"
                      placeholder="royal-cuts"
                    />
                  </div>
                </div>

                <div className="grid-responsive compact-grid compact-grid-address">
                  <div className="form-group">
                    <label htmlFor="street" className="form-label">Gatuadress</label>
                    <input
                      id="street"
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="form-input"
                      placeholder="Kungsgatan 12"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">Postort</label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                      placeholder="Stockholm"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode" className="form-label">Postnummer</label>
                    <input
                      id="zipCode"
                      type="text"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="form-input"
                      placeholder="111 35"
                    />
                  </div>
                </div>

                <h3 className="form-subheading owner-subheading">2. Ägarkonto</h3>

                <div className="grid-responsive compact-grid compact-grid-owner">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">Förnamn</label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input"
                      placeholder="Ditt förnamn"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">Efternamn</label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input"
                      placeholder="Ditt efternamn"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">E-postadress</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="namn@salong.se"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Lösenord</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Minst 6 tecken"
                    minLength={6}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary register-btn">
                  {loading ? 'Registrerar salong...' : 'Skapa salong & konto'}
                </button>
              </form>

              <div className="register-footer text-center">
                <p>Har du redan ett konto?</p>
                <Link href="/login" className="login-link">
                  Logga in här
                </Link>
              </div>
            </>
          )}

        </div>
      </div>

      <style jsx>{`
        .register-page-wrap {
          min-height: calc(100vh - 85px);
          padding: 120px 24px 60px 24px;
          background: radial-gradient(circle at 10% 80%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
        }
        @media (max-width: 768px) {
          .register-page-wrap {
            padding-top: 100px;
          }
        }
        .register-card {
          width: 100%;
          max-width: 600px;
          padding: 32px;
        }
        .register-header {
          margin-bottom: 20px;
        }
        .register-header h2 {
          font-size: 1.8rem;
          margin-bottom: 6px;
        }
        .register-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .plan-badge {
          color: var(--primary);
        }
        .form-subheading {
          font-size: 1rem;
          margin-bottom: 4px;
          margin-top: 0;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 4px;
          color: var(--text-secondary);
        }
        .owner-subheading {
          margin-top: 14px;
        }
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .register-form :global(.form-group) {
          margin-bottom: 4px !important;
          gap: 4px !important;
        }
        .register-form :global(.form-label) {
          margin-bottom: 2px;
          font-size: 0.92rem;
        }
        .register-form :global(.form-input) {
          padding: 10px 14px;
          min-height: 46px;
        }
        .compact-grid {
          gap: 8px !important;
          margin-bottom: 2px;
        }
        .compact-grid-address {
          grid-template-columns: repeat(3, minmax(140px, 1fr)) !important;
        }
        .compact-grid-owner {
          grid-template-columns: repeat(2, minmax(180px, 1fr)) !important;
        }
        @media (max-width: 720px) {
          .compact-grid-address,
          .compact-grid-owner {
            grid-template-columns: 1fr !important;
          }
        }
        .slug-input-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          overflow: hidden;
        }
        .slug-input-wrapper:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 4px rgba(193, 141, 75, 0.15);
        }
        .slug-prefix {
          padding: 10px 0 10px 14px;
          color: var(--text-muted);
          font-weight: 600;
          user-select: none;
        }
        .slug-input {
          border: none !important;
          box-shadow: none !important;
          padding-left: 4px;
        }
        .register-btn {
          width: 100%;
          margin-top: 4px;
          padding: 13px;
        }
        .error-alert {
          background-color: #fee2e2;
          color: var(--color-danger);
          padding: 10px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          margin-bottom: 12px;
        }
        .register-footer {
          margin-top: 20px;
          font-size: 0.9rem;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }
        .login-link {
          color: var(--primary);
          font-weight: 700;
        }
        .login-link:hover {
          color: var(--primary-hover);
        }

        /* SUCCESS VIEW */
        .success-register {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .success-icon {
          font-size: 4rem;
        }
        .success-register h2 {
          font-size: 2.2rem;
        }
        .success-text {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        .success-btn {
          width: 100%;
        }
        .next-steps {
          text-align: left;
          width: 100%;
          background-color: var(--bg-tertiary);
          border-left: 4px solid var(--primary);
        }
        .next-steps h4 {
          font-size: 1.05rem;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Laddar registreringssida...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

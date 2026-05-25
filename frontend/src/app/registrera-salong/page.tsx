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
              <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Logga in på instrumentpanelen
              </Link>
            </div>
          ) : (
            <>
              <div className="register-header text-center">
                <h2>Registrera din salong</h2>
                <p>Du har valt abonnemangsplanen: <strong style={{ color: 'var(--primary)' }}>{planQuery === 'pro' ? 'Professional' : 'Bas'}</strong></p>
              </div>

              {errorMsg && <div className="error-alert">⚠️ {errorMsg}</div>}

              <form onSubmit={handleSubmit} className="register-form">
                
                <h3 className="form-subheading">1. Salongsdetaljer</h3>
                
                <div className="form-group">
                  <label className="form-label">Salongens namn</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="form-input"
                    placeholder="t.ex. Royal Cuts"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Din bokningslänk</label>
                  <div className="slug-input-wrapper">
                    <span className="slug-prefix">bokabarber.se/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      className="form-input slug-input"
                      placeholder="royal-cuts"
                    />
                  </div>
                </div>

                <div className="grid-responsive" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="form-group">
                    <label className="form-label">Gatuadress</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="form-input"
                      placeholder="Kungsgatan 12"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postort</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                      placeholder="Stockholm"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postnummer</label>
                    <input
                      type="text"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="form-input"
                      placeholder="111 35"
                    />
                  </div>
                </div>

                <h3 className="form-subheading" style={{ marginTop: '24px' }}>2. Ägarkonto</h3>

                <div className="grid-responsive" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Förnamn</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Efternamn</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">E-postadress</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="namn@salong.se"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lösenord</label>
                  <input
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
          padding: 60px 24px;
          background: radial-gradient(circle at 10% 80%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
        }
        .register-card {
          width: 100%;
          max-width: 600px;
          padding: 48px;
        }
        .register-header {
          margin-bottom: 32px;
        }
        .register-header h2 {
          font-size: 2rem;
          margin-bottom: 8px;
        }
        .register-header p {
          color: var(--text-secondary);
        }
        .form-subheading {
          font-size: 1.15rem;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
          color: var(--text-secondary);
        }
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          padding: 12px 0 12px 16px;
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
          margin-top: 16px;
          padding: 14px;
        }
        .error-alert {
          background-color: #fee2e2;
          color: var(--color-danger);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          margin-bottom: 24px;
        }
        .register-footer {
          margin-top: 32px;
          font-size: 0.9rem;
          border-top: 1px solid var(--border-color);
          padding-top: 24px;
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

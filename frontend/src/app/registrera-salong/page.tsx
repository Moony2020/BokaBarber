'use client';

import React, { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api';

function RegisterContent() {
  const searchParams = useSearchParams();
  const planQuery = searchParams.get('plan') || 'bas';
  const successStorageKey = 'register-shop-success';

  interface RegisterSuccessData {
    shopId: string;
    planName: string;
    trialEndsAt: string;
    shopSlug: string;
  }

  interface PersistedRegisterSuccessState {
    shopName: string;
    slug: string;
    successData: RegisterSuccessData;
  }

  // Form states
  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<RegisterSuccessData | null>(null);
  const [hasCheckedPersistedSuccess, setHasCheckedPersistedSuccess] = useState(false);

  // Auto-generate slug from shop name using state initialization / derived state
  // We can update the slug when shopName changes without triggering direct cascading warn alerts
  useEffect(() => {
    if (!shopName.trim()) return;
    const formatted = shopName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Ta bort konstiga tecken
      .replace(/[\s_]+/g, '-')  // Byt ut mellanslag till bindestreck
      .replace(/--+/g, '-');    // Undvik dubbla bindestreck
    setSlug((prev) => (prev !== formatted ? formatted : prev));
  }, [shopName]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useLayoutEffect(() => {
    try {
      const stored = sessionStorage.getItem(successStorageKey);
      if (!stored) {
        setHasCheckedPersistedSuccess(true);
        return;
      }

      const parsed = JSON.parse(stored) as PersistedRegisterSuccessState;
      if (!parsed?.successData?.shopSlug) {
        setHasCheckedPersistedSuccess(true);
        return;
      }

      setShopName(parsed.shopName || '');
      setSlug(parsed.slug || '');
      setSuccessData(parsed.successData);
      setSuccess(true);
    } catch {
      // Ignorera fel vid parsning
    } finally {
      setHasCheckedPersistedSuccess(true);
    }
  }, []);

  const formatTrialEndDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.registerShop({
          plan: planQuery,
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
        });

      if (res.ok) {
        const responseData = res.data as RegisterSuccessData;
        setSuccessData(responseData);
        try {
          sessionStorage.setItem(successStorageKey, JSON.stringify({
            shopName,
            slug,
            successData: responseData,
          }));
        } catch {}
        setSuccess(true);
        setHasCheckedPersistedSuccess(true);
      } else {
        const data = res.data as { error?: string };
        setErrorMsg(data.error || 'Registreringen misslyckades.');
      }
    } catch {
      setErrorMsg('Nätverksfel. Kontrollera att servern är aktiv.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-page-wrap animate-fade-in${success ? ' success-page-wrap' : ''}`}>
      <div className="container flex-center">
        <div className={`register-card glass-panel${success ? ' success-card-mode' : ''}`}>

          {!hasCheckedPersistedSuccess ? (
            <div className="register-boot-shell" aria-hidden="true">
              <div className="success-register success-register-placeholder">
                <div className="success-icon-shell"></div>
                <div className="success-heading-placeholder"></div>
                <div className="success-text-placeholder"></div>
                <div className="success-summary success-summary-placeholder"></div>
                <div className="success-actions success-actions-placeholder">
                  <div className="success-btn-placeholder"></div>
                  <div className="success-btn-placeholder success-btn-placeholder-secondary"></div>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="success-register text-center">
              <div className="success-icon-shell">
                <span className="material-symbols-outlined success-icon">check_circle</span>
              </div>
              <h2>Din 14 dagars provperiod har startat</h2>
              <p className="success-text">
                Ditt salongskonto för <strong>{shopName}</strong> är nu skapat. Du kan börja lägga till tjänster, personal och öppettider direkt.
              </p>
              <div className="success-summary">
                <div className="success-summary-grid">
                  <div className="success-detail-card">
                    <p className="success-label">Vald plan</p>
                    <p className="success-value">{successData?.planName || (planQuery === 'pro' ? 'Professional' : 'Bas')}</p>
                  </div>
                  <div className="success-detail-card">
                    <p className="success-label">Provperiod slutar</p>
                    <p className="success-value">{formatTrialEndDate(successData?.trialEndsAt)}</p>
                  </div>
                </div>
                <div className="success-divider"></div>
                <div className="success-note">
                  <span className="material-symbols-outlined success-note-icon">payments</span>
                  <div>
                    <p className="success-note-title">Inget kort krävs idag.</p>
                    <p className="success-note-text">Om du vill fortsätta använda BokaBarber efter provperioden kan du aktivera betalning via Stripe Billing i din instrumentpanel.</p>
                  </div>
                </div>
              </div>
              <div className="success-actions">
                <Link href={successData?.shopId ? `/login?next=/admin/${successData.shopId}` : '/login'} className="btn btn-primary success-btn">
                  Gå till instrumentpanelen
                </Link>
                <Link href={`/${successData?.shopSlug || slug}`} className="btn btn-outline success-secondary-btn">
                  Visa bokningssidan
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="register-header text-center">
                <h2>Registrera din salong</h2>
                <p>Du har valt abonnemangsplanen: <strong className="plan-badge">{planQuery === 'pro' ? 'Professional' : 'Bas'}</strong></p>
                <p className="plan-helper-text">
                  Du får 14 dagars gratis provperiod. Inget kort krävs idag.
                </p>
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
                  <label htmlFor="slug" className="form-label">Så här blir din bokningslänk</label>
                  <p className="slug-helper-text">Vi skapar länken från salongens namn. Du kan ändra den om du vill.</p>
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
                  <p className="field-helper-text">Använd den e-postadress du vill logga in med. Det behöver inte vara en salongsdomän.</p>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="din@epost.se"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Lösenord</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingRight: '44px', width: '100%' }}
                      placeholder="Minst 6 tecken"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary, #7f7667)',
                      }}
                      aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary register-btn">
                  {loading ? 'Registrerar salong...' : 'Skapa salong & konto'}
                </button>
              </form>

              <div className="register-footer text-center">
                <p>Har du redan ett konto?</p>
                <Link href="/login" className="btn btn-outline login-link">
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
          padding: 24px 24px 60px 24px;
          background: radial-gradient(circle at 10% 80%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
        }
        .success-page-wrap {
          background:
            radial-gradient(circle at 12% 18%, rgba(197, 160, 89, 0.08) 0%, transparent 32%),
            radial-gradient(circle at 88% 82%, rgba(75, 0, 130, 0.05) 0%, transparent 34%),
            linear-gradient(180deg, rgba(250, 249, 248, 0.98) 0%, rgba(255, 255, 255, 1) 100%);
        }
        @media (max-width: 768px) {
          .register-page-wrap {
            padding: 0 12px 40px 12px;
          }
          .register-page-wrap .container {
            padding-left: 0;
            padding-right: 0;
          }
          .register-card {
            max-width: none;
            width: min(100%, calc(100vw - 24px));
            padding: 24px 18px;
          }
        }
        .register-card {
          width: 100%;
          max-width: 600px;
          padding: 32px;
        }
        .register-boot-shell {
          min-height: 760px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }
        .success-card-mode {
          max-width: 860px;
          padding: 56px 44px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(209, 197, 180, 0.28);
          box-shadow:
            0 32px 64px -18px rgba(119, 90, 25, 0.08),
            0 16px 40px -24px rgba(45, 0, 77, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
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
        .plan-helper-text {
          margin-top: 6px;
          color: var(--text-muted) !important;
          font-size: 0.9rem;
          line-height: 1.5;
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
          grid-template-columns: minmax(220px, 1.45fr) minmax(160px, 1fr) minmax(110px, 0.7fr) !important;
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
        .slug-helper-text {
          margin: 0 0 6px 0;
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--text-muted);
        }
        .field-helper-text {
          margin: 0 0 6px 0;
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--text-muted);
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
          color: #ffffff !important;
          background: linear-gradient(135deg, #d4af37 0%, #775a19 100%);
          border: 1.5px solid rgba(255, 244, 210, 0.36);
          box-shadow: 0 12px 28px rgba(197, 160, 89, 0.22);
        }
        .register-btn:hover {
          transform: none !important;
          background: linear-gradient(135deg, #ddb94d 0%, #886921 100%);
          color: #ffffff !important;
          border-color: rgba(255, 246, 221, 0.58);
          box-shadow: 0 16px 32px rgba(197, 160, 89, 0.26);
        }
        .register-btn:active {
          transform: none !important;
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
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .register-footer p {
          color: var(--text-secondary);
        }
        .login-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1.5px solid rgba(119, 90, 25, 0.18);
          background: rgba(255, 255, 255, 0.78);
          color: var(--primary);
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(119, 90, 25, 0.08);
          transition: all var(--transition-fast);
        }
        .login-link:hover {
          color: var(--primary-hover);
          border-color: rgba(119, 90, 25, 0.32);
          background: rgba(250, 249, 246, 0.96);
          box-shadow: 0 14px 28px rgba(119, 90, 25, 0.12);
        }

        /* SUCCESS VIEW */
        .success-register {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          max-width: 720px;
          margin: 0 auto;
        }
        .success-register-placeholder {
          width: 100%;
          visibility: hidden;
        }
        .success-heading-placeholder {
          height: 44px;
          width: min(100%, 520px);
        }
        .success-text-placeholder {
          height: 72px;
          width: min(100%, 640px);
        }
        .success-summary-placeholder {
          min-height: 208px;
        }
        .success-btn-placeholder {
          width: 100%;
          height: 56px;
          border-radius: 999px;
        }
        .success-icon-shell {
          width: 112px;
          height: 112px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(197, 160, 89, 0.2);
          box-shadow: 0 24px 54px rgba(45, 0, 77, 0.08);
        }
        .success-icon {
          font-size: 64px;
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 48;
        }
        .success-register h2 {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          text-align: center;
          line-height: 1.08;
        }
        .success-text {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 680px;
        }
        .success-summary {
          width: 100%;
          max-width: 640px;
          padding: 30px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 243, 0.92) 100%);
          border: 1px solid rgba(209, 197, 180, 0.28);
          border-radius: 24px;
          box-shadow: 0 32px 64px -12px rgba(119, 90, 25, 0.06);
        }
        .success-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
        .success-detail-card {
          padding: 18px 18px 16px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(209, 197, 180, 0.22);
          border-radius: 18px;
        }
        .success-label {
          margin-bottom: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .success-value {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .success-divider {
          height: 1px;
          width: 100%;
          margin: 20px 0;
          background: rgba(209, 197, 180, 0.35);
        }
        .success-note {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          text-align: left;
        }
        .success-note-icon {
          color: var(--primary);
          margin-top: 2px;
        }
        .success-note-title {
          margin-bottom: 4px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .success-note-text {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .success-btn {
          width: 100%;
          text-transform: none !important;
          letter-spacing: 0 !important;
          font-weight: 700;
        }
        .success-actions {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .success-secondary-btn {
          width: 100%;
          text-transform: none !important;
          letter-spacing: 0 !important;
          font-weight: 700;
          color: var(--primary) !important;
          border-width: 1.5px;
          border-color: rgba(119, 90, 25, 0.18) !important;
          background: rgba(255, 255, 255, 0.72) !important;
        }
        @media (min-width: 768px) {
          .success-register h2 {
            white-space: nowrap;
          }
          .success-actions {
            max-width: 620px;
            flex-direction: row;
          }
          .success-btn,
          .success-secondary-btn {
            flex: 1;
          }
        }
        @media (max-width: 640px) {
          .success-card-mode {
            padding: 40px 20px 28px;
          }
          .success-icon-shell {
            width: 96px;
            height: 96px;
          }
          .success-register h2 {
            font-size: 1.9rem;
          }
          .success-text {
            font-size: 1rem;
          }
          .success-summary {
            padding: 22px 18px;
          }
          .success-summary-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
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

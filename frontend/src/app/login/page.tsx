'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        setTimeout(() => setNextPath(next), 0);
      }
    } catch {
      // Keep nextPath as default null
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(email, password);

      if (res.ok) {
        const data = res.data as { token?: string; user: { role: string; shopId?: string; id: string; email: string; firstName: string; lastName: string } };
        if (data.token) localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));

        // Always go through /dashboard which handles the redirect safely
        window.location.href = nextPath && nextPath.startsWith('/') && nextPath !== '/login' ? nextPath : '/dashboard';
      } else {
        const errData = res.data as { error?: string };
        setErrorMsg(errData.error || 'Felaktigt lösenord eller e-postadress.');
      }
    } catch {
      setErrorMsg('Nätverksfel. Kontrollera att servern är igång.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glass-panel">
        <div className="login-header text-center">
          <h2>Välkommen tillbaka</h2>
          <p>Logga in på din BokaBarber-panel</p>
        </div>

        {errorMsg && <div className="error-alert">⚠️ {errorMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Lösenord</label>
              <Link href="/glomt-losenord" style={{ fontSize: '0.82rem', color: 'var(--accent, #b8860b)', textDecoration: 'none' }}>
                Glömt lösenord?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingRight: '44px', width: '100%' }}
                placeholder="••••••••"
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

          <button type="submit" disabled={loading} className="btn btn-primary login-btn">
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <div className="login-footer text-center">
          <p>Äger du en salong men har inget konto?</p>
          <Link href="/registrera-salong" className="register-link">
            Skapa ett salongskonto och anslut dig nu
          </Link>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: calc(100vh - 85px);
          padding: 88px 24px 60px 24px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: radial-gradient(circle at 80% 20%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
        }
        @media (max-width: 768px) {
          .login-container {
            padding-top: 72px;
          }
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 34px 32px;
        }
        .login-header {
          margin-bottom: 18px;
        }
        .login-header h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }
        .login-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-form :global(.form-group) {
          margin-bottom: 4px !important;
          gap: 4px !important;
        }
        .login-form :global(.form-label) {
          margin-bottom: 2px;
          font-size: 0.92rem;
        }
        .login-form :global(.form-input) {
          padding: 10px 14px;
          min-height: 46px;
        }
        .login-btn {
          width: 100%;
          margin-top: 4px;
          padding: 12px;
          font-size: 0.92rem;
          color: #ffffff !important;
          background: linear-gradient(135deg, #d4af37 0%, #775a19 100%);
          border: 1.5px solid rgba(255, 244, 210, 0.36);
          box-shadow: 0 12px 28px rgba(197, 160, 89, 0.22);
        }
        .login-btn:hover {
          transform: none !important;
          background: linear-gradient(135deg, #ddb94d 0%, #886921 100%);
          color: #ffffff !important;
          border-color: rgba(255, 246, 221, 0.58);
          box-shadow: 0 16px 32px rgba(197, 160, 89, 0.26);
        }
        .login-btn:active {
          transform: none !important;
        }
        .error-alert {
          background-color: #fee2e2;
          color: var(--color-danger);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .login-footer {
          margin-top: 18px;
          font-size: 0.9rem;
          border-top: 1px solid var(--border-color);
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-footer p {
          color: var(--text-secondary);
        }
        .register-link {
          color: var(--primary);
          font-weight: 700;
        }
        .register-link:hover {
          color: var(--primary-hover);
        }
      `}</style>
    </div>
  );
}

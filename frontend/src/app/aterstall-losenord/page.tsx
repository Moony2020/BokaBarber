'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) setError('Ogiltig återställningslänk. Begär en ny.');
    else setToken(t);
    setPageReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return; }
    if (password.length < 8) { setError('Lösenordet måste vara minst 8 tecken.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword(token, password);
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const d = res.data as { error?: string };
        setError(d.error || 'Något gick fel.');
      }
    } catch {
      setError('Nätverksfel. Kontrollera att servern är igång.');
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', border: '3px solid rgba(75,0,130,0.12)',
            borderTopColor: '#4b0082', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: 'rgba(28,27,31,0.5)', fontSize: '0.95rem' }}>Laddar...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glass-panel">
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-primary,serif)', fontSize: '1.8rem', color: '#4b0082', marginBottom: '12px' }}>
              Lösenord återställt!
            </h2>
            <p style={{ color: 'rgba(28,27,31,0.65)', marginBottom: '24px' }}>
              Du omdirigeras till inloggningssidan...
            </p>
            <Link href="/login" style={{ color: '#b8860b', fontWeight: 600, textDecoration: 'none' }}>
              Gå till inloggning →
            </Link>
          </div>
        ) : (
          <>
            <div className="login-header text-center">
              <h2>Nytt lösenord</h2>
              <p>Välj ett nytt lösenord för ditt konto.</p>
            </div>

            {error && <div className="error-alert">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Nytt lösenord</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Minst 8 tecken"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bekräfta lösenord</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="form-input"
                  placeholder="Upprepa lösenordet"
                />
              </div>
              <button type="submit" disabled={loading || !token} className="btn btn-primary login-btn">
                {loading ? 'Sparar...' : 'Spara nytt lösenord'}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .login-container {
          min-height: calc(100vh - 85px);
          padding: 88px 24px 60px 24px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 34px 32px;
        }
        .login-header { margin-bottom: 18px; }
        .login-header h2 { font-size: 1.8rem; margin-bottom: 8px; }
        .login-header p { color: var(--text-secondary); font-size: 0.95rem; }
        .login-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
        .login-btn { width: 100%; padding: 14px; font-size: 1rem; }
      `}</style>
    </div>
  );
}

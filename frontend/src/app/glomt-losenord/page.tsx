'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(email);
      if (res.ok) {
        setSent(true);
      } else {
        const d = res.data as { error?: string };
        setError(d.error || 'Något gick fel. Försök igen.');
      }
    } catch {
      setError('Nätverksfel. Kontrollera att servern är igång.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glass-panel">
        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
            <h2 style={{ fontFamily: 'var(--font-primary,serif)', fontSize: '1.8rem', color: '#4b0082', marginBottom: '12px' }}>
              Kolla din inbox
            </h2>
            <p style={{ color: 'rgba(28,27,31,0.65)', lineHeight: 1.6, marginBottom: '24px' }}>
              Om <strong>{email}</strong> finns registrerad har vi skickat en länk för att återställa ditt lösenord.
            </p>
            <Link href="/login" style={{ color: '#b8860b', fontWeight: 600, textDecoration: 'none' }}>
              ← Tillbaka till inloggning
            </Link>
          </div>
        ) : (
          <>
            <div className="login-header text-center">
              <h2>Glömt lösenord?</h2>
              <p>Ange din e-postadress så skickar vi en återställningslänk.</p>
            </div>

            {error && <div className="error-alert">⚠️ {error}</div>}

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
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary login-btn">
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
              </button>
            </form>

            <div className="login-footer text-center">
              <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                ← Tillbaka till inloggning
              </Link>
            </div>
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
          background: radial-gradient(circle at 80% 20%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
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
          gap: 20px;
          margin-bottom: 24px;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
        }
        .login-footer {
          padding-top: 16px;
          border-top: 1px solid var(--border-light, rgba(0,0,0,0.07));
        }
      `}</style>
    </div>
  );
}

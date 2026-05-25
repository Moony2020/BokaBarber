'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(email, password);

      if (res.ok) {
        const data = res.data as { user: { role: string; shopId?: string; id: string; email: string; firstName: string; lastName: string } };
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'super_admin') {
          router.push('/super');
        } else if (data.user.role === 'shop_admin') {
          router.push(`/admin/${data.user.shopId}`);
        } else {
          router.push('/');
        }
        
        router.refresh();
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
    <div className="login-container flex-center animate-fade-in">
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
            <label className="form-label">Lösenord</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
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
          min-height: calc(100vh - 160px);
          padding: 40px 24px;
          background: radial-gradient(circle at 80% 20%, rgba(193, 141, 75, 0.04) 0%, transparent 50%);
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 48px 40px;
        }
        .login-header {
          margin-bottom: 32px;
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
          gap: 16px;
        }
        .login-btn {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
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
          margin-top: 32px;
          font-size: 0.9rem;
          border-top: 1px solid var(--border-color);
          padding-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
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

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/utils/api';

export default function DashboardRedirect() {
  const [info, setInfo] = useState<{ role?: string; shopId?: string; error?: string; status?: number } | null>(null);

  useEffect(() => {
    const go = async () => {
      try {
        const res = await api.me();
        if (res.ok) {
          const data = res.data as { user: { role: string; shopId?: string } };
          const { role, shopId } = data.user;
          setInfo({ role, shopId });
          setTimeout(() => {
            if (role === 'super_admin') {
              window.location.replace('/super');
            } else if (role === 'shop_admin' && shopId) {
              window.location.replace(`/admin/${shopId}`);
            }
          }, 1000);
        } else {
          setInfo({ error: `Svar från server: HTTP ${res.status}. Inte inloggad.`, status: res.status });
        }
      } catch (e: unknown) {
        setInfo({ error: `Nätverksfel: ${e instanceof Error ? e.message : String(e)}` });
      }
    };
    go();
  }, []);

  const box: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#faf9f6', padding: 24, gap: 16
  };
  const card: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: '32px 28px',
    maxWidth: 480, width: '100%', textAlign: 'center',
    boxShadow: '0 8px 30px rgba(75,0,130,0.08)', border: '1px solid rgba(197,160,89,0.2)'
  };

  if (!info) return (
    <div style={box}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(75,0,130,0.12)', borderTopColor: '#4b0082', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: 'rgba(28,27,31,0.5)', fontSize: '0.95rem' }}>Kontrollerar inloggning...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (info.error) return (
    <div style={box}>
      <div style={card}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontFamily: 'serif', color: '#4b0082', marginBottom: 8 }}>Session utgången</h2>
        <p style={{ color: '#c00', fontSize: '0.85rem', marginBottom: 20, background: '#fff0f0', padding: 12, borderRadius: 8 }}>{info.error}</p>
        <a href="/login" style={{ display: 'inline-block', background: '#4b0082', color: 'white', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
          Logga in på nytt →
        </a>
      </div>
    </div>
  );

  if (info.role === 'shop_admin' && !info.shopId) return (
    <div style={box}>
      <div style={card}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontFamily: 'serif', color: '#4b0082', marginBottom: 8 }}>Ingen salong kopplad</h2>
        <p style={{ color: 'rgba(28,27,31,0.6)', marginBottom: 20 }}>Du är inloggad som <strong>{info.role}</strong> men kontot saknar ett salongs-ID i databasen.</p>
        <p style={{ color: 'rgba(28,27,31,0.5)', fontSize: '0.82rem' }}>Kontakta <a href="mailto:support@bokabarber.se" style={{ color: '#4b0082' }}>support@bokabarber.se</a></p>
      </div>
    </div>
  );

  if (info.role !== 'shop_admin' && info.role !== 'super_admin') return (
    <div style={box}>
      <div style={card}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
        <h2 style={{ fontFamily: 'serif', color: '#4b0082', marginBottom: 8 }}>Fel roll</h2>
        <p style={{ color: 'rgba(28,27,31,0.6)', marginBottom: 20 }}>Ditt konto har rollen <strong>"{info.role}"</strong> och kan inte komma åt adminpanelen.</p>
        <a href="/login" style={{ display: 'inline-block', background: '#4b0082', color: 'white', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
          Logga in med ett annat konto →
        </a>
      </div>
    </div>
  );

  return (
    <div style={box}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(75,0,130,0.12)', borderTopColor: '#4b0082', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: 'rgba(28,27,31,0.5)', fontSize: '0.95rem' }}>Öppnar din instrumentpanel...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

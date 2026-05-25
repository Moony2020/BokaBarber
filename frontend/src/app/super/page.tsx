'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface PlatformStats {
  totalShops: number;
  activeShops: number;
  suspendedSubs: number;
  totalBookings: number;
  totalUsers: number;
  mrr: number;
}

interface ShopData {
  _id: string;
  name: string;
  slug: string;
  address: { city: string; street: string };
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  subStatus: string;
  mrr: number;
  createdAt: string;
}

interface AuditEntry {
  _id: string;
  action: string;
  shopName: string;
  userId: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'oversikt' | 'salonger' | 'loggar'>('oversikt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<PlatformStats>({ totalShops: 0, activeShops: 0, suspendedSubs: 0, totalBookings: 0, totalUsers: 0, mrr: 0 });
  const [shops, setShops] = useState<ShopData[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'super_admin') { router.push('/'); }
  }, [router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.superDashboard();
      if (res.ok) setStats(res.data as PlatformStats);
      else if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
      else setError('Kunde inte hämta plattformsdata.');
    } catch { setError('Serverfel vid hämtning av dashboard.'); }
    finally { setLoading(false); }
  }, [router]);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superShops();
      if (res.ok) setShops((res.data as { shops: ShopData[] }).shops || []);
    } catch { setError('Kunde inte hämta salonger.'); }
    finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superAuditLogs();
      if (res.ok) setLogs((res.data as { logs: AuditEntry[] }).logs || []);
    } catch { setError('Kunde inte hämta loggar.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'oversikt') loadDashboard();
    else if (activeTab === 'salonger') loadShops();
    else if (activeTab === 'loggar') loadLogs();
  }, [activeTab, loadDashboard, loadShops, loadLogs]);

  const handleToggleShop = async (shopId: string, isActive: boolean) => {
    const action = isActive ? 'suspend' : 'reactivate';
    if (!confirm(isActive ? 'Vill du stänga av denna salong?' : 'Vill du återaktivera denna salong?')) return;
    await api.superToggleShop(shopId, action);
    loadShops();
  };

  return (
    <div className="super-dashboard-wrapper animate-fade-in">
      <div className="super-sidebar">
        <div className="sidebar-brand">👑 Boka<span>Barber</span> Super</div>
        <nav className="sidebar-nav">
          {[
            { key: 'oversikt', icon: '📊', label: 'Plattform' },
            { key: 'salonger', icon: '💈', label: 'Salonger' },
            { key: 'loggar', icon: '📜', label: 'Händelselogg' }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={activeTab === tab.key ? 'active' : ''}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="super-main-panel">
        <header className="super-top-bar">
          <h2>{activeTab === 'oversikt' ? 'Plattformsöversikt' : activeTab === 'salonger' ? 'Alla Salonger' : 'Händelselogg'}</h2>
          <span className="super-badge">👑 Super Admin</span>
        </header>

        <div className="super-content-area">
          {error && <div className="error-alert">⚠️ {error}</div>}
          {loading && <div className="loading-indicator">⏳ Laddar data...</div>}

          {/* PLATFORM OVERVIEW */}
          {activeTab === 'oversikt' && !loading && (
            <div className="tab-pane">
              <div className="kpi-grid-super">
                <div className="kpi-card card-premium"><h4>MRR</h4><div className="kpi-val accent">{stats.mrr.toLocaleString('sv-SE')} kr</div></div>
                <div className="kpi-card card-premium"><h4>Aktiva salonger</h4><div className="kpi-val">{stats.activeShops}</div></div>
                <div className="kpi-card card-premium"><h4>Totala salonger</h4><div className="kpi-val">{stats.totalShops}</div></div>
                <div className="kpi-card card-premium"><h4>Användare</h4><div className="kpi-val">{stats.totalUsers}</div></div>
                <div className="kpi-card card-premium"><h4>Totala bokningar</h4><div className="kpi-val">{stats.totalBookings}</div></div>
                <div className="kpi-card card-premium"><h4>Avstängda</h4><div className="kpi-val danger">{stats.suspendedSubs}</div></div>
              </div>
            </div>
          )}

          {/* SHOPS LIST */}
          {activeTab === 'salonger' && !loading && (
            <div className="tab-pane card-premium">
              <h3 style={{ marginBottom: '24px' }}>Registrerade salonger ({shops.length})</h3>
              {shops.length === 0 ? (
                <div className="empty-state">Inga salonger registrerade ännu.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>Salong</th><th>Stad</th><th>Ägare</th><th>Plan</th><th>Status</th><th>MRR</th><th>Åtgärd</th></tr></thead>
                    <tbody>
                      {shops.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.name}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{s.slug}</span></td>
                          <td>{s.address?.city || '-'}</td>
                          <td>{s.ownerName}<br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.ownerEmail}</span></td>
                          <td><span className="plan-badge">{s.planName}</span></td>
                          <td><span className={`status-badge ${s.isActive ? 'confirmed' : 'cancelled_by_shop'}`}>{s.isActive ? 'Aktiv' : 'Avstängd'}</span></td>
                          <td>{s.mrr} kr</td>
                          <td>
                            <button onClick={() => handleToggleShop(s._id, s.isActive)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: s.isActive ? 'var(--color-danger)' : 'var(--color-success)' }}>
                              {s.isActive ? 'Stäng av' : 'Aktivera'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'loggar' && !loading && (
            <div className="tab-pane card-premium">
              <h3 style={{ marginBottom: '24px' }}>Senaste händelser</h3>
              {logs.length === 0 ? (
                <div className="empty-state">Inga loggade händelser ännu.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>Tid</th><th>Åtgärd</th><th>Användare</th><th>Salong</th></tr></thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l._id}>
                          <td>{new Date(l.createdAt).toLocaleString('sv-SE')}</td>
                          <td><code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>{l.action}</code></td>
                          <td>{l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : '-'}</td>
                          <td>{l.shopName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .super-dashboard-wrapper { display: flex; min-height: calc(100vh - 160px); }
        .super-sidebar { width: 260px; background: linear-gradient(180deg, #1a1a2e, #16213e); color: #94a3b8; display: flex; flex-direction: column; border-right: 1px solid #2a2a4e; flex-shrink: 0; }
        .sidebar-brand { padding: 24px; font-family: var(--font-primary); font-size: 1.3rem; font-weight: 800; color: #f8fafc; border-bottom: 1px solid #2a2a4e; }
        .sidebar-brand span { color: #fbbf24; }
        .sidebar-nav { display: flex; flex-direction: column; padding: 16px 0; }
        .sidebar-nav button { background: transparent; color: #94a3b8; padding: 14px 24px; text-align: left; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); font-size: 0.95rem; border: none; }
        .sidebar-nav button:hover { color: #f8fafc; background-color: #2a2a4e; }
        .sidebar-nav button.active { color: #fbbf24; background-color: #1e293b; border-left: 4px solid #fbbf24; }
        .super-main-panel { flex: 1; display: flex; flex-direction: column; background-color: var(--bg-primary); min-width: 0; }
        .super-top-bar { background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-color); padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
        .super-top-bar h2 { font-size: 1.5rem; }
        .super-badge { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1a1a2e; padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 800; }
        .super-content-area { padding: 32px; flex: 1; overflow-y: auto; }
        .kpi-grid-super { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; }
        .kpi-card h4 { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .kpi-val { font-size: 2rem; font-weight: 800; color: var(--primary); }
        .kpi-val.accent { color: #fbbf24; }
        .kpi-val.danger { color: var(--color-danger); }
        .plan-badge { background-color: var(--primary-lightest); color: var(--primary); padding: 4px 10px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.8rem; }
        .table-responsive { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
        .admin-table th { background-color: var(--bg-tertiary); padding: 12px 16px; font-weight: 700; color: var(--text-secondary); border-bottom: 2px solid var(--border-color); }
        .admin-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); }
        .status-badge { padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
        .status-badge.confirmed { background-color: #d1fae5; color: #065f46; }
        .status-badge.cancelled_by_shop { background-color: #fee2e2; color: #991b1b; }
        .error-alert { background-color: #fee2e2; color: var(--color-danger); padding: 12px; border-radius: var(--radius-sm); font-weight: 600; margin-bottom: 24px; }
        .loading-indicator { text-align: center; padding: 48px; font-weight: 600; color: var(--text-secondary); font-size: 1.1rem; }
        .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); }
        @media (max-width: 768px) {
          .super-dashboard-wrapper { flex-direction: column; }
          .super-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #2a2a4e; }
          .sidebar-nav { flex-direction: row; overflow-x: auto; padding: 8px 16px; }
          .sidebar-nav button { padding: 10px 16px; white-space: nowrap; }
          .super-content-area { padding: 16px; }
        }
      `}</style>
    </div>
  );
}

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
  isReady?: boolean;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const verifyAuth = async (isInitial = false) => {
      try {
        const res = await api.me();
        if (res.ok) {
          const data = res.data as { user: { role: string } };
          if (data.user.role !== 'super_admin') {
            router.push('/');
          }
        } else {
          if (isInitial || res.status === 401 || res.status === 403) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Auth verification failed', err);
        if (isInitial) {
          router.push('/login');
        }
      }
    };
    verifyAuth(true);

    const authCheckInterval = setInterval(() => verifyAuth(false), 30000);
    return () => clearInterval(authCheckInterval);
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
          {activeTab === 'salonger' && !loading && (() => {
            const filteredShops = shops.filter(s => {
              if (statusFilter === 'all') return true;
              if (statusFilter === 'trial') return s.subStatus === 'trial';
              if (statusFilter === 'active') return s.subStatus === 'active';
              if (statusFilter === 'past_due') return s.subStatus === 'past_due';
              if (statusFilter === 'suspended') return s.subStatus === 'suspended';
              if (statusFilter === 'cancelled') return s.subStatus === 'cancelled';
              if (statusFilter === 'not_ready') return !s.isReady;
              return true;
            });

            return (
              <div className="tab-pane card-premium">
                <div className="flex-between-center-wrap-16" >
                  <h3 className="m-0" >Registrerade salonger ({filteredShops.length})</h3>
                  <div className="flex-center-gap-12" >
                    <label htmlFor="status-filter" className="text-label-bold" >Filtrera status:</label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="form-input select-filter" 
                    >
                      <option value="all">Alla</option>
                      <option value="trial">Trial (Provperiod)</option>
                      <option value="active">Aktiv prenumeration</option>
                      <option value="past_due">Past Due (Utebliven betalning)</option>
                      <option value="suspended">Suspended (Avstängd)</option>
                      <option value="cancelled">Cancelled (Avbruten)</option>
                      <option value="not_ready">Inte redo (Saknar personal/tjänster)</option>
                    </select>
                  </div>
                </div>

                {filteredShops.length === 0 ? (
                  <div className="empty-state">Inga salonger matchar det valda filtret.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>Salong</th><th>Stad</th><th>Ägare</th><th>Plan</th><th>Status</th><th>MRR</th><th>Åtgärd</th></tr></thead>
                      <tbody>
                        {filteredShops.map(s => (
                          <tr key={s._id}>
                            <td>
                              <strong>{s.name}</strong>
                              {!s.isReady && <span className="badge-not-ready" >EJ REDO</span>}
                              <br />
                              <span className="text-xs-muted" >/{s.slug}</span>
                            </td>
                            <td>{s.address?.city || '-'}</td>
                            <td>{s.ownerName}<br /><span className="text-xs-muted" >{s.ownerEmail}</span></td>
                            <td><span className="plan-badge">{s.planName}</span></td>
                            <td>
                              <span className={`status-badge ${
                                s.subStatus === 'active' || s.subStatus === 'trial' ? 'confirmed' : 'cancelled_by_shop'
                              }`}>
                                {s.subStatus === 'active' ? 'Aktiv' : s.subStatus === 'trial' ? 'Trial' : s.subStatus === 'suspended' ? 'Suspended' : s.subStatus === 'past_due' ? 'Past Due' : s.subStatus === 'cancelled' ? 'Cancelled' : 'Inaktiv'}
                              </span>
                            </td>
                            <td>{s.mrr} kr</td>
                            <td>
                              <button onClick={() => handleToggleShop(s._id, s.isActive)} className={`btn btn-secondary btn-sm ${s.isActive ? 'text-danger' : 'text-success'}`}>
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
            );
          })()}

          {/* AUDIT LOGS */}
          {activeTab === 'loggar' && !loading && (
            <div className="tab-pane card-premium">
              <h3 className="mb-24" >Senaste händelser</h3>
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
                          <td><code className="code-badge" >{l.action}</code></td>
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

        .flex-between-center-wrap-16 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .m-0 { margin: 0; }
        .flex-center-gap-12 { display: flex; align-items: center; gap: 12px; }
        .text-label-bold { font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; }
        .select-filter { padding: 8px 12px; font-size: 0.85rem; width: 220px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-secondary); }
        .badge-not-ready { margin-left: 8px; background-color: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
        .text-xs-muted { font-size: 0.8rem; color: var(--text-muted); }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
        .text-danger { color: var(--color-danger) !important; }
        .text-success { color: var(--color-success) !important; }
        .mb-24 { margin-bottom: 24px; }
        .code-badge { background-color: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; }

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

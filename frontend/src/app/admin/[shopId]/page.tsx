'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface DashboardStats {
  todayBookings: number;
  monthRevenue: number;
  totalCustomers: number;
  activeBarbers: number;
}

interface BookingItem {
  _id: string;
  customerName: string;
  serviceName: string;
  servicePrice: number;
  barberName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
}

interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

interface BarberItem {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  isActive: boolean;
  services: string[];
}

interface CustomerItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bookingCount: number;
}

export default function ShopAdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [activeTab, setActiveTab] = useState<'oversikt' | 'kalender' | 'tjanster' | 'personal' | 'kunder' | 'installningar'>('oversikt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real data states
  const [stats, setStats] = useState<DashboardStats>({ todayBookings: 0, monthRevenue: 0, totalCustomers: 0, activeBarbers: 0 });
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(400);
  const [savingService, setSavingService] = useState(false);

  // Settings form
  const [cancellationHours, setCancellationHours] = useState(24);
  const [depositPct, setDepositPct] = useState(0);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Auth check
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'shop_admin' && user.role !== 'super_admin') { router.push('/'); }
  }, [router]);

  // Load data based on active tab
  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.adminDashboard(shopId);
      if (res.ok) setStats(res.data as DashboardStats);
      const bk = await api.adminBookings(shopId);
      if (bk.ok) setBookings((bk.data as { bookings: BookingItem[] }).bookings || []);
    } catch { setError('Kunde inte hämta data från servern.'); }
    finally { setLoading(false); }
  }, [shopId]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminServices(shopId);
      if (res.ok) setServices((res.data as { services: ServiceItem[] }).services || []);
    } catch { setError('Kunde inte hämta tjänster.'); }
    finally { setLoading(false); }
  }, [shopId]);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminBarbers(shopId);
      if (res.ok) setBarbers((res.data as { barbers: BarberItem[] }).barbers || []);
    } catch { setError('Kunde inte hämta frisörer.'); }
    finally { setLoading(false); }
  }, [shopId]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminCustomers(shopId);
      if (res.ok) setCustomers((res.data as { customers: CustomerItem[] }).customers || []);
    } catch { setError('Kunde inte hämta kunder.'); }
    finally { setLoading(false); }
  }, [shopId]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSettings(shopId);
      if (res.ok) {
        const d = res.data as { settings: { cancellationWindowHours: number; depositPercentage: number; openingHours: { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[] } };
        if (d.settings) {
          setCancellationHours(d.settings.cancellationWindowHours);
          setDepositPct(d.settings.depositPercentage);
          const mon = d.settings.openingHours?.find(h => h.dayOfWeek === 1);
          if (mon) { setOpenTime(mon.openTime); setCloseTime(mon.closeTime); }
        }
      }
    } catch { setError('Kunde inte hämta inställningar.'); }
    finally { setLoading(false); }
  }, [shopId]);

  useEffect(() => {
    if (activeTab === 'oversikt' || activeTab === 'kalender') loadDashboard();
    else if (activeTab === 'tjanster') loadServices();
    else if (activeTab === 'personal') loadBarbers();
    else if (activeTab === 'kunder') loadCustomers();
    else if (activeTab === 'installningar') loadSettings();
  }, [activeTab, loadDashboard, loadServices, loadBarbers, loadCustomers, loadSettings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const res = await api.adminUpdateBookingStatus(shopId, bookingId, newStatus);
    if (res.ok) loadDashboard();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingService(true);
    const res = await api.adminCreateService(shopId, {
      name: newServiceName, description: newServiceDesc,
      durationMinutes: newServiceDuration, price: newServicePrice
    });
    setSavingService(false);
    if (res.ok) { setNewServiceName(''); setNewServiceDesc(''); loadServices(); }
  };

  const handleToggleService = async (serviceId: string) => {
    await api.adminToggleService(shopId, serviceId);
    loadServices();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await api.adminUpdateSettings(shopId, {
      cancellationWindowHours: cancellationHours,
      depositPercentage: depositPct
    });
    setSavingSettings(false);
    alert('Inställningar sparade!');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      confirmed: 'Bekräftad', paid: 'Betald', completed: 'Slutförd',
      cancelled_by_customer: 'Avbokad (kund)', cancelled_by_shop: 'Avbokad (salong)',
      no_show: 'Utebliven', pending: 'Väntande', rescheduled: 'Ombokad'
    };
    return map[s] || s;
  };

  return (
    <div className="admin-dashboard-wrapper animate-fade-in">
      <div className="admin-sidebar">
        <div className="sidebar-brand">💈 Boka<span>Barber</span> Admin</div>
        <nav className="sidebar-nav">
          {[
            { key: 'oversikt', icon: '📊', label: 'Översikt' },
            { key: 'kalender', icon: '📅', label: 'Bokningar' },
            { key: 'tjanster', icon: '✂️', label: 'Tjänster' },
            { key: 'personal', icon: '💈', label: 'Personal' },
            { key: 'kunder', icon: '👥', label: 'Kunder' },
            { key: 'installningar', icon: '⚙️', label: 'Inställningar' }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={activeTab === tab.key ? 'active' : ''}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="admin-main-panel">
        <header className="admin-top-bar">
          <h2>{activeTab === 'oversikt' ? 'Översikt' : activeTab === 'kalender' ? 'Alla Bokningar' : activeTab === 'tjanster' ? 'Tjänster' : activeTab === 'personal' ? 'Personal' : activeTab === 'kunder' ? 'Kundregister' : 'Inställningar'}</h2>
          <div className="admin-shop-badge">🔗 Salong-ID: {shopId.substring(0, 8)}...</div>
        </header>

        <div className="admin-content-area">
          {error && <div className="error-alert">⚠️ {error}</div>}
          {loading && <div className="loading-indicator">⏳ Laddar data från databasen...</div>}

          {/* OVERVIEW */}
          {activeTab === 'oversikt' && !loading && (
            <div className="tab-pane">
              <div className="kpi-grid">
                <div className="kpi-card card-premium"><h4>Dagens bokningar</h4><div className="kpi-val">{stats.todayBookings}</div></div>
                <div className="kpi-card card-premium"><h4>Intäkter denna månad</h4><div className="kpi-val">{stats.monthRevenue.toLocaleString('sv-SE')} kr</div></div>
                <div className="kpi-card card-premium"><h4>Registrerade kunder</h4><div className="kpi-val">{stats.totalCustomers}</div></div>
                <div className="kpi-card card-premium"><h4>Aktiva frisörer</h4><div className="kpi-val">{stats.activeBarbers}</div></div>
              </div>

              <div className="card-premium" style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Senaste bokningar</h3>
                {bookings.length === 0 ? (
                  <div className="empty-state">📭 Inga bokningar hittades ännu. När kunder bokar tider visas de här.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>Kund</th><th>Tjänst</th><th>Frisör</th><th>Tid</th><th>Pris</th><th>Status</th><th>Åtgärd</th></tr></thead>
                      <tbody>
                        {bookings.slice(0, 10).map(b => (
                          <tr key={b._id}>
                            <td><strong>{b.customerName}</strong></td>
                            <td>{b.serviceName}</td>
                            <td>{b.barberName}</td>
                            <td>Kl. {formatTime(b.startTime)}</td>
                            <td>{b.totalPrice} kr</td>
                            <td><span className={`status-badge ${b.status}`}>{statusLabel(b.status)}</span></td>
                            <td>
                              <div className="table-action-btns">
                                {b.status === 'confirmed' && <button onClick={() => handleUpdateStatus(b._id, 'completed')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Slutförd</button>}
                                {(b.status === 'confirmed' || b.status === 'paid') && <button onClick={() => handleUpdateStatus(b._id, 'no_show')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>Utebliven</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOOKINGS LIST */}
          {activeTab === 'kalender' && !loading && (
            <div className="tab-pane card-premium">
              <h3 style={{ marginBottom: '24px' }}>Alla bokningar ({bookings.length} totalt)</h3>
              {bookings.length === 0 ? (
                <div className="empty-state">📭 Inga bokningar registrerade ännu.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>Datum</th><th>Tid</th><th>Kund</th><th>Tjänst</th><th>Frisör</th><th>Pris</th><th>Status</th></tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id}>
                          <td>{new Date(b.startTime).toLocaleDateString('sv-SE')}</td>
                          <td>{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
                          <td><strong>{b.customerName}</strong></td>
                          <td>{b.serviceName}</td>
                          <td>{b.barberName}</td>
                          <td>{b.totalPrice} kr</td>
                          <td><span className={`status-badge ${b.status}`}>{statusLabel(b.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {activeTab === 'tjanster' && !loading && (
            <div className="tab-pane">
              <div className="two-col-layout">
                <div className="card-premium">
                  <h3>Aktiva tjänster ({services.length})</h3>
                  {services.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '16px' }}>Inga tjänster skapade ännu. Lägg till din första tjänst till höger →</div>
                  ) : (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {services.map(s => (
                        <div key={s._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: s.isActive ? 1 : 0.5 }}>
                          <div>
                            <strong>{s.name}</strong>
                            {s.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.description}</p>}
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ {s.durationMinutes} min | 💵 {s.price} kr</p>
                          </div>
                          <button onClick={() => handleToggleService(s._id)} className={`btn ${s.isActive ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                            {s.isActive ? 'Inaktivera' : 'Aktivera'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-premium">
                  <h3>Lägg till ny tjänst</h3>
                  <form onSubmit={handleAddService} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group"><label className="form-label">Namn</label><input type="text" required value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="form-input" placeholder="t.ex. Maskinklippning" /></div>
                    <div className="form-group"><label className="form-label">Beskrivning</label><input type="text" value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} className="form-input" placeholder="Valfri beskrivning" /></div>
                    <div className="form-group"><label className="form-label">Tid (min)</label><input type="number" required value={newServiceDuration} onChange={e => setNewServiceDuration(Number(e.target.value))} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Pris (kr)</label><input type="number" required value={newServicePrice} onChange={e => setNewServicePrice(Number(e.target.value))} className="form-input" /></div>
                    <button type="submit" disabled={savingService} className="btn btn-primary" style={{ width: '100%' }}>{savingService ? 'Sparar...' : 'Spara tjänst'}</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* STAFF */}
          {activeTab === 'personal' && !loading && (
            <div className="tab-pane card-premium">
              <h3>Frisörer & Personal ({barbers.length})</h3>
              {barbers.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '16px' }}>Inga frisörer registrerade ännu.</div>
              ) : (
                <div className="grid-responsive" style={{ marginTop: '24px' }}>
                  {barbers.map(b => (
                    <div key={b._id} className="card-premium" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✂️</div>
                      <h4>{b.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{b.email}</p>
                      {b.bio && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{b.bio}</p>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                        {b.services.map(s => (
                          <span key={s} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                      <span className={`status-badge ${b.isActive ? 'confirmed' : 'cancelled_by_shop'}`} style={{ marginTop: '12px', display: 'inline-block' }}>
                        {b.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === 'kunder' && !loading && (
            <div className="tab-pane card-premium">
              <h3 style={{ marginBottom: '16px' }}>Kundregister ({customers.length} kunder)</h3>
              {customers.length === 0 ? (
                <div className="empty-state">📭 Inga kunder registrerade ännu. De skapas automatiskt vid bokning.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>Namn</th><th>E-post</th><th>Telefon</th><th>Antal bokningar</th></tr></thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c._id}>
                          <td><strong>{c.firstName} {c.lastName}</strong></td>
                          <td>{c.email}</td>
                          <td>{c.phoneNumber}</td>
                          <td><span className="booking-badge">{c.bookingCount}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'installningar' && !loading && (
            <div className="tab-pane card-premium">
              <h3>Salongens inställningar</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Dessa inställningar sparas direkt i databasen och påverkar bokningssidan.</p>
              <form onSubmit={e => { e.preventDefault(); handleSaveSettings(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="form-label">Avbokningsfönster (timmar innan)</label>
                  <input type="number" value={cancellationHours} onChange={e => setCancellationHours(Number(e.target.value))} className="form-input" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kunder kan inte avboka online senare än detta.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Deposition vid onlinebokning (%)</label>
                  <input type="number" value={depositPct} onChange={e => setDepositPct(Number(e.target.value))} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Öppettider (Mån-Fre)</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input type="text" value={openTime} onChange={e => setOpenTime(e.target.value)} className="form-input" style={{ maxWidth: '100px' }} />
                    <span>till</span>
                    <input type="text" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="form-input" style={{ maxWidth: '100px' }} />
                  </div>
                </div>
                <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ width: 'fit-content' }}>
                  {savingSettings ? 'Sparar...' : 'Spara inställningar'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard-wrapper { display: flex; min-height: calc(100vh - 160px); }
        .admin-sidebar { width: 260px; background-color: var(--secondary-hover); color: #94a3b8; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); flex-shrink: 0; }
        .sidebar-brand { padding: 24px; font-family: var(--font-primary); font-size: 1.3rem; font-weight: 800; color: #f8fafc; border-bottom: 1px solid #1e293b; }
        .sidebar-brand span { color: var(--primary); }
        .sidebar-nav { display: flex; flex-direction: column; padding: 16px 0; }
        .sidebar-nav button { background: transparent; color: #94a3b8; padding: 14px 24px; text-align: left; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); font-size: 0.95rem; }
        .sidebar-nav button:hover { color: #f8fafc; background-color: #1e293b; }
        .sidebar-nav button.active { color: #f8fafc; background-color: var(--secondary); border-left: 4px solid var(--primary); }
        .admin-main-panel { flex: 1; display: flex; flex-direction: column; background-color: var(--bg-primary); min-width: 0; }
        .admin-top-bar { background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-color); padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
        .admin-top-bar h2 { font-size: 1.5rem; }
        .admin-shop-badge { background-color: var(--bg-tertiary); padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
        .admin-content-area { padding: 32px; flex: 1; overflow-y: auto; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
        .kpi-card h4 { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .kpi-val { font-size: 2.2rem; font-weight: 800; color: var(--primary); }
        .table-responsive { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
        .admin-table th { background-color: var(--bg-tertiary); padding: 12px 16px; font-weight: 700; color: var(--text-secondary); border-bottom: 2px solid var(--border-color); }
        .admin-table td { padding: 16px; border-bottom: 1px solid var(--border-color); }
        .status-badge { padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
        .status-badge.confirmed { background-color: #d1fae5; color: #065f46; }
        .status-badge.paid { background-color: #dbeafe; color: #1e40af; }
        .status-badge.completed { background-color: #d1fae5; color: #065f46; }
        .status-badge.no_show, .status-badge.cancelled_by_shop, .status-badge.cancelled_by_customer { background-color: #fee2e2; color: #991b1b; }
        .booking-badge { background-color: var(--primary-lightest); color: var(--primary); padding: 4px 10px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.8rem; }
        .table-action-btns { display: flex; gap: 8px; }
        .error-alert { background-color: #fee2e2; color: var(--color-danger); padding: 12px; border-radius: var(--radius-sm); font-weight: 600; margin-bottom: 24px; }
        .loading-indicator { text-align: center; padding: 48px; font-weight: 600; color: var(--text-secondary); font-size: 1.1rem; }
        .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); }
        .two-col-layout { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 992px) { .two-col-layout { grid-template-columns: 1.2fr 0.8fr; } }
        @media (max-width: 768px) {
          .admin-dashboard-wrapper { flex-direction: column; }
          .admin-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border-color); }
          .sidebar-nav { flex-direction: row; overflow-x: auto; padding: 8px 16px; }
          .sidebar-nav button { padding: 10px 16px; white-space: nowrap; }
          .admin-content-area { padding: 16px; }
        }
      `}</style>
    </div>
  );
}

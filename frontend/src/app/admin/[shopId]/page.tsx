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
  const [newServiceDuration, setNewServiceDuration] = useState<number | ''>(30);
  const [newServicePrice, setNewServicePrice] = useState<number | ''>(400);
  const [savingService, setSavingService] = useState(false);

  // Settings form
  const [cancellationHours, setCancellationHours] = useState<number | ''>(24);
  const [depositPct, setDepositPct] = useState<number | ''>(0);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Shop details
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [subscription, setSubscription] = useState<{ status: string; trialEndsAt: string; gracePeriodEndsAt?: string } | null>(null);
  const [newBookingNotifications, setNewBookingNotifications] = useState<string[]>([]);

  // Barber form
  const [newBarberFirstName, setNewBarberFirstName] = useState('');
  const [newBarberLastName, setNewBarberLastName] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [newBarberBio, setNewBarberBio] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [savingBarber, setSavingBarber] = useState(false);

  // Fetch shop details on load
  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const res = await api.adminGetSettings(shopId);
        if (res.ok) {
          const d = res.data as { shop?: { name: string; slug: string } };
          if (d.shop) {
            setShopName(d.shop.name);
            setShopSlug(d.shop.slug);
          }
        }
      } catch (err) {
        console.error('Failed to load shop info', err);
      }
    };
    if (shopId) {
      fetchShopInfo();
    }
  }, [shopId]);

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
      if (res.ok) {
        const d = res.data as { todayBookings: number; monthRevenue: number; totalCustomers: number; activeBarbers: number; subscription: any };
        setStats(d);
        setSubscription(d.subscription);
      }
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

  // Silently check for new bookings in the background
  const pollDashboardSilently = useCallback(async (currentBookings: BookingItem[]) => {
    try {
      const bk = await api.adminBookings(shopId);
      if (bk.ok) {
        const freshBookings = (bk.data as { bookings: BookingItem[] }).bookings || [];
        
        // Find if there are any new bookings
        const existingIds = new Set(currentBookings.map(b => b._id));
        const newArrivals = freshBookings.filter(b => !existingIds.has(b._id) && b.status === 'confirmed');
        
        if (newArrivals.length > 0) {
          const newNames = newArrivals.map(b => `${b.customerName} (${b.serviceName})`);
          setNewBookingNotifications(prev => [...prev, ...newNames]);
          setBookings(freshBookings);
          
          const res = await api.adminDashboard(shopId);
          if (res.ok) {
            setStats(res.data as DashboardStats);
          }
        }
      }
    } catch (err) {
      console.error('Silent poll failed', err);
    }
  }, [shopId]);

  // Set up polling interval for real-time updates
  useEffect(() => {
    if (activeTab !== 'oversikt' && activeTab !== 'kalender') return;
    
    const interval = setInterval(() => {
      pollDashboardSilently(bookings);
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [activeTab, bookings, pollDashboardSilently]);

  useEffect(() => {
    if (activeTab === 'oversikt' || activeTab === 'kalender') loadDashboard();
    else if (activeTab === 'tjanster') loadServices();
    else if (activeTab === 'personal') { loadBarbers(); loadServices(); }
    else if (activeTab === 'kunder') loadCustomers();
    else if (activeTab === 'installningar') loadSettings();
  }, [activeTab, loadDashboard, loadServices, loadBarbers, loadCustomers, loadSettings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const res = await api.adminUpdateBookingStatus(shopId, bookingId, newStatus);
    if (res.ok) loadDashboard();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newServiceDuration === '' || newServicePrice === '') {
      setError('Tid och pris måste anges.');
      return;
    }
    setSavingService(true);
    const res = await api.adminCreateService(shopId, {
      name: newServiceName, description: newServiceDesc,
      durationMinutes: Number(newServiceDuration), price: Number(newServicePrice)
    });
    setSavingService(false);
    if (res.ok) {
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServiceDuration(30);
      setNewServicePrice(400);
      loadServices();
    }
  };

  const handleToggleService = async (serviceId: string) => {
    await api.adminToggleService(shopId, serviceId);
    loadServices();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await api.adminUpdateSettings(shopId, {
      cancellationWindowHours: cancellationHours === '' ? 0 : Number(cancellationHours),
      depositPercentage: depositPct === '' ? 0 : Number(depositPct)
    });
    setSavingSettings(false);
    alert('Inställningar sparade!');
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBarber(true);
    setError('');
    try {
      const res = await api.adminAddBarber(shopId, {
        firstName: newBarberFirstName,
        lastName: newBarberLastName,
        email: newBarberEmail,
        password: newBarberPassword,
        bio: newBarberBio,
        serviceIds: selectedServices
      });
      if (res.ok) {
        setNewBarberFirstName('');
        setNewBarberLastName('');
        setNewBarberEmail('');
        setNewBarberPassword('');
        setNewBarberBio('');
        setSelectedServices([]);
        loadBarbers();
      } else {
        const d = res.data as { error?: string };
        setError(d.error || 'Kunde inte lägga till personal.');
      }
    } catch {
      setError('Ett nätverksfel uppstod.');
    } finally {
      setSavingBarber(false);
    }
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
        <div className="sidebar-brand">
          💈 <span>{shopName || 'BokaBarber'}</span>
        </div>
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {newBookingNotifications.length > 0 && (
              <div
                className="admin-bell-badge"
                onClick={() => { setActiveTab('oversikt'); setNewBookingNotifications([]); }}
                title={`${newBookingNotifications.length} nya bokningar! Klicka för att rensa.`}
                style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', fontSize: '1.1rem', transition: 'all var(--transition-fast)' }}
              >
                🔔
                <span className="bell-red-dot"></span>
              </div>
            )}
            {shopSlug && (
              <a
                href={`/${shopSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--primary)', color: 'white', fontWeight: 600, textDecoration: 'none' }}
              >
                🌐 Visa bokningssida
              </a>
            )}
            <div className="admin-shop-badge">🔗 Salong-ID: {shopId.substring(0, 8)}...</div>
          </div>
        </header>

        <div className="admin-content-area" style={{ position: 'relative' }}>
          {newBookingNotifications.length > 0 && (
            <div className="toast-notification-container">
              {newBookingNotifications.map((notif, idx) => (
                <div key={idx} className="toast-notification animate-slide-in">
                  <div className="toast-content">
                    🔔 <strong>Ny bokning inkommen!</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {notif}
                    </p>
                  </div>
                  <button
                    onClick={() => setNewBookingNotifications(prev => prev.filter((_, i) => i !== idx))}
                    className="toast-close"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <div className="error-alert">⚠️ {error}</div>}
          {loading && <div className="loading-indicator">⏳ Laddar data från databasen...</div>}

          {/* Subscription Status Banners */}
          {!loading && subscription && (
            <div className="subscription-status-banner">
              {subscription.status === 'trial' && (() => {
                const diff = new Date(subscription.trialEndsAt).getTime() - Date.now();
                const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                if (days > 0) {
                  return (
                    <div className="alert-banner info-alert">
                      ℹ️ Du har <strong>{days}</strong> {days === 1 ? 'dag' : 'dagar'} kvar av din gratis provperiod.
                    </div>
                  );
                } else {
                  return (
                    <div className="alert-banner danger-alert">
                      ⚠️ Din provperiod har gått ut. Välj en plan för att aktivera bokningar.
                    </div>
                  );
                }
              })()}
              {subscription.status === 'suspended' && (
                <div className="alert-banner danger-alert">
                  ⚠️ Din salong är pausad. Uppdatera betalningen för att aktivera bokningar igen.
                </div>
              )}
              {subscription.status === 'cancelled' && (
                <div className="alert-banner danger-alert">
                  ⚠️ Salongens abonnemang är uppsagt. Välj en plan för att starta om.
                </div>
              )}
              {subscription.status === 'past_due' && (
                <div className="alert-banner warning-alert">
                  ⚠️ Betalningen misslyckades. Uppdatera betalningsmetod inom 7 dagar.
                </div>
              )}
            </div>
          )}

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
                  <form onSubmit={handleAddService} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group"><label className="form-label">Namn</label><input type="text" required value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="form-input" placeholder="t.ex. Maskinklippning" /></div>
                    <div className="form-group"><label className="form-label">Beskrivning</label><input type="text" value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} className="form-input" placeholder="Valfri beskrivning" /></div>
                    <div className="form-group"><label className="form-label">Tid (min)</label><input type="number" required value={newServiceDuration} onChange={e => { const val = e.target.value; setNewServiceDuration(val === '' ? '' : Number(val)); }} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Pris (kr)</label><input type="number" required value={newServicePrice} onChange={e => { const val = e.target.value; setNewServicePrice(val === '' ? '' : Number(val)); }} className="form-input" /></div>
                    <button type="submit" disabled={savingService} className="btn btn-primary" style={{ width: '100%' }}>{savingService ? 'Sparar...' : 'Spara tjänst'}</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* STAFF */}
          {activeTab === 'personal' && !loading && (
            <div className="tab-pane">
              <div className="two-col-layout">
                <div className="card-premium">
                  <h3>Frisörer & Personal ({barbers.length})</h3>
                  {barbers.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '16px' }}>Inga frisörer registrerade ännu. Lägg till din första frisör till höger →</div>
                  ) : (
                    <div className="grid-responsive" style={{ marginTop: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {barbers.map(b => (
                        <div key={b._id} className="card-premium" style={{ textAlign: 'center', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💈</div>
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

                <div className="card-premium">
                  <h3>Lägg till ny frisör / personal</h3>
                  <form onSubmit={handleAddBarber} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group"><label className="form-label">Förnamn</label><input type="text" required value={newBarberFirstName} onChange={e => setNewBarberFirstName(e.target.value)} className="form-input" placeholder="t.ex. Johan" /></div>
                    <div className="form-group"><label className="form-label">Efternamn</label><input type="text" required value={newBarberLastName} onChange={e => setNewBarberLastName(e.target.value)} className="form-input" placeholder="t.ex. Andersson" /></div>
                    <div className="form-group"><label className="form-label">E-postadress</label><input type="email" required value={newBarberEmail} onChange={e => setNewBarberEmail(e.target.value)} className="form-input" placeholder="johan@salong.se" /></div>
                    <div className="form-group"><label className="form-label">Lösenord</label><input type="password" required value={newBarberPassword} onChange={e => setNewBarberPassword(e.target.value)} className="form-input" placeholder="Minst 6 tecken" /></div>
                    <div className="form-group"><label className="form-label">Bio (kort beskrivning)</label><textarea value={newBarberBio} onChange={e => setNewBarberBio(e.target.value)} className="form-input" placeholder="Erfaren frisör specialiserad på herrklippning..." style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} /></div>
                    
                    <div className="form-group">
                      <label className="form-label">Tjänster som utförs</label>
                      {services.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Skapa först tjänster under fliken "Tjänster" för att kunna välja dem här.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                          {services.map(s => (
                            <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(s._id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedServices([...selectedServices, s._id]);
                                  } else {
                                    setSelectedServices(selectedServices.filter(id => id !== s._id));
                                  }
                                }}
                              />
                              {s.name} ({s.price} kr)
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={savingBarber} className="btn btn-primary" style={{ width: '100%' }}>{savingBarber ? 'Sparar...' : 'Spara personal'}</button>
                  </form>
                </div>
              </div>
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
                  <input type="number" value={cancellationHours} onChange={e => { const val = e.target.value; setCancellationHours(val === '' ? '' : Number(val)); }} className="form-input" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kunder kan inte avboka online senare än detta.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Deposition vid onlinebokning (%)</label>
                  <input type="number" value={depositPct} onChange={e => { const val = e.target.value; setDepositPct(val === '' ? '' : Number(val)); }} className="form-input" />
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
        .admin-sidebar { width: 260px; background-color: var(--secondary-hover); color: #94a3b8; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); flex-shrink: 0; min-height: calc(100vh - 160px); }
        .sidebar-brand { padding: 24px; font-family: var(--font-primary); font-size: 1.3rem; font-weight: 800; color: #f8fafc; border-bottom: 1px solid #1e293b; }
        .sidebar-brand span { color: var(--accent); }
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
        .alert-banner {
          padding: 14px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          margin-bottom: 24px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .info-alert {
          background-color: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }
        .warning-alert {
          background-color: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }
        .danger-alert {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        .form-group {
          margin-bottom: 0px !important;
          gap: 6px !important;
        }
        .toast-notification-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 360px;
          width: 100%;
        }
        .toast-notification {
          background-color: #ffffff;
          border: 1px solid var(--accent);
          border-left: 4px solid var(--accent);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: var(--shadow-lg);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .toast-content {
          flex: 1;
          text-align: left;
        }
        .toast-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          margin-top: -4px;
          transition: color var(--transition-fast);
        }
        .toast-close:hover {
          color: var(--color-danger);
        }
        .bell-red-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background-color: var(--color-danger);
          border-radius: 50%;
          border: 2px solid #ffffff;
          animation: pulse 1.5s infinite;
        }
        .admin-bell-badge:hover {
          transform: scale(1.05);
          background-color: var(--primary-light) !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

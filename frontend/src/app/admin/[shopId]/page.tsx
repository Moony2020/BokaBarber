'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/utils/api';
import './admin-dashboard.css';

interface DashboardStats {
  todayBookings: number; monthRevenue: number;
  totalCustomers: number; activeBarbers: number;
}
interface BookingItem {
  _id: string; customerName: string; serviceName: string; servicePrice: number;
  barberName: string; startTime: string; endTime: string; totalPrice: number;
  status: string; paymentStatus: string;
}
interface ServiceItem {
  _id: string; name: string; description?: string;
  durationMinutes: number; price: number; isActive: boolean;
}
interface BarberItem {
  _id: string; name: string; email: string; bio?: string;
  isActive: boolean; services: string[];
}
interface CustomerItem {
  _id: string; firstName: string; lastName: string;
  email: string; phoneNumber: string; bookingCount: number;
}
interface NotificationItem {
  _id: string; type: string; title: string; message: string;
  bookingId?: string; customerName?: string; serviceName?: string;
  barberName?: string; bookingDate?: string; bookingTime?: string;
  price?: number; read: boolean; createdAt: string;
}

export default function ShopAdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [activeTab, setActiveTab] = useState<'oversikt'|'kalender'|'tjanster'|'personal'|'kunder'|'installningar'>('oversikt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<'bas'|'pro'|null>(null);
  const [paypalLoading, setPaypalLoading] = useState<'bas'|'pro'|null>(null);

  const [stats, setStats] = useState<DashboardStats>({ todayBookings: 0, monthRevenue: 0, totalCustomers: 0, activeBarbers: 0 });
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDesc, setEditServiceDesc] = useState('');
  const [editServiceDuration, setEditServiceDuration] = useState(30);
  const [editServicePrice, setEditServicePrice] = useState(0);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState<number|''>(30);
  const [newServicePrice, setNewServicePrice] = useState<number|''>(400);
  const [savingService, setSavingService] = useState(false);

  const [cancellationHours, setCancellationHours] = useState<number|''>(24);
  const [depositPct, setDepositPct] = useState<number|''>(0);
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<('swish'|'card'|'cash')[]>(['swish','card']);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [savingSettings, setSavingSettings] = useState(false);

  const [toast, setToast] = useState<{message:string;type:'success'|'error'|'info'}|null>(null);
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [subscription, setSubscription] = useState<{status:string;trialEndsAt:string;gracePeriodEndsAt?:string}|null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const trialDaysLeft = useMemo(() => {
    if (subscription?.status !== 'trial') return 0;
    return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - new Date().getTime()) / 86400000));
  }, [subscription]);

  const [newBarberFirstName, setNewBarberFirstName] = useState('');
  const [newBarberLastName, setNewBarberLastName] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [newBarberBio, setNewBarberBio] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [savingBarber, setSavingBarber] = useState(false);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleCheckout = async (plan: 'bas'|'pro') => {
    setCheckoutLoading(plan);
    try {
      const res = await api.createCheckout(shopId, plan);
      if (res.ok) { const { url } = res.data as { url: string }; window.location.href = url; }
      else { const d = res.data as { error?: string }; showToast(d.error || 'Kunde inte starta betalning.', 'error'); }
    } catch { showToast('Nätverksfel. Kontrollera att servern körs.', 'error'); }
    finally { setCheckoutLoading(null); }
  };

  const handlePayPalCheckout = async (plan: 'bas'|'pro') => {
    setPaypalLoading(plan);
    try {
      const res = await api.createPayPalOrder(shopId, plan);
      if (res.ok) { const { approveUrl } = res.data as { approveUrl: string }; window.location.href = approveUrl; }
      else { const d = res.data as { error?: string }; showToast(d.error || 'Kunde inte starta PayPal-betalning.', 'error'); }
    } catch { showToast('Nätverksfel. Kontrollera att servern körs.', 'error'); }
    finally { setPaypalLoading(null); }
  };



  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const res = await api.adminGetSettings(shopId);
        if (res.ok) {
          const d = res.data as { shop?: { name: string; slug: string } };
          if (d.shop) { setShopName(d.shop.name); setShopSlug(d.shop.slug); }
        }
      } catch {}
    };
    if (shopId) fetchShopInfo();
  }, [shopId]);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await api.me();
        if (res.ok) {
          const data = res.data as { user: { role: string; shopId?: string } };
          if (data.user.role !== 'shop_admin' && data.user.role !== 'super_admin') setAuthError('Din användare har inte behörighet att komma åt instrumentpanelen.');
          else setAuthError('');
        } else if (res.status === 401) setAuthError('Din session har gått ut. Vänligen logga in igen.');
        else setAuthError('Kunde inte verifiera behörighet. Kontrollera att servern är igång.');
      } catch { setAuthError('Nätverksfel — kontrollera att servern körs på localhost:5000.'); }
    };

    const fetchNotifications = async () => {
      if (!shopId) return;
      try {
        const res = await api.adminNotifications(shopId);
        if (res.ok) {
          const data = res.data as { notifications: NotificationItem[] };
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    verifyAuth();
    fetchNotifications();

    const authInterval = setInterval(verifyAuth, 60000);
    const notifInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => {
      clearInterval(authInterval);
      clearInterval(notifInterval);
    };
  }, [shopId]);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.adminDashboard(shopId);
      if (res.ok) { const d = res.data as DashboardStats & { subscription: typeof subscription }; setStats(d); setSubscription(d.subscription); }
      const bk = await api.adminBookings(shopId);
      if (bk.ok) setBookings((bk.data as { bookings: BookingItem[] }).bookings || []);
    } catch { setError('Kunde inte hämta data från servern.'); }
    finally { setLoading(false); }
  }, [shopId]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const payment = p.get('payment'), sessionId = p.get('session_id');
    const paypal = p.get('paypal'), orderId = p.get('token');
    const plan = (p.get('plan') || 'bas') as 'bas'|'pro';
    if (payment === 'success' && sessionId) {
      api.verifyStripeSession(shopId, sessionId).then(res => {
        if (res.ok) { showToast('Betalning genomförd! Ditt abonnemang är nu aktivt.', 'success'); router.replace(`/admin/${shopId}`); loadDashboard(); }
        else showToast('Betalning mottagen men kunde inte aktiveras. Kontakta support.', 'error');
      });
    } else if (payment === 'cancelled') {
      Promise.resolve().then(() => showToast('Betalningen avbröts. Välj en plan för att fortsätta.', 'error'));
      router.replace(`/admin/${shopId}`);
    } else if (paypal === 'success' && orderId) {
      api.capturePayPalOrder(shopId, orderId, plan).then(res => {
        if (res.ok) { showToast('PayPal-betalning genomförd! Ditt abonnemang är nu aktivt.', 'success'); router.replace(`/admin/${shopId}`); loadDashboard(); }
        else showToast('Betalning mottagen men kunde inte aktiveras. Kontakta support.', 'error');
      });
    } else if (paypal === 'cancelled') {
      Promise.resolve().then(() => showToast('PayPal-betalningen avbröts. Välj en plan för att fortsätta.', 'error'));
      router.replace(`/admin/${shopId}`);
    }
  }, [shopId, router, loadDashboard]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try { const res = await api.adminServices(shopId); if (res.ok) setServices((res.data as { services: ServiceItem[] }).services || []); }
    catch { setError('Kunde inte hämta tjänster.'); } finally { setLoading(false); }
  }, [shopId]);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    try { const res = await api.adminBarbers(shopId); if (res.ok) setBarbers((res.data as { barbers: BarberItem[] }).barbers || []); }
    catch { setError('Kunde inte hämta frisörer.'); } finally { setLoading(false); }
  }, [shopId]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try { const res = await api.adminCustomers(shopId); if (res.ok) setCustomers((res.data as { customers: CustomerItem[] }).customers || []); }
    catch { setError('Kunde inte hämta kunder.'); } finally { setLoading(false); }
  }, [shopId]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSettings(shopId);
      if (res.ok) {
        const d = res.data as { settings: { cancellationWindowHours: number; depositPercentage: number; acceptedPaymentMethods?: ('swish'|'card'|'cash')[]; openingHours: { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[] } };
        if (d.settings) {
          setCancellationHours(d.settings.cancellationWindowHours);
          setDepositPct(d.settings.depositPercentage);
          if (d.settings.acceptedPaymentMethods) setAcceptedPaymentMethods(d.settings.acceptedPaymentMethods);
          const mon = d.settings.openingHours?.find(h => h.dayOfWeek === 1);
          if (mon) { setOpenTime(mon.openTime); setCloseTime(mon.closeTime); }
        }
      }
    } catch { setError('Kunde inte hämta inställningar.'); } finally { setLoading(false); }
  }, [shopId]);

  const pollDashboardSilently = useCallback(async (currentBookings: BookingItem[]) => {
    try {
      const bk = await api.adminBookings(shopId);
      if (bk.ok) {
        const fresh = (bk.data as { bookings: BookingItem[] }).bookings || [];
        const existingIds = new Set(currentBookings.map(b => b._id));
        const newArrivals = fresh.filter(b => !existingIds.has(b._id) && b.status === 'confirmed');
        if (newArrivals.length > 0) {
          setBookings(fresh);
          const r = await api.adminDashboard(shopId);
          if (r.ok) setStats(r.data as DashboardStats);
        }
      }
    } catch {}
  }, [shopId]);

  useEffect(() => {
    if (activeTab !== 'oversikt' && activeTab !== 'kalender') return;
    const interval = setInterval(() => pollDashboardSilently(bookings), 10000);
    return () => clearInterval(interval);
  }, [activeTab, bookings, pollDashboardSilently]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (activeTab === 'oversikt' || activeTab === 'kalender') loadDashboard();
      else if (activeTab === 'tjanster') loadServices();
      else if (activeTab === 'personal') { loadBarbers(); loadServices(); }
      else if (activeTab === 'kunder') loadCustomers();
      else if (activeTab === 'installningar') loadSettings();
    });
  }, [activeTab, loadDashboard, loadServices, loadBarbers, loadCustomers, loadSettings]);

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      const res = await api.adminMarkNotificationRead(shopId, notifId);
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await api.adminMarkAllNotificationsRead(shopId);
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setShowNotificationsDropdown(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    await api.adminUpdateBookingStatus(shopId, bookingId, newStatus);
    loadDashboard();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newServiceDuration === '' || newServicePrice === '') { setError('Tid och pris måste anges.'); return; }
    setSavingService(true);
    const res = await api.adminCreateService(shopId, { name: newServiceName, description: newServiceDesc, durationMinutes: Number(newServiceDuration), price: Number(newServicePrice) });
    setSavingService(false);
    if (res.ok) { setNewServiceName(''); setNewServiceDesc(''); setNewServiceDuration(30); setNewServicePrice(400); showToast('Tjänst skapad!', 'success'); loadServices(); }
    else showToast('Kunde inte spara tjänsten.', 'error');
  };

  const handleToggleService = async (serviceId: string) => { await api.adminToggleService(shopId, serviceId); loadServices(); };

  const startEditService = (s: ServiceItem) => {
    setEditingServiceId(s._id);
    setEditServiceName(s.name);
    setEditServiceDesc(s.description || '');
    setEditServiceDuration(s.durationMinutes);
    setEditServicePrice(s.price);
  };

  const handleSaveEditService = async () => {
    if (!editingServiceId) return;
    const res = await api.adminUpdateService(shopId, editingServiceId, { name: editServiceName, description: editServiceDesc, durationMinutes: editServiceDuration, price: editServicePrice });
    if (res.ok) { showToast('Tjänst uppdaterad!', 'success'); setEditingServiceId(null); loadServices(); }
    else showToast('Kunde inte spara.', 'error');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await api.adminUpdateSettings(shopId, { cancellationWindowHours: cancellationHours === '' ? 0 : Number(cancellationHours), depositPercentage: depositPct === '' ? 0 : Number(depositPct), acceptedPaymentMethods });
    setSavingSettings(false);
    showToast('Inställningar sparade!', 'success');
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingBarber(true); setError('');
    try {
      const res = await api.adminAddBarber(shopId, { firstName: newBarberFirstName, lastName: newBarberLastName, email: newBarberEmail, password: newBarberPassword, bio: newBarberBio, serviceIds: selectedServices });
      if (res.ok) { setNewBarberFirstName(''); setNewBarberLastName(''); setNewBarberEmail(''); setNewBarberPassword(''); setNewBarberBio(''); setSelectedServices([]); showToast('Personal tillagd!', 'success'); loadBarbers(); }
      else { const d = res.data as { error?: string }; showToast(d.error || 'Kunde inte lägga till personal.', 'error'); }
    } catch { showToast('Ett nätverksfel uppstod.', 'error'); } finally { setSavingBarber(false); }
  };

  const formatTime = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const statusLabel = (s: string) => ({ confirmed:'Bekräftad', paid:'Betald', completed:'Slutförd', cancelled_by_customer:'Avbokad', cancelled_by_shop:'Avbokad', no_show:'Utebliven', pending:'Väntande', rescheduled:'Ombokad' }[s] || s);
  const badgeClass = (s: string) => { if (s==='confirmed') return 'bb-badge-confirmed'; if (s==='paid') return 'bb-badge-paid'; if (s==='completed') return 'bb-badge-completed'; if (s==='pending') return 'bb-badge-pending'; return 'bb-badge-cancelled'; };
  const getInitials = (name: string) => name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  // ── Early returns ──────────────────────────────────────────
  if (authError) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fbf9f9', padding:24 }}>
        <div style={{ background:'white', borderRadius:16, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 20px 50px rgba(119,90,25,0.08)', border:'1px solid #d1c5b4' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:16 }}>🔐</div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.8rem', color:'#775a19', marginBottom:12 }}>Åtkomst nekad</h2>
          <p style={{ color:'#4e4639', lineHeight:1.6, marginBottom:28 }}>{authError}</p>
          <Link href="/login" style={{ display:'inline-block', background:'#c5a059', color:'white', fontWeight:700, padding:'14px 32px', borderRadius:8, textDecoration:'none' }}>Logga in →</Link>
        </div>
      </div>
    );
  }

  if (loading && !subscription) {
    return (
      <div style={{ minHeight:'50vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="bb-spinner" />
      </div>
    );
  }

  const isPaywallActive = !loading && subscription && (
    subscription.status === 'suspended' || subscription.status === 'cancelled' ||
    (subscription.status === 'trial' && new Date(subscription.trialEndsAt) < new Date())
  );

  if (isPaywallActive) {
    return (
      <div style={{ minHeight:'60vh', background:'#fbf9f9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'48px 24px 80px' }}>
        {toast && (
          <div className="bb-toasts">
            <div className={`bb-toast bb-toast-${toast.type}`}>
              <div className="bb-toast-body">
                <span>{toast.type==='success'?'✅':'❌'}</span>
                <strong>{toast.message}</strong>
              </div>
              <button onClick={()=>setToast(null)} className="bb-toast-close">×</button>
            </div>
          </div>
        )}
        <div style={{ width:'100%', maxWidth:660 }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:'3rem', marginBottom:16 }}>⏰</div>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'2rem', color:'#775a19', marginBottom:10 }}>
              {subscription!.status==='cancelled' ? 'Abonnemang uppsagt' : 'Din provperiod har gått ut'}
            </h2>
            <p style={{ color:'#4e4639', fontSize:'1rem', lineHeight:1.6 }}>
              Välj en plan nedan för att aktivera din salong.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24 }}>
            {/* BAS */}
            <div style={{ background:'#fff', border:'1.5px solid #B59F67', borderRadius:16, padding:'28px 24px 24px', display:'flex', flexDirection:'column', boxShadow:'0 10px 30px rgba(197,160,89,0.08)' }}>
              <span style={{ alignSelf:'flex-start', padding:'4px 12px', borderRadius:9999, background:'rgba(197,160,89,0.1)', color:'#775a19', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.08em', marginBottom:16 }}>BAS</span>
              <div style={{ fontSize:'2.8rem', fontWeight:700, color:'#775a19', lineHeight:1, marginBottom:16 }}>299 kr<span style={{ fontSize:'1rem', color:'#7f7667', fontWeight:400, marginLeft:4 }}>/mån</span></div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px', display:'flex', flexDirection:'column', gap:8, flexGrow:1 }}>
                {['Upp till 2 anställda','Digital kalender','SMS-påminnelser'].map(f=>(
                  <li key={f} style={{ display:'flex', gap:8, color:'#4e4639', fontSize:'0.9rem' }}><span style={{ color:'#c5a059', fontWeight:700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <button onClick={()=>handleCheckout('bas')} disabled={checkoutLoading!==null||paypalLoading!==null} style={{ width:'100%', padding:'12px', background:'transparent', border:'1.5px solid #c5a059', color:'#775a19', borderRadius:8, fontWeight:700, fontSize:'0.9rem', cursor:'pointer', marginBottom:8 }}>
                {checkoutLoading==='bas'?'Laddar...':'💳 Betala med kort'}
              </button>
              <button onClick={()=>handlePayPalCheckout('bas')} disabled={checkoutLoading!==null||paypalLoading!==null} style={{ width:'100%', padding:'12px', background:'#FFC439', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                {paypalLoading==='bas'?'Laddar...':<><span style={{ fontFamily:'Arial,sans-serif', fontWeight:800, color:'#003087' }}>Pay</span><span style={{ fontFamily:'Arial,sans-serif', fontWeight:800, color:'#009cde' }}>Pal</span></>}
              </button>
            </div>
            {/* PRO */}
            <div style={{ background:'#fff', border:'2px solid #B59F67', borderRadius:16, padding:'28px 24px 24px', display:'flex', flexDirection:'column', position:'relative', boxShadow:'0 20px 40px rgba(119,90,25,0.1)' }}>
              <div style={{ position:'absolute', top:-13, right:24, background:'linear-gradient(135deg,#dfba6b,#B59F67)', color:'#fff', fontSize:'0.6rem', fontWeight:700, padding:'4px 14px', borderRadius:9999, letterSpacing:1 }}>REKOMMENDERAD</div>
              <span style={{ alignSelf:'flex-start', padding:'4px 12px', borderRadius:9999, background:'rgba(233,193,118,0.16)', color:'#775a19', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.08em', marginBottom:16 }}>PROFESSIONAL</span>
              <div style={{ fontSize:'2.8rem', fontWeight:700, background:'linear-gradient(135deg,#d4af37,#775a19)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', lineHeight:1, marginBottom:16 }}>
                399 kr<span style={{ fontSize:'1rem', fontWeight:400, WebkitTextFillColor:'#7f7667', color:'#7f7667', marginLeft:4 }}>/mån</span>
              </div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px', display:'flex', flexDirection:'column', gap:8, flexGrow:1 }}>
                {['Obegränsat antal anställda','Allt i Bas-planen','Avancerad lagerhantering','Ekonomisk rapportering','Prioriterad support 24/7'].map((f,i)=>(
                  <li key={i} style={{ display:'flex', gap:8, color:'#4e4639', fontSize:'0.9rem' }}><span style={{ color:'#775a19', fontWeight:700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <button onClick={()=>handleCheckout('pro')} disabled={checkoutLoading!==null||paypalLoading!==null} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#c5a059,#775a19)', border:'none', color:'white', borderRadius:8, fontWeight:700, fontSize:'0.9rem', cursor:'pointer', marginBottom:8 }}>
                {checkoutLoading==='pro'?'Laddar...':'💳 Betala med kort'}
              </button>
              <button onClick={()=>handlePayPalCheckout('pro')} disabled={checkoutLoading!==null||paypalLoading!==null} style={{ width:'100%', padding:'12px', background:'#FFC439', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                {paypalLoading==='pro'?'Laddar...':<><span style={{ fontFamily:'Arial,sans-serif', fontWeight:800, color:'#003087' }}>Pay</span><span style={{ fontFamily:'Arial,sans-serif', fontWeight:800, color:'#009cde' }}>Pal</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main admin layout ──────────────────────────────────────
  const today = new Date().toLocaleDateString('sv-SE', { day:'numeric', month:'long', year:'numeric' });
  const navItems = [
    { key:'oversikt', icon:'dashboard', label:'Översikt' },
    { key:'kalender', icon:'calendar_today', label:'Bokningar' },
    { key:'tjanster', icon:'content_cut', label:'Tjänster' },
    { key:'personal', icon:'group', label:'Personal' },
    { key:'kunder', icon:'person', label:'Kunder' },
    { key:'installningar', icon:'settings', label:'Inställningar' },
  ];

  return (
    <>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
      `}</style>

      {/* Toasts */}
      {toast && (
        <div className="bb-toasts">
          <div className={`bb-toast bb-toast-${toast.type}`}>
            <div className="bb-toast-body">
              <span>{toast.type==='success'?'✅':toast.type==='error'?'❌':'ℹ️'}</span>
              <strong style={{color:'#1b1c1c',fontSize:14}}>{toast.message}</strong>
            </div>
            <button onClick={()=>setToast(null)} className="bb-toast-close">×</button>
          </div>
        </div>
      )}

      <div className="bb-wrap">
        {/* ── Sidebar ── */}
        <aside className="bb-sidebar">
          <div className="bb-sidebar-top">
            <div className="bb-salon-logo">💈</div>
            <div>
              <div className="bb-salon-name">{shopName || 'Salong'}</div>
              <div className="bb-salon-role">Salon Admin</div>
            </div>
          </div>

          <nav className="bb-nav">
            {navItems.map(item=>(
              <button key={item.key} onClick={()=>setActiveTab(item.key as typeof activeTab)} className={`bb-nav-btn${activeTab===item.key?' bb-nav-active':''}`}>
                {activeTab===item.key && <span className="bb-active-bar" />}
                <span className="bb-mat-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="bb-sidebar-bottom">
            {shopSlug && (
              <a href={`/${shopSlug}`} target="_blank" rel="noopener noreferrer" className="bb-view-btn">
                <span className="bb-mat-icon" style={{fontSize:18}}>public</span> Visa bokningssida
              </a>
            )}
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="bb-main-wrap">
          <main className="bb-main">
            {/* Page header */}
            <div className="bb-page-head">
              <div>
                <h1 className="bb-page-title">
                  {activeTab==='oversikt'?'Översikt':activeTab==='kalender'?'Bokningar':activeTab==='tjanster'?'Tjänster':activeTab==='personal'?'Personal':activeTab==='kunder'?'Kunder':'Inställningar'}
                </h1>
                <p className="bb-page-sub">
                  {activeTab==='oversikt'&&`Välkommen tillbaka till ${shopName}.`}
                  {activeTab==='kalender'&&'Hantera ditt fullständiga bokningsschema.'}
                  {activeTab==='tjanster'&&'Hantera dina tjänster och priser.'}
                  {activeTab==='personal'&&`Hantera dina frisörer och deras tjänster för ${shopName}.`}
                  {activeTab==='kunder'&&'Hantera och överskådliggör din lojala kundbas.'}
                  {activeTab==='installningar'&&'Konfigurera salongens globala inställningar. Ändringar sparas direkt.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)} style={{ background:'transparent', border:'none', fontSize:'24px', cursor:'pointer', position:'relative', padding:0 }}>
                    🔔
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span style={{ position:'absolute', top:-4, right:-4, background:'#e74c3c', color:'white', fontSize:'10px', fontWeight:'bold', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                  {showNotificationsDropdown && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '320px', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
                        <strong style={{ fontSize: '14px', color: '#333' }}>Aviseringar</strong>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button onClick={handleMarkAllNotificationsRead} style={{ background: 'transparent', border: 'none', color: '#c5a059', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Markera alla som lästa</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#777', fontSize: '13px' }}>Inga nya aviseringar</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} onClick={() => !n.read && handleMarkNotificationRead(n._id)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: n.read ? 'default' : 'pointer', background: n.read ? 'white' : '#fdf9f1' }}>
                            <div style={{ fontSize: '13px', fontWeight: n.read ? 'normal' : 'bold', color: '#333', marginBottom: '4px' }}>{n.title}</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>
                              {n.customerName} {n.type === 'new_booking' ? 'har bokat' : ''} {n.serviceName} hos {n.barberName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{n.bookingDate} kl {n.bookingTime}</span>
                              <span style={{ fontWeight: 'bold', color: '#775a19' }}>{n.price} kr</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {activeTab==='oversikt' && (
                  <div className="bb-date-chip">
                    <span className="bb-mat-icon" style={{color:'#775a19',fontSize:20}}>event</span>
                    <span>{today}</span>
                  </div>
                )}
                {activeTab==='tjanster' && (
                  <span className="bb-live-badge" style={{alignSelf:'flex-end'}}>Live Nu</span>
                )}
              </div>
            </div>

            {/* Banners */}
            {subscription?.status==='trial' && new Date(subscription.trialEndsAt)>=new Date() && (
              <div className="bb-trial-banner">ℹ️ Du har <strong>{trialDaysLeft}</strong> {trialDaysLeft===1?'dag':'dagar'} kvar av din gratis provperiod.</div>
            )}
            {subscription?.status==='past_due' && <div className="bb-warn-banner">⚠️ Betalningen misslyckades. Uppdatera din betalningsmetod.</div>}
            {error && <div className="bb-error-banner">⚠️ {error}</div>}

            {loading && <div className="bb-loading"><div className="bb-spinner" /></div>}

            {/* ── ÖVERSIKT ── */}
            {activeTab==='oversikt' && !loading && (
              <div className="bb-tab">
                <div className="bb-kpi-grid">
                  {[
                    { label:'DAGENS BOKNINGAR', value:stats.todayBookings, unit:`Bokning${stats.todayBookings!==1?'ar':''}`, bar:Math.min(100,stats.todayBookings*10) },
                    { label:'INTÄKTER DENNA MÅNAD', value:stats.monthRevenue.toLocaleString('sv-SE'), unit:'kr', bar:0 },
                    { label:'REGISTRERADE KUNDER', value:stats.totalCustomers, unit:`Person${stats.totalCustomers!==1?'er':''}`, bar:Math.min(100,stats.totalCustomers*20) },
                    { label:'AKTIVA FRISÖRER', value:stats.activeBarbers, unit:'Personal', bar:null },
                  ].map((k,i)=>(
                    <div key={i} className="bb-kpi">
                      <div className="bb-dot-grid" style={{position:'absolute',top:8,right:8,width:60,height:60}} />
                      <p className="bb-kpi-label">{k.label}</p>
                      <div className="bb-kpi-val-row">
                        <span className="bb-kpi-num">{k.value}</span>
                        <span className="bb-kpi-unit">{k.unit}</span>
                      </div>
                      {k.bar !== null ? (
                        <div className="bb-kpi-bar"><div className="bb-kpi-fill" style={{width:`${k.bar}%`}} /></div>
                      ) : (
                        <div className="bb-online"><span className="bb-online-dot" />Online nu</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bb-card">
                  <div className="bb-card-head">
                    <h3 className="bb-card-title">Senaste bokningar</h3>
                    <button className="bb-link-btn" onClick={()=>setActiveTab('kalender')}>
                      Visa alla <span className="bb-mat-icon" style={{fontSize:16,verticalAlign:'middle'}}>arrow_forward</span>
                    </button>
                  </div>
                  {bookings.length===0 ? (
                    <div className="bb-empty">📭 Inga bokningar hittades ännu.</div>
                  ) : (
                    <div className="bb-table-wrap">
                      <table className="bb-table">
                        <thead><tr><th>KUND</th><th>TJÄNST</th><th>FRISÖR</th><th>TID</th><th style={{textAlign:'right'}}>PRIS</th><th style={{textAlign:'center'}}>STATUS</th><th>ÅTGÄRD</th></tr></thead>
                        <tbody>
                          {bookings.slice(0,10).map(b=>(
                            <tr key={b._id}>
                              <td><strong style={{whiteSpace:'nowrap'}}>{b.customerName}</strong></td>
                              <td className="bb-td-gold" style={{whiteSpace:'nowrap'}}>{b.serviceName}</td>
                              <td style={{whiteSpace:'nowrap'}}>{b.barberName}</td>
                              <td style={{whiteSpace:'nowrap'}}>Kl. {formatTime(b.startTime)}</td>
                              <td style={{textAlign:'right',fontWeight:600}}>{b.totalPrice} kr</td>
                              <td style={{textAlign:'center'}}><span className={`bb-badge ${badgeClass(b.status)}`}>{statusLabel(b.status)}</span></td>
                              <td>
                                <div style={{display:'flex',gap:6}}>
                                  {b.status==='confirmed' && <button onClick={()=>handleUpdateStatus(b._id,'completed')} className="bb-act-gold">Slutförd</button>}
                                  {(b.status==='confirmed'||b.status==='paid') && <button onClick={()=>handleUpdateStatus(b._id,'no_show')} className="bb-act-dark">Utebliven</button>}
                                  {(b.status==='completed'||b.status==='no_show') && <span style={{fontSize:12,color:'#7f7667',fontStyle:'italic'}}>Hanterad</span>}
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

            {/* ── BOKNINGAR ── */}
            {activeTab==='kalender' && !loading && (
              <div className="bb-card">
                <div className="bb-card-head">
                  <h3 className="bb-card-title">Alla bokningar <span className="bb-count-label">({bookings.length} totalt)</span></h3>
                </div>
                {bookings.length===0 ? (
                  <div className="bb-empty">📭 Inga bokningar registrerade ännu.</div>
                ) : (
                  <>
                    <div className="bb-table-wrap">
                      <table className="bb-table">
                        <thead><tr><th>DATUM</th><th>TID</th><th>KUND</th><th>TJÄNST</th><th>FRISÖR</th><th style={{textAlign:'right'}}>PRIS</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                        <tbody>
                          {bookings.map(b=>(
                            <tr key={b._id}>
                              <td style={{whiteSpace:'nowrap'}}>{new Date(b.startTime).toLocaleDateString('sv-SE')}</td>
                              <td style={{whiteSpace:'nowrap'}}>{formatTime(b.startTime)}–{formatTime(b.endTime)}</td>
                              <td><strong style={{whiteSpace:'nowrap'}}>{b.customerName}</strong></td>
                              <td className="bb-td-gold" style={{whiteSpace:'nowrap'}}>{b.serviceName}</td>
                              <td style={{whiteSpace:'nowrap'}}>{b.barberName}</td>
                              <td style={{textAlign:'right',fontWeight:600}}>{b.totalPrice} kr</td>
                              <td style={{textAlign:'center'}}><span className={`bb-badge ${badgeClass(b.status)}`}>{statusLabel(b.status)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bb-table-foot">
                      <span>Visar {bookings.length} av {bookings.length} bokningar</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TJÄNSTER ── */}
            {activeTab==='tjanster' && !loading && (
              <div className="bb-two-col">
                <div className="bb-card">
                  <div className="bb-card-head" style={{marginBottom:20}}>
                    <h3 className="bb-card-title">Aktiva tjänster ({services.filter(s=>s.isActive).length})</h3>
                  </div>
                  {services.length===0 ? (
                    <div className="bb-empty">Inga tjänster skapade ännu. Lägg till din första tjänst →</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {services.map(s=>(
                        <div key={s._id} className={`bb-svc-card${!s.isActive?' bb-dim':''}`} style={{flexDirection:'column',gap:12}}>
                          {editingServiceId === s._id ? (
                            <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
                              <input value={editServiceName} onChange={e=>setEditServiceName(e.target.value)} className="bb-input" placeholder="Namn" />
                              <input value={editServiceDesc} onChange={e=>setEditServiceDesc(e.target.value)} className="bb-input" placeholder="Beskrivning (valfri)" />
                              <div style={{display:'flex',gap:8}}>
                                <input type="number" value={editServiceDuration} onChange={e=>setEditServiceDuration(Number(e.target.value))} className="bb-input" placeholder="Min" style={{flex:1}} />
                                <input type="number" value={editServicePrice} onChange={e=>setEditServicePrice(Number(e.target.value))} className="bb-input" placeholder="Kr" style={{flex:1}} />
                              </div>
                              <div style={{display:'flex',gap:8}}>
                                <button onClick={handleSaveEditService} className="bb-btn-gold-sm" style={{flex:1}}>Spara</button>
                                <button onClick={()=>setEditingServiceId(null)} className="bb-btn-outline" style={{flex:1}}>Avbryt</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{display:'flex',alignItems:'flex-start',gap:12,width:'100%'}}>
                              <div style={{flex:1,minWidth:0}}>
                                <h4 className="bb-svc-name">{s.name}</h4>
                                {s.description && <p className="bb-svc-desc">{s.description}</p>}
                                <div className="bb-svc-meta">
                                  <span className="bb-svc-meta-item">
                                    <span className="bb-mat-icon" style={{fontSize:17,color:'#775a19'}}>schedule</span>
                                    {s.durationMinutes} min
                                  </span>
                                  <span className="bb-svc-meta-item">
                                    <span className="bb-mat-icon" style={{fontSize:17,color:'#775a19'}}>payments</span>
                                    {s.price} kr
                                  </span>
                                </div>
                              </div>
                              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                <button onClick={()=>startEditService(s)} className="bb-btn-outline" style={{fontSize:'0.72rem',padding:'6px 12px'}}>Redigera</button>
                                <button onClick={()=>handleToggleService(s._id)} className={s.isActive?'bb-btn-outline':'bb-btn-gold-sm'} style={{fontSize:'0.72rem',padding:'6px 12px'}}>
                                  {s.isActive?'Inaktivera':'Aktivera'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{position:'relative'}}>
                  <div className="bb-card bb-form-sticky">
                    <h3 className="bb-card-title" style={{marginBottom:24}}>Lägg till ny tjänst</h3>
                    <form onSubmit={handleAddService} className="bb-form">
                      <div className="bb-fg"><label className="bb-fg-label">Namn</label><input type="text" required value={newServiceName} onChange={e=>setNewServiceName(e.target.value)} placeholder="t.ex. Maskinklippning" /></div>
                      <div className="bb-fg"><label className="bb-fg-label">Beskrivning</label><textarea value={newServiceDesc} onChange={e=>setNewServiceDesc(e.target.value)} placeholder="Valfri beskrivning" rows={3} /></div>
                      <div className="bb-svc-grid">
                        <div className="bb-fg"><label className="bb-fg-label">Tid (min)</label><input type="number" required value={newServiceDuration} onChange={e=>{const v=e.target.value;setNewServiceDuration(v===''?'':Number(v));}} /></div>
                        <div className="bb-fg"><label className="bb-fg-label">Pris (kr)</label><input type="number" required value={newServicePrice} onChange={e=>{const v=e.target.value;setNewServicePrice(v===''?'':Number(v));}} /></div>
                      </div>
                      <div style={{paddingTop:4}}>
                        <button type="submit" disabled={savingService} className="bb-btn-primary-full">
                          {savingService?'Sparar...':'Spara tjänst'}
                        </button>
                      </div>
                    </form>
                    <div className="bb-dot-grid" style={{position:'absolute',bottom:12,right:12,width:40,height:40,opacity:0.2}} />
                  </div>
                </div>
              </div>
            )}

            {/* ── PERSONAL ── */}
            {activeTab==='personal' && !loading && (
              <div className="bb-personal-col">
                {/* Left: staff grid */}
                <div>
                  <div className="bb-staff-grid">
                    {barbers.map(b=>{
                      const initials = getInitials(b.name);
                      return (
                        <div key={b._id} className="bb-staff-card">
                          <div className="bb-staff-avatar">{initials}</div>
                          <h3 className="bb-staff-name">{b.name}</h3>
                          <p className="bb-staff-role">Frisör</p>
                          <div className="bb-staff-email">
                            <span className="bb-mat-icon" style={{fontSize:15,color:'#775a19'}}>mail</span>
                            {b.email}
                          </div>
                          {b.bio && <p className="bb-staff-bio">&ldquo;{b.bio}&rdquo;</p>}
                          {b.services.length > 0 && (
                            <div className="bb-staff-tags">
                              {b.services.slice(0,4).map(s=><span key={s} className="bb-staff-tag">{s}</span>)}
                            </div>
                          )}
                          <div className="bb-staff-footer">
                            {b.isActive ? (
                              <span className="bb-staff-status-active">
                                <span className="bb-staff-dot-active" /> Tillgänglig
                              </span>
                            ) : (
                              <span className="bb-staff-status-inactive">
                                <span className="bb-staff-dot-inactive" /> Inaktiv
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: add form (sticky) */}
                <div>
                  <div className="bb-card bb-form-sticky">
                    <div style={{position:'absolute',top:0,left:24,width:40,height:3,background:'#775a19',borderRadius:2}} />
                    <h3 className="bb-card-title" style={{marginBottom:24}}>Lägg till ny frisör</h3>
                    <form onSubmit={handleAddBarber} className="bb-form">
                      <div className="bb-svc-grid">
                        <div className="bb-fg"><label className="bb-fg-label">Förnamn</label><input id="barber-form-name" type="text" required value={newBarberFirstName} onChange={e=>setNewBarberFirstName(e.target.value)} placeholder="Johan" /></div>
                        <div className="bb-fg"><label className="bb-fg-label">Efternamn</label><input type="text" required value={newBarberLastName} onChange={e=>setNewBarberLastName(e.target.value)} placeholder="Andersson" /></div>
                      </div>
                      <div className="bb-fg"><label className="bb-fg-label">E-postadress</label><input type="email" required value={newBarberEmail} onChange={e=>setNewBarberEmail(e.target.value)} placeholder="johan@salong.se" /></div>
                      <div className="bb-fg"><label className="bb-fg-label">Lösenord</label><input type="password" required value={newBarberPassword} onChange={e=>setNewBarberPassword(e.target.value)} placeholder="Minst 6 tecken" /></div>
                      <div className="bb-fg"><label className="bb-fg-label">Bio (kort beskrivning)</label><textarea value={newBarberBio} onChange={e=>setNewBarberBio(e.target.value)} placeholder="Beskriv frisörens expertis..." rows={3} /></div>
                      {services.length > 0 && (
                        <div className="bb-fg">
                          <label className="bb-fg-label">Tjänster som utförs</label>
                          <div className="bb-chk-grid">
                            {services.map(s=>(
                              <label key={s._id} className="bb-chk-grid-item">
                                <input type="checkbox" checked={selectedServices.includes(s._id)} onChange={e=>{
                                  if(e.target.checked) setSelectedServices([...selectedServices,s._id]);
                                  else setSelectedServices(selectedServices.filter(id=>id!==s._id));
                                }} />
                                <span style={{fontSize:13}}>{s.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <button type="submit" disabled={savingBarber} className="bb-btn-primary-full">
                        {savingBarber?'Sparar...':'SPARA NY PERSONAL'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ── KUNDER ── */}
            {activeTab==='kunder' && !loading && (
              <div className="bb-card">
                <div className="bb-card-head">
                  <h3 className="bb-card-title">Kundregister <span className="bb-count-label">({customers.length} kunder)</span></h3>
                </div>
                {customers.length===0 ? (
                  <div className="bb-empty">📭 Inga kunder registrerade ännu. Kunder skapas automatiskt vid bokning.</div>
                ) : (
                  <>
                    <div className="bb-table-wrap">
                      <table className="bb-table">
                        <thead>
                          <tr><th>NAMN</th><th>E-POST</th><th>TELEFON</th><th style={{textAlign:'center'}}>BOKNINGAR</th></tr>
                        </thead>
                        <tbody>
                          {customers.map(c=>(
                            <tr key={c._id} className="bb-customer-row">
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:12,whiteSpace:'nowrap'}}>
                                  <span className="bb-avatar">{getInitials(`${c.firstName} ${c.lastName}`)}</span>
                                  <strong style={{color:'#1b1c1c',whiteSpace:'nowrap'}}>{c.firstName} {c.lastName}</strong>
                                </div>
                              </td>
                              <td style={{color:'#4e4639'}}>{c.email}</td>
                              <td style={{color:'#4e4639'}}>{c.phoneNumber}</td>
                              <td style={{textAlign:'center'}}>
                                <span className="bb-count-chip">{c.bookingCount}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bb-table-foot">
                      <span>Visar {customers.length} av {customers.length} kunder</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── INSTÄLLNINGAR ── */}
            {activeTab==='installningar' && !loading && (
              <div className="bb-card bb-settings-card">
                <form onSubmit={e=>{e.preventDefault();handleSaveSettings();}}>

                  {/* Section 1: General */}
                  <div className="bb-settings-section">
                    <h3 className="bb-settings-section-title">
                      <span className="bb-mat-icon" style={{fontSize:22}}>store</span>
                      Salongens inställningar
                    </h3>
                    <div className="bb-settings-two-col">
                      <div className="bb-fg">
                        <label className="bb-fg-label">Avbokningsfönster (timmar innan)</label>
                        <div style={{position:'relative'}}>
                          <input type="number" value={cancellationHours} onChange={e=>{const v=e.target.value;setCancellationHours(v===''?'':Number(v));}} placeholder="24" style={{paddingRight:36}} />
                          <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#7f7667',fontWeight:600,pointerEvents:'none'}}>h</span>
                        </div>
                        <span className="bb-settings-hint">Kunder kan inte avboka online senare än detta.</span>
                      </div>
                      <div className="bb-fg">
                        <label className="bb-fg-label">Deposition vid onlinebokning (%)</label>
                        <div style={{position:'relative'}}>
                          <input type="number" value={depositPct} onChange={e=>{const v=e.target.value;setDepositPct(v===''?'':Number(v));}} placeholder="0" style={{paddingRight:36}} />
                          <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#7f7667',fontWeight:600,pointerEvents:'none'}}>%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bb-settings-divider" />

                  {/* Section 2: Payments */}
                  <div className="bb-settings-section">
                    <h3 className="bb-settings-section-title">
                      <span className="bb-mat-icon" style={{fontSize:22}}>payments</span>
                      Godkända betalningsmetoder
                    </h3>
                    <div className="bb-pay-methods-wrap">
                      {([
                        { key:'swish', label:'Swish' },
                        { key:'card', label:'Kort i salongen (Kortterminal)' },
                        { key:'cash', label:'Kontant' },
                      ] as const).map(m=>(
                        <label key={m.key} className="bb-pay-method">
                          <input type="checkbox" checked={acceptedPaymentMethods.includes(m.key)} onChange={e=>{
                            if(e.target.checked) setAcceptedPaymentMethods([...acceptedPaymentMethods,m.key]);
                            else setAcceptedPaymentMethods(acceptedPaymentMethods.filter(x=>x!==m.key));
                          }} />
                          {m.key==='swish' && (
                            <Image src="/swish.svg" width={34} height={34} alt="Swish" style={{flexShrink:0}} />
                          )}
                          {m.key==='card' && (
                            <svg viewBox="0 0 86 54" width="44" height="28" style={{flexShrink:0}}>
                              <defs>
                                <linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#1565C0"/>
                                  <stop offset="100%" stopColor="#0D47A1"/>
                                </linearGradient>
                              </defs>
                              <rect width="86" height="54" rx="6" fill="url(#card-bg)"/>
                              {/* magnetic stripe */}
                              <rect x="0" y="13" width="86" height="10" fill="rgba(0,0,0,0.35)"/>
                              {/* chip */}
                              <rect x="8" y="28" width="18" height="14" rx="2" fill="#E8B84B"/>
                              <line x1="8" y1="35" x2="26" y2="35" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
                              <line x1="17" y1="28" x2="17" y2="42" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
                              {/* VISA text */}
                              <text x="78" y="48" fill="white" fontSize="13" fontWeight="900" fontStyle="italic" textAnchor="end" fontFamily="'Times New Roman',Georgia,serif" letterSpacing="1">VISA</text>
                            </svg>
                          )}
                          {m.key==='cash' && (
                            <svg viewBox="0 0 86 54" width="44" height="28" style={{flexShrink:0}}>
                              <rect width="86" height="54" rx="6" fill="#2E7D32"/>
                              <rect x="2" y="2" width="82" height="50" rx="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                              <circle cx="12" cy="12" r="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                              <circle cx="74" cy="42" r="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                              <ellipse cx="43" cy="27" rx="16" ry="14" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"/>
                              <text x="43" y="32" fill="white" fontSize="14" fontWeight="800" textAnchor="middle" fontFamily="Arial,sans-serif">kr</text>
                            </svg>
                          )}
                          <span className="bb-pay-method-label">{m.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="bb-settings-hint" style={{marginTop:8}}>Välj de betalningssätt som visas för kunder på bokningsbekräftelsen.</p>
                  </div>

                  <div className="bb-settings-divider" />

                  {/* Section 3: Hours */}
                  <div className="bb-settings-section">
                    <h3 className="bb-settings-section-title">
                      <span className="bb-mat-icon" style={{fontSize:22}}>schedule</span>
                      Öppettider (Mån–Fre)
                    </h3>
                    <div className="bb-time-row">
                      <div className="bb-time-col">
                        <label style={{fontSize:10,fontWeight:700,color:'#7f7667',textTransform:'uppercase',letterSpacing:'0.1em'}}>Från</label>
                        <input type="time" value={openTime} onChange={e=>setOpenTime(e.target.value)} className="bb-fg" style={{padding:'11px 14px',border:'1.5px solid #d1c5b4',borderRadius:10,fontSize:14,color:'#1b1c1c',outline:'none',width:130}} />
                      </div>
                      <span className="bb-time-sep">till</span>
                      <div className="bb-time-col">
                        <label style={{fontSize:10,fontWeight:700,color:'#7f7667',textTransform:'uppercase',letterSpacing:'0.1em'}}>Till</label>
                        <input type="time" value={closeTime} onChange={e=>setCloseTime(e.target.value)} style={{padding:'11px 14px',border:'1.5px solid #d1c5b4',borderRadius:10,fontSize:14,color:'#1b1c1c',outline:'none',width:130}} />
                      </div>
                    </div>
                  </div>

                  <div className="bb-settings-divider" />

                  <button type="submit" disabled={savingSettings} className="bb-btn-primary">
                    {savingSettings?'Sparar...':<><span>Spara inställningar</span><span className="bb-mat-icon" style={{fontSize:18}}>check_circle</span></>}
                  </button>
                </form>
              </div>
            )}
          </main>
          {/* No bb-footer here — the public Footer component handles the dashboard footer */}
        </div>
      </div>
    </>
  );
}

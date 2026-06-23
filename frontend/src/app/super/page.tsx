'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface PlatformStats {
  totalShops: number; activeShops: number; suspendedSubs: number;
  totalBookings: number; totalUsers: number; mrr: number;
}
interface ShopData {
  _id: string; name: string; slug: string;
  address: { city: string; street: string };
  isActive: boolean; ownerName: string; ownerEmail: string;
  planName: string; subStatus: string; mrr: number;
  createdAt: string; isReady?: boolean;
}
interface AuditEntry {
  _id: string; action: string; shopName: string;
  userId: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}
interface UserData {
  _id: string; firstName: string; lastName: string;
  email: string; role: string; shopName?: string;
  bookingCount?: number; createdAt: string; emailVerified?: boolean;
}
interface AdminUser { firstName: string; lastName: string; email: string; }
interface SuperNotif {
  _id: string; type: string; title: string; message: string;
  shopName?: string; read: boolean; createdAt: string;
}
interface TrendPoint { label: string; bookings: number; newShops: number; [key: string]: string | number; }

type Tab = 'oversikt' | 'salonger' | 'anvandare' | 'loggar' | 'installningar';

const GOLD = '#c5a059';
const DARK_GOLD = '#775a19';
const BG = '#f5f4f0';
const BORDER = '#e8e3da';
const WHITE = '#ffffff';
const TEXT = '#1a1a1a';
const TEXT2 = '#4e4639';
const MUTED = '#9d9385';

function InitialAvatar({ name, size = 36, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#c5a059','#775a19','#4a7c59','#2d6a9f','#8b5cf6','#dc6b2f'];
  const bg = color || colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:size*0.35, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    active:  { color:'#065f46', bg:'#d1fae5', label:'Aktiv' },
    trial:   { color:'#1e40af', bg:'#dbeafe', label:'Provperiod' },
    suspended:{ color:'#991b1b', bg:'#fee2e2', label:'Avstängd' },
    past_due:{ color:'#92400e', bg:'#fef3c7', label:'Obetald' },
    cancelled:{ color:'#6b7280', bg:'#f3f4f6', label:'Uppsagd' },
  };
  const s = map[status] || { color:'#6b7280', bg:'#f3f4f6', label: status };
  return (
    <span style={{ background:s.bg, color:s.color, padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('oversikt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [notifs, setNotifs] = useState<SuperNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [stats, setStats] = useState<PlatformStats>({ totalShops:0, activeShops:0, suspendedSubs:0, totalBookings:0, totalUsers:0, mrr:0 });
  const [shops, setShops] = useState<ShopData[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Settings
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.me();
        if (res.ok) {
          const d = res.data as { user: AdminUser & { role: string } };
          if (d.user.role !== 'super_admin') router.push('/');
          else setAdminUser(d.user);
        } else router.push('/login');
      } catch { router.push('/login'); }
    };
    verify();
    const iv = setInterval(verify, 60000);
    return () => clearInterval(iv);
  }, [router]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.superNotifications();
      if (res.ok) {
        const d = res.data as { notifications: SuperNotif[]; unreadCount: number };
        setNotifs(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch {}
  }, []);

  const handleOpenNotifs = async () => {
    setNotifOpen(p => !p);
    if (!notifOpen && unreadCount > 0) {
      await api.superMarkNotificationsRead();
      setUnreadCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  useEffect(() => {
    setTimeout(() => {
      loadNotifications();
    }, 0);
    const iv = setInterval(loadNotifications, 30000);
    return () => clearInterval(iv);
  }, [loadNotifications]);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dRes, sRes, tRes] = await Promise.all([api.superDashboard(), api.superShops(), api.superTrend()]);
      if (dRes.ok) setStats(dRes.data as PlatformStats);
      if (sRes.ok) setShops((sRes.data as { shops: ShopData[] }).shops || []);
      if (tRes.ok) setTrend((tRes.data as { trend: TrendPoint[] }).trend || []);
      if (!dRes.ok) setError('Kunde inte hämta statistik.');
    } catch { setError('Serverfel.'); }
    finally { setLoading(false); }
  }, []);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superShops();
      if (res.ok) setShops((res.data as { shops: ShopData[] }).shops || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superUsers();
      if (res.ok) setUsers((res.data as { users: UserData[] }).users || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superAuditLogs();
      if (res.ok) setLogs((res.data as { logs: AuditEntry[] }).logs || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const run = () => {
      if (activeTab === 'oversikt') loadDashboard();
      else if (activeTab === 'salonger') loadShops();
      else if (activeTab === 'anvandare') loadUsers();
      else if (activeTab === 'loggar') loadLogs();
      else setLoading(false);
    };
    setTimeout(run, 0);
  }, [activeTab, loadDashboard, loadShops, loadUsers, loadLogs]);

  const handleToggleShop = async (shopId: string, isActive: boolean) => {
    if (!confirm(isActive ? 'Stäng av denna salong?' : 'Återaktivera denna salong?')) return;
    await api.superToggleShop(shopId, isActive ? 'suspend' : 'reactivate');
    showToast(isActive ? 'Salongen stängdes av.' : 'Salongen aktiverades.');
    loadShops();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Lösenorden matchar inte.', false); return; }
    if (newPw.length < 8) { showToast('Minst 8 tecken krävs.', false); return; }
    setPwLoading(true);
    try {
      const res = await api.superChangePassword(currentPw, newPw);
      if (res.ok) { showToast('Lösenordet uppdaterades!'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
      else {
        const errData = res.data as { error?: string };
        showToast(errData.error || 'Misslyckades.', false);
      }
    } catch { showToast('Nätverksfel.', false); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'oversikt', label: 'Översikt', icon: <IconGrid /> },
    { key: 'salonger', label: 'Salongshantering', icon: <IconScissors /> },
    { key: 'anvandare', label: 'Användarhantering', icon: <IconUsers /> },
    { key: 'loggar', label: 'Händelselogg', icon: <IconLog /> },
    { key: 'installningar', label: 'Systeminställningar', icon: <IconSettings /> },
  ];

  const filteredShops = shops.filter(s => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.address?.city?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'not_ready' ? !s.isReady : s.subStatus === statusFilter);
    return matchQ && matchStatus;
  });

  const filteredUsers = users.filter(u => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchQ && matchRole;
  });

  const roleLabel = (r: string) => ({ super_admin:'Super Admin', shop_admin:'Salong Admin', barber:'Frisör', customer:'Kund' }[r] || r);
  const roleColor = (r: string) => ({ super_admin:{ bg:'#fef3c7', color:'#92400e' }, shop_admin:{ bg:'#dbeafe', color:'#1e40af' }, barber:{ bg:'#d1fae5', color:'#065f46' }, customer:{ bg:'#f3f4f6', color:'#374151' } }[r] || { bg:'#f3f4f6', color:'#374151' });

  const tabTitle = navItems.find(n => n.key === activeTab)?.label || '';

  return (
    <div style={{ display:'flex', height:'100vh', background:BG, fontFamily:"'Inter', system-ui, sans-serif", overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside className="super-sidebar" style={{ width:220, background:WHITE, borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
        {/* Logo */}
        <div className="super-sidebar-logo" style={{ padding:'24px 20px 20px', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.02em', color:TEXT }}>
            <span style={{ color:GOLD }}>Boka</span><span className="sidebar-text">Barber</span>
          </div>
          <div className="sidebar-text" style={{ fontSize:'0.68rem', fontWeight:700, color:MUTED, letterSpacing:'0.12em', textTransform:'uppercase', marginTop:2 }}>Super Admin</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 0' }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className="sidebar-nav-btn"
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 20px',
                border:'none', borderLeft: activeTab===item.key ? `3px solid ${GOLD}` : '3px solid transparent',
                background: activeTab===item.key ? `linear-gradient(90deg,rgba(197,160,89,0.1),transparent)` : 'transparent',
                color: activeTab===item.key ? DARK_GOLD : TEXT2,
                fontWeight: activeTab===item.key ? 700 : 500, fontSize:'0.875rem', cursor:'pointer', textAlign:'left',
              }}>
              <span style={{ opacity: activeTab===item.key ? 1 : 0.55, flexShrink:0 }}>{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop:`1px solid ${BORDER}`, padding:'16px 20px' }}>
          {adminUser && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <InitialAvatar name={`${adminUser.firstName} ${adminUser.lastName}`} size={34} color={DARK_GOLD} />
              <div className="sidebar-text" style={{ minWidth:0 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:700, color:TEXT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{adminUser.firstName} {adminUser.lastName}</div>
                <div style={{ fontSize:'0.7rem', color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{adminUser.email}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="sidebar-logout-btn"
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', border:`1px solid ${BORDER}`, borderRadius:8, background:'transparent', color:TEXT2, fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
            <IconLogout /> <span className="sidebar-text">Logga ut</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Top bar */}
        <div style={{ background:WHITE, borderBottom:`1px solid ${BORDER}`, padding:'0 28px', height:64, display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
          {/* Search */}
          <div style={{ flex:1, maxWidth:400, position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:MUTED, pointerEvents:'none' }}><IconSearch /></span>
            <input
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder={activeTab==='salonger' ? 'Sök salong, ägare eller stad...' : activeTab==='anvandare' ? 'Sök användare eller e-post...' : 'Sök...'}
              style={{ width:'100%', padding:'9px 14px 9px 38px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:'0.85rem', outline:'none', background:'#faf9f6', boxSizing:'border-box' }}
            />
          </div>
          <div style={{ flex:1 }} />
          {/* Notifications bell */}
          <div ref={notifRef} style={{ position:'relative' }}>
            <button onClick={handleOpenNotifs}
              style={{ width:38, height:38, borderRadius:9, border:`1px solid ${BORDER}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:TEXT2, position:'relative' }}>
              <IconBell />
              {unreadCount > 0 && (
                <span style={{ position:'absolute', top:-5, right:-5, background:'#dc2626', color:'white', borderRadius:'50%', minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:800, padding:'0 3px', border:'2px solid white', lineHeight:1 }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position:'absolute', top:46, right:0, width:360, background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.14)', zIndex:1000, overflow:'hidden' }}>
                <div style={{ padding:'16px 18px 12px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:700, fontSize:'0.95rem', color:TEXT }}>Notifikationer</span>
                  <button onClick={()=>setNotifOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:'1.1rem', lineHeight:1 }}>✕</button>
                </div>
                <div style={{ maxHeight:400, overflowY:'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding:'32px 18px', textAlign:'center', color:MUTED, fontSize:'0.85rem' }}>Inga notifikationer ännu</div>
                  ) : notifs.map(n => (
                    <div key={n._id} style={{ padding:'14px 18px', borderBottom:`1px solid #f5f3ef`, background: n.read ? WHITE : '#fffbf2', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ fontSize:'1.2rem', flexShrink:0 }}>
                        {n.type==='new_salon' ? '🏪' : n.type==='payment' ? '💳' : n.type==='trial_expired' ? '⏰' : n.type==='suspended' ? '🔴' : 'ℹ️'}
                      </span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.83rem', color:TEXT, marginBottom:2 }}>{n.title}</div>
                        <div style={{ fontSize:'0.78rem', color:TEXT2, lineHeight:1.4 }}>{n.message}</div>
                        <div style={{ fontSize:'0.72rem', color:MUTED, marginTop:4 }}>{new Date(n.createdAt).toLocaleString('sv-SE')}</div>
                      </div>
                      {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'#dc2626', flexShrink:0, marginTop:4 }}/>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* User chip */}
          {adminUser && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'0.82rem', fontWeight:700, color:TEXT }}>{adminUser.firstName} {adminUser.lastName}</div>
                <div style={{ fontSize:'0.7rem', color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em' }}>Super Admin</div>
              </div>
              <InitialAvatar name={`${adminUser.firstName} ${adminUser.lastName}`} size={36} color={DARK_GOLD} />
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.ok ? '#d1fae5' : '#fee2e2', color: toast.ok ? '#065f46' : '#991b1b', padding:'12px 20px', borderRadius:10, fontWeight:600, fontSize:'0.88rem', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
            {toast.ok ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'28px 16px' }}>
          {/* Page header */}
          <div style={{ marginBottom:28 }}>
            <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:800, color:TEXT, letterSpacing:'-0.02em' }}>{tabTitle}</h1>
            <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:MUTED }}>
              {activeTab==='oversikt' && 'Realtidsöversikt av hela plattformen och dess aktivitet'}
              {activeTab==='salonger' && 'Hantera, övervaka och kontrollera alla registrerade salonger'}
              {activeTab==='anvandare' && 'Administrera alla användare, roller och behörigheter'}
              {activeTab==='loggar' && 'Granska systemhändelser och administrativa åtgärder'}
              {activeTab==='installningar' && 'Kontoinformation, säkerhet och systeminställningar'}
            </p>
          </div>

          {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'12px 16px', borderRadius:10, marginBottom:20, fontWeight:600 }}>⚠️ {error}</div>}

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:MUTED }}>
              <div style={{ width:28, height:28, border:`3px solid ${BORDER}`, borderTopColor:GOLD, borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
              Hämtar data...
            </div>
          ) : (
            <>
              {/* ── ÖVERSIKT ── */}
              {activeTab==='oversikt' && (
                <div>
                  {/* KPI row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:16, marginBottom:28 }}>
                    {[
                      { icon:<IconMoney/>, label:'Månadsintäkter', sub:'Aktiva prenumerationer', val:`${stats.mrr.toLocaleString('sv-SE')} SEK`, accent:true, danger:false },
                      { icon:<IconCheck/>, label:'Aktiva salonger', sub:'Betald eller provperiod', val:String(stats.activeShops), accent:false, danger:false },
                      { icon:<IconShop/>, label:'Totala salonger', sub:'Registrerade på plattformen', val:String(stats.totalShops), accent:false, danger:false },
                      { icon:<IconUsers/>, label:'Totala användare', sub:'Kunder, admins & frisörer', val:String(stats.totalUsers), accent:false, danger:false },
                      { icon:<IconCalendar/>, label:'Totala bokningar', sub:'Alla bokningar nogonsin', val:String(stats.totalBookings), accent:false, danger:false },
                      { icon:<IconWarn/>, label:'Behöver åtgärd', sub:'Suspenderade salonger', val:String(stats.suspendedSubs), accent:false, danger:stats.suspendedSubs>0 },
                    ].map((k,i) => (
                      <div key={i} style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                          <span style={{ color: k.accent ? GOLD : k.danger ? '#dc2626' : MUTED }}>{k.icon}</span>
                          <span style={{ fontSize:'0.7rem', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em' }}>{k.label}</span>
                        </div>
                        <div style={{ fontSize:'2rem', fontWeight:800, color: k.danger ? '#dc2626' : k.accent ? GOLD : TEXT, letterSpacing:'-0.02em', lineHeight:1, marginBottom:6 }}>{k.val}</div>
                        <div style={{ fontSize:'0.75rem', color:MUTED }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  {trend.length > 0 && (
                    <div className="super-charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                      <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'22px 24px' }}>
                        <div style={{ fontSize:'0.78rem', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Bokningar per månad</div>
                        <div style={{ fontSize:'1.5rem', fontWeight:800, color:TEXT, marginBottom:16 }}>
                          {trend[trend.length-1]?.bookings ?? 0}
                          <span style={{ fontSize:'0.78rem', fontWeight:500, color:MUTED, marginLeft:6 }}>denna månad</span>
                        </div>
                        <BarChart data={trend} valueKey="bookings" color={GOLD} />
                      </div>
                      <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'22px 24px' }}>
                        <div style={{ fontSize:'0.78rem', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Nya salonger per månad</div>
                        <div style={{ fontSize:'1.5rem', fontWeight:800, color:TEXT, marginBottom:16 }}>
                          {trend[trend.length-1]?.newShops ?? 0}
                          <span style={{ fontSize:'0.78rem', fontWeight:500, color:MUTED, marginLeft:6 }}>denna månad</span>
                        </div>
                        <BarChart data={trend} valueKey="newShops" color="#4a7c59" />
                      </div>
                    </div>
                  )}

                  {/* Recent salons table */}
                  <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                      <h2 style={{ margin:0, fontSize:'1.05rem', fontWeight:700, color:TEXT }}>Senast registrerade salonger</h2>
                      <button onClick={()=>setActiveTab('salonger')} style={{ color:GOLD, background:'none', border:`1px solid ${BORDER}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>Visa alla →</button>
                    </div>
                    {shops.length === 0 ? (
                      <p style={{ color:MUTED, fontSize:'0.88rem', margin:0 }}>Inga salonger laddade ännu. <button onClick={()=>setActiveTab('salonger')} style={{ color:GOLD, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Ladda salonger →</button></p>
                    ) : (
                      <Table headers={['Salong','Stad','Ägare','Plan','Status','Redo']} minWidth={680}>
                        {shops.slice(0,6).map(s => (
                          <tr key={s._id} style={{ borderBottom:`1px solid #f5f3ef` }}>
                            <Td><div style={{ display:'flex', alignItems:'center', gap:10 }}><InitialAvatar name={s.name} size={30}/><div><div style={{ fontWeight:600, fontSize:'0.88rem', color:TEXT }}>{s.name}</div><div style={{ fontSize:'0.72rem', color:MUTED }}>/{s.slug}</div></div></div></Td>
                            <Td>{s.address?.city || '—'}</Td>
                            <Td>{s.ownerName}</Td>
                            <Td><PlanBadge plan={s.planName}/></Td>
                            <Td><StatusDot status={s.subStatus}/></Td>
                            <Td>{s.isReady ? <span style={{color:'#059669',fontWeight:700,fontSize:'0.82rem'}}>✅ Online</span> : <span style={{color:'#dc2626',fontWeight:700,fontSize:'0.82rem'}}>⭕ Ej redo</span>}</Td>
                          </tr>
                        ))}
                      </Table>
                    )}
                  </div>
                </div>
              )}

              {/* ── SALONGER ── */}
              {activeTab==='salonger' && (
                <div>
                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                    {[
                      { label:'TOTALT ANTAL SALONGER', val:stats.totalShops, sub:'Registrerade på plattformen', danger:false },
                      { label:'AKTIVA SALONGER', val:stats.activeShops, sub:'Trial eller aktiv prenumeration', danger:false },
                      { label:'BEHÖVER ÅTGÄRD', val:stats.suspendedSubs, sub:'Suspenderade', danger:stats.suspendedSubs>0 },
                    ].map((s,i) => (
                      <div key={i} style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:12, padding:'20px 22px' }}>
                        <div style={{ fontSize:'0.7rem', fontWeight:700, color:MUTED, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
                        <div style={{ fontSize:'2.2rem', fontWeight:800, color: s.danger ? '#dc2626' : TEXT, letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>{s.val}</div>
                        <div style={{ fontSize:'0.75rem', color:MUTED }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filter + table */}
                  <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                      <h2 style={{ margin:0, fontSize:'1.05rem', fontWeight:700, color:TEXT }}>Aktiva salonger ({filteredShops.length})</h2>
                      <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                        style={{ padding:'8px 12px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:'0.85rem', background:WHITE, color:TEXT, cursor:'pointer' }}>
                        <option value="all">Alla</option>
                        <option value="trial">Provperiod</option>
                        <option value="active">Aktiv prenumeration</option>
                        <option value="past_due">Obetald faktura</option>
                        <option value="suspended">Avstängd</option>
                        <option value="cancelled">Uppsagd</option>
                        <option value="not_ready">Ej redo</option>
                      </select>
                    </div>
                    {filteredShops.length === 0 ? (
                      <EmptyState text="Inga salonger matchar sökningen." />
                    ) : (
                      <Table headers={['Salongens namn','Ägare','Ort','Prenumeration','Status','Intäkt/mån','Redo','Åtgärd']} minWidth={960}>
                        {filteredShops.map(s => (
                          <tr key={s._id} style={{ borderBottom:`1px solid #f5f3ef` }}>
                            <Td>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <InitialAvatar name={s.name} size={32}/>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:'0.88rem', color:TEXT }}>{s.name}</div>
                                  <div style={{ fontSize:'0.72rem', color:MUTED }}>/{s.slug}</div>
                                </div>
                              </div>
                            </Td>
                            <Td><div style={{fontSize:'0.88rem',color:TEXT}}>{s.ownerName}</div><div style={{fontSize:'0.72rem',color:MUTED}}>{s.ownerEmail}</div></Td>
                            <Td>{s.address?.city || '—'}</Td>
                            <Td><PlanBadge plan={s.planName}/></Td>
                            <Td><StatusDot status={s.subStatus}/></Td>
                            <Td style={{fontWeight:600}}>{s.mrr > 0 ? `${s.mrr} SEK` : '—'}</Td>
                            <Td>{s.isReady ? <span style={{color:'#059669',fontWeight:700,fontSize:'0.8rem'}}>✅ Online</span> : <span style={{color:'#dc2626',fontWeight:700,fontSize:'0.8rem'}}>⭕ Ej redo</span>}</Td>
                            <Td>
                              <button onClick={()=>handleToggleShop(s._id, s.isActive)}
                                style={{ padding:'6px 12px', borderRadius:7, border:'none', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', background:s.isActive?'#fee2e2':'#d1fae5', color:s.isActive?'#991b1b':'#065f46' }}>
                                {s.isActive ? 'Stäng av' : 'Aktivera'}
                              </button>
                            </Td>
                          </tr>
                        ))}
                      </Table>
                    )}
                  </div>
                </div>
              )}

              {/* ── ANVÄNDARHANTERING ── */}
              {activeTab==='anvandare' && (
                <div>
                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                    {[
                      { label:'TOTALA ANVÄNDARE', val:users.length },
                      { label:'SUPER ADMINS', val:users.filter(u=>u.role==='super_admin').length, sub:'Fullständiga rättigheter' },
                      { label:'SALONG ADMINS', val:users.filter(u=>u.role==='shop_admin').length, sub:'Salongshantering' },
                      { label:'KUNDER', val:users.filter(u=>u.role==='customer').length, sub:'Bokade kunder' },
                    ].map((s,i)=>(
                      <div key={i} style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:12, padding:'18px 20px' }}>
                        <div style={{ fontSize:'0.68rem', fontWeight:700, color:MUTED, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
                        <div style={{ fontSize:'2rem', fontWeight:800, color:TEXT, lineHeight:1, marginBottom:4 }}>{s.val}</div>
                        {s.sub && <div style={{ fontSize:'0.72rem', color:MUTED }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                      <h2 style={{ margin:0, fontSize:'1.05rem', fontWeight:700, color:TEXT }}>Alla användare ({filteredUsers.length})</h2>
                      <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
                        style={{ padding:'8px 12px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:'0.85rem', background:WHITE, color:TEXT, cursor:'pointer' }}>
                        <option value="all">Alla roller</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="shop_admin">Salong Admin</option>
                        <option value="barber">Frisör</option>
                        <option value="customer">Kund</option>
                      </select>
                    </div>
                    {filteredUsers.length === 0 ? (
                      <EmptyState text="Inga användare matchar sökningen." />
                    ) : (
                      <Table headers={['Namn & Profil','E-post','Roll','Salong','Registrerad']} minWidth={700}>
                        {filteredUsers.map(u => {
                          const rc = roleColor(u.role);
                          return (
                            <tr key={u._id} style={{ borderBottom:`1px solid #f5f3ef` }}>
                              <Td>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <InitialAvatar name={`${u.firstName} ${u.lastName}`} size={32}/>
                                  <div>
                                    <div style={{ fontWeight:600, fontSize:'0.88rem', color:TEXT }}>{u.firstName} {u.lastName}</div>
                                    <div style={{ fontSize:'0.72rem', color: u.emailVerified ? '#059669' : '#dc2626' }}>{u.emailVerified ? '✓ Verifierad' : '✗ Ej verifierad'}</div>
                                  </div>
                                </div>
                              </Td>
                              <Td style={{fontSize:'0.85rem'}}>{u.email}</Td>
                              <Td><span style={{ background:rc.bg, color:rc.color, padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>{roleLabel(u.role)}</span></Td>
                              <Td style={{fontSize:'0.85rem',color:TEXT2}}>{u.shopName || '—'}</Td>
                              <Td style={{fontSize:'0.82rem',color:MUTED}}>{new Date(u.createdAt).toLocaleDateString('sv-SE')}</Td>
                            </tr>
                          );
                        })}
                      </Table>
                    )}
                  </div>
                </div>
              )}

              {/* ── HÄNDELSELOGG ── */}
              {activeTab==='loggar' && (
                <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                  <h2 style={{ margin:'0 0 20px', fontSize:'1.05rem', fontWeight:700, color:TEXT }}>Senaste händelser</h2>
                  {logs.length === 0 ? <EmptyState text="Inga loggade händelser ännu." /> : (
                    <Table headers={['Tid','Händelse','Utförd av','Salong']} minWidth={560}>
                      {logs.map(l => (
                        <tr key={l._id} style={{ borderBottom:`1px solid #f5f3ef` }}>
                          <Td style={{fontSize:'0.8rem',color:MUTED,whiteSpace:'nowrap'}}>{new Date(l.createdAt).toLocaleString('sv-SE')}</Td>
                          <Td><code style={{ background:'#f0ede6', color:TEXT2, padding:'2px 8px', borderRadius:5, fontSize:'0.78rem' }}>{l.action}</code></Td>
                          <Td style={{fontSize:'0.85rem'}}>{l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : '—'}</Td>
                          <Td style={{fontWeight:600,fontSize:'0.88rem'}}>{l.shopName}</Td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </div>
              )}

              {/* ── INSTÄLLNINGAR ── */}
              {activeTab==='installningar' && (
                <div className="super-settings-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                      <h2 style={{ margin:'0 0 20px', fontSize:'1.05rem', fontWeight:700, color:TEXT }}>👤 Kontoinformation</h2>
                      <div className="info-field-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        {[{label:'Förnamn',val:adminUser?.firstName||'—'},{label:'Efternamn',val:adminUser?.lastName||'—'}].map(f=>(
                          <div key={f.label} style={{ background:BG, borderRadius:10, padding:'12px 14px' }}>
                            <div style={{ fontSize:'0.7rem', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{f.label}</div>
                            <div style={{ fontSize:'0.95rem', fontWeight:600, color:TEXT }}>{f.val}</div>
                          </div>
                        ))}
                      </div>
                      <div className="info-field-grid" style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                        {[{label:'E-postadress',val:adminUser?.email||'—'},{label:'Roll',val:'Super Admin'}].map(f=>(
                          <div key={f.label} style={{ background:BG, borderRadius:10, padding:'12px 14px' }}>
                            <div style={{ fontSize:'0.7rem', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{f.label}</div>
                            <div style={{ fontSize:'0.95rem', fontWeight:600, color:TEXT }}>{f.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                      <h2 style={{ margin:'0 0 16px', fontSize:'1.05rem', fontWeight:700, color:TEXT }}>ℹ️ Systeminformation</h2>
                      {[{l:'Plattform',v:'BokaBarber SaaS'},{l:'Version',v:'v1.0'},{l:'Support',v:'support@bokabarber.se'}].map(f=>(
                        <div key={f.l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:BG, borderRadius:8, marginBottom:8 }}>
                          <span style={{ fontSize:'0.82rem', color:MUTED, fontWeight:600 }}>{f.l}</span>
                          <span style={{ fontSize:'0.82rem', color:TEXT }}>{f.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:14, padding:'24px' }}>
                    <h2 style={{ margin:'0 0 6px', fontSize:'1.05rem', fontWeight:700, color:TEXT }}>🔒 Byt lösenord</h2>
                    <p style={{ margin:'0 0 22px', fontSize:'0.82rem', color:MUTED }}>Minst 8 tecken. Loggas ut från alla sessioner.</p>
                    <form onSubmit={handleChangePassword} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {[
                        { label:'Nuvarande lösenord', val:currentPw, set:setCurrentPw, show:showCurrentPw, tog:()=>setShowCurrentPw(p=>!p) },
                        { label:'Nytt lösenord', val:newPw, set:setNewPw, show:showNewPw, tog:()=>setShowNewPw(p=>!p) },
                        { label:'Bekräfta nytt lösenord', val:confirmPw, set:setConfirmPw, show:showConfirmPw, tog:()=>setShowConfirmPw(p=>!p) },
                      ].map(f=>(
                        <div key={f.label}>
                          <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:TEXT2, marginBottom:7 }}>{f.label}</label>
                          <div style={{ position:'relative' }}>
                            <input type={f.show?'text':'password'} value={f.val} onChange={e=>f.set(e.target.value)} required
                              style={{ width:'100%', padding:'11px 44px 11px 14px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:'0.9rem', outline:'none', boxSizing:'border-box', background:'#fafaf8' }}/>
                            <button type="button" onClick={f.tog} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex', alignItems:'center', padding:0 }}>
                              {f.show ? <EyeOff/> : <EyeOn/>}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="submit" disabled={pwLoading||!currentPw||!newPw||!confirmPw}
                        style={{ padding:'13px', background:`linear-gradient(135deg,${GOLD},${DARK_GOLD})`, color:'white', border:'none', borderRadius:9, fontWeight:700, fontSize:'0.9rem', cursor:pwLoading?'not-allowed':'pointer', opacity:(!currentPw||!newPw||!confirmPw)?0.6:1, marginTop:4 }}>
                        {pwLoading?'Sparar...':'Uppdatera lösenord'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:960px){
          .super-settings-grid{grid-template-columns:1fr!important}
          .info-field-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:786px){
          .super-charts-grid{grid-template-columns:1fr!important}
          
          /* Collapsing Sidebar rules */
          .super-sidebar {
            width: 74px !important;
          }
          .super-sidebar-logo {
            padding: 24px 10px 20px !important;
            text-align: center;
          }
          .sidebar-text {
            display: none !important;
          }
          .sidebar-nav-btn {
            justify-content: center !important;
            padding: 12px 0 !important;
            gap: 0 !important;
            border-left-width: 4px !important;
          }
          .sidebar-logout-btn {
            justify-content: center !important;
            padding: 9px 0 !important;
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Small reusable components ──────────────────────────────────────────────────

function Table({ headers, children, minWidth = 700 }: { headers: string[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' } as React.CSSProperties}>
      <table style={{ minWidth, width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
        <thead>
          <tr style={{ borderBottom:'2px solid #f0ede6' }}>
            {headers.map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#9d9385', fontWeight:700, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding:'13px 14px', verticalAlign:'middle', whiteSpace:'nowrap', ...style }}>{children}</td>;
}

function PlanBadge({ plan }: { plan: string }) {
  return <span style={{ background:'rgba(197,160,89,0.12)', color:'#775a19', padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>{plan}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign:'center', padding:'40px 20px', color:'#9d9385', border:'1px dashed #e8e3da', borderRadius:10 }}>{text}</div>;
}

// ── Charts ────────────────────────────────────────────────────────────────────

interface BarChartProps { data: { label: string; [key: string]: number | string }[]; valueKey: string; color: string; }

function BarChart({ data, valueKey, color }: BarChartProps) {
  const vals = data.map(d => (d[valueKey] as number) || 0);
  const max = Math.max(...vals, 1);
  const W = 280, H = 80, BAR_W = Math.floor((W - (data.length - 1) * 6) / data.length);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow:'visible' }}>
      {vals.map((v, i) => {
        const barH = Math.max(4, (v / max) * H);
        const x = i * (BAR_W + 6);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={H} width={BAR_W} height={0} fill={color} rx={3} opacity={0.15} />
            <rect x={x} y={y} width={BAR_W} height={barH} fill={color} rx={3} opacity={i === vals.length - 1 ? 1 : 0.55} />
            <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize={9} fill="#9d9385">{data[i].label}</text>
            {v > 0 && <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fontSize={9} fill={color} fontWeight={700}>{v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const I = ({ d, size=18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const Ic = ({ children, size=18 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

function IconGrid() { return <Ic><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Ic>; }
function IconScissors() { return <Ic><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></Ic>; }
function IconUsers() { return <Ic><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>; }
function IconLog() { return <Ic><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ic>; }
function IconSettings() { return <Ic><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>; }
function IconLogout() { return <I d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>; }
function IconSearch() { return <Ic size={16}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ic>; }
function IconBell() { return <Ic size={18}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>; }
function IconMoney() { return <I d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>; }
function IconCheck() { return <I d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>; }
function IconShop() { return <I d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>; }
function IconCalendar() { return <Ic><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ic>; }
function IconWarn() { return <I d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>; }
function EyeOn() { return <Ic size={17}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>; }
function EyeOff() { return <Ic size={17}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></Ic>; }

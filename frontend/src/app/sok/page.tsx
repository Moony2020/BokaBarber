'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api';
import styles from './page.module.css';

const SearchIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const MapPinIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#c5a059" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ScissorsIcon = ({ size = 48, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 12 12" />
    <circle cx="6" cy="18" r="3" /><path d="M9.8 14.2 12 12" /><path d="M20 20 12 12" />
  </svg>
);

const LocateIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="9" />
  </svg>
);

const POPULAR_SERVICES = ['Klippning', 'Skinfade', 'Skäggtrimning', 'Rakning', 'Styling', 'Barnklippning'];

const POPULAR_CITIES = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Örebro', 'Västerås', 'Linköping'];

const CATEGORIES = [
  { id: 'klippning', label: 'Klippning', query: 'Klippning', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop' },
  { id: 'skinfade', label: 'Skinfade', query: 'Skinfade', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop' },
  { id: 'skagg', label: 'Skägg', query: 'Skäggtrimning', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop' },
  { id: 'rakning', label: 'Rakning', query: 'Rakning', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop' },
  { id: 'styling', label: 'Styling', query: 'Styling', image: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=800&auto=format&fit=crop' },
];

interface ShopResult {
  _id: string;
  name: string;
  slug: string;
  address: { street: string; city: string; zipCode: string };
  rating: number;
  reviewCount: number;
  images: string[];
}

const FILTERS = [
  { id: 'top', label: 'TOPPBETYG' },
  { id: 'all', label: 'ALLA SALONGER' },
  { id: 'near', label: 'NÄRA MIG' },
  { id: 'premium', label: 'ENDAST PREMIUM' },
] as const;

const INITIAL_VISIBLE = 6;

const normalizeCityKey = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  stockholm: { lat: 59.3293, lng: 18.0686 },
  goteborg: { lat: 57.7089, lng: 11.9746 },
  malmo: { lat: 55.605, lng: 13.0038 },
  uppsala: { lat: 59.8586, lng: 17.6389 },
  orebro: { lat: 59.2753, lng: 15.2134 },
  vasteras: { lat: 59.6099, lng: 16.5448 },
  linkoping: { lat: 58.4108, lng: 15.6214 },
};

const isPremium = (s: ShopResult) =>
  (s.rating || 0) >= 4.8 || s.reviewCount >= 15 || s.name.toLowerCase().includes('royal');

const isNew = (s: ShopResult) => s.reviewCount > 0 && s.reviewCount <= 5;

const descFor = (s: ShopResult, i: number) => {
  const d = [
    'En tidlös oas för den medvetna mannen. Hantverk möter modern lyx.',
    'Specialister på traditionell knivrakning och klassiska konturer.',
    'Skandinavisk minimalism möter barberartradition och precision.',
  ];
  const city = normalizeCityKey(s.address.city);
  if (city.includes('orebro')) return d[1];
  if (city.includes('stockholm')) return d[2];
  return d[i % d.length];
};

const distKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(r(a.lat)) * Math.cos(r(b.lat));
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const PLACEHOLDER_IMGS = [
  'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512690459411-b0fd1c86b8c8?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
];

function SokPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';

  const [serviceQ, setServiceQ] = useState(initialQ);
  const [cityQ, setCityQ] = useState(initialCity);
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const [showCityDrop, setShowCityDrop] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const isFirstMount = useRef(true);

  const doSearch = useCallback(async (service: string, city: string) => {
    setLoading(true);
    setSearchError(false);
    try {
      const res = await api.searchShops(service || undefined, city || undefined);
      if (res.ok) {
        setShops((res.data as { shops: ShopResult[] }).shops || []);
      } else {
        console.error('Search API error:', res.status, res.data);
        setSearchError(true);
      }
    } catch (err) {
      console.error('Search network error:', err);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowServiceDrop(false);
        setShowCityDrop(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Single effect: fires immediately on first mount, debounced after user input changes
  useEffect(() => {
    const svc = serviceQ.trim();
    const city = cityQ.trim();

    if (isFirstMount.current) {
      isFirstMount.current = false;
      doSearch(svc, city);
      return;
    }

    const delay = !svc && !city ? 100 : 280;
    const t = setTimeout(() => doSearch(svc, city), delay);
    return () => clearTimeout(t);
  }, [serviceQ, cityQ, doSearch]);

  const CITY_KEY_TO_NAME: Record<string, string> = {
    stockholm: 'Stockholm', goteborg: 'Göteborg', malmo: 'Malmö',
    uppsala: 'Uppsala', orebro: 'Örebro', vasteras: 'Västerås', linkoping: 'Linköping',
  };

  const handleNearMe = () => {
    setShowCityDrop(false);
    setActiveFilter('near');

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setUserCoords(loc);

        // Find nearest known city
        let nearestKey = '';
        let nearestDist = Infinity;
        for (const [key, cityLoc] of Object.entries(CITY_COORDS)) {
          const d = distKm(loc, cityLoc);
          if (d < nearestDist) { nearestDist = d; nearestKey = key; }
        }

        const nearestCityName = CITY_KEY_TO_NAME[nearestKey] || '';
        if (nearestCityName) {
          setCityQ(nearestCityName);
          doSearch(serviceQ.trim(), nearestCityName);
          scrollToResults();
        }
      },
      () => {
        // Permission denied — show all results
        doSearch(serviceQ.trim(), '');
        scrollToResults();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const scrollToResults = () => {
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowServiceDrop(false);
    setShowCityDrop(false);
    doSearch(serviceQ.trim(), cityQ.trim());
    scrollToResults();
  };

  const handleCategoryClick = (query: string) => {
    setServiceQ(query);
    setShowAll(false);
    doSearch(query, cityQ.trim());
    scrollToResults();
  };

  const filteredShops = useMemo(() => {
    const r = [...shops];
    if (activeFilter === 'top')
      return r.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.reviewCount - a.reviewCount);
    if (activeFilter === 'premium') return r.filter(isPremium);
    if (activeFilter === 'near' && userCoords)
      return r.sort((a, b) => {
        const ca = CITY_COORDS[normalizeCityKey(a.address.city)];
        const cb = CITY_COORDS[normalizeCityKey(b.address.city)];
        return (ca ? distKm(userCoords, ca) : 9999) - (cb ? distKm(userCoords, cb) : 9999);
      });
    return r;
  }, [activeFilter, shops, userCoords]);

  useEffect(() => { setShowAll(false); }, [filteredShops]);

  const visible = showAll ? filteredShops : filteredShops.slice(0, INITIAL_VISIBLE);
  const hasMore = filteredShops.length > INITIAL_VISIBLE;
  const isSearchActive = serviceQ.trim().length > 0 || cityQ.trim().length > 0;

  const filteredServices = POPULAR_SERVICES.filter(t =>
    !serviceQ.trim() || t.toLowerCase().includes(serviceQ.toLowerCase())
  );
  const filteredCities = POPULAR_CITIES.filter(c =>
    !cityQ.trim() || c.toLowerCase().includes(cityQ.toLowerCase())
  );

  return (
    <div className={`${styles.sokPage} sok-page public-theme animate-fade-in`}>

      {/* ── SEARCH HERO ── */}
      <section className={`${styles.sokHero} sok-hero`}>
        <div className="container">
          <h1 className={`${styles.heroTitle} text-serif`}>Hitta din barbershop</h1>
          <p className={styles.heroSub}>Boka klippning, skäggtrimning och mer — direkt och enkelt.</p>

          {/* DUAL SEARCH BAR */}
          <form ref={formRef} className={styles.dualSearch} onSubmit={handleSubmit} noValidate>

            {/* — Service slot — */}
            <div className={styles.searchSlot}>
              <SearchIcon size={18} className={styles.slotIcon} />
              <div className={styles.slotInner}>
                <span className={styles.slotLabel}>Vad</span>
                <input
                  type="text"
                  placeholder="Tjänst eller salong..."
                  value={serviceQ}
                  onChange={e => { setServiceQ(e.target.value); setShowServiceDrop(true); setShowCityDrop(false); }}
                  onFocus={() => { setShowServiceDrop(true); setShowCityDrop(false); }}
                  className={styles.slotInput}
                  autoComplete="off"
                />
              </div>
              {serviceQ && (
                <button type="button" className={styles.clearBtn} onClick={() => { setServiceQ(''); setShowServiceDrop(false); }} aria-label="Rensa">×</button>
              )}

              {showServiceDrop && filteredServices.length > 0 && (
                <div className={styles.dropdown}>
                  <p className={styles.dropTitle}>Populära</p>
                  {filteredServices.map(t => (
                    <button key={t} type="button" className={styles.dropItem} onMouseDown={() => { setServiceQ(t); setShowServiceDrop(false); doSearch(t, cityQ.trim()); scrollToResults(); }}>
                      <SearchIcon size={14} className={styles.dropItemIcon} />
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.divider} />

            {/* — City slot — */}
            <div className={styles.searchSlot}>
              <MapPinIcon size={18} className={styles.slotIcon} />
              <div className={styles.slotInner}>
                <span className={styles.slotLabel}>Var</span>
                <input
                  type="text"
                  placeholder="Stad eller område..."
                  value={cityQ}
                  onChange={e => { setCityQ(e.target.value); setShowCityDrop(true); setShowServiceDrop(false); }}
                  onFocus={() => { setShowCityDrop(true); setShowServiceDrop(false); }}
                  className={styles.slotInput}
                  autoComplete="off"
                />
              </div>
              {cityQ && (
                <button type="button" className={styles.clearBtn} onClick={() => { setCityQ(''); setShowCityDrop(false); }} aria-label="Rensa">×</button>
              )}

              {showCityDrop && (
                <div className={styles.dropdown}>
                  <button type="button" className={styles.nearMeBtn} onMouseDown={handleNearMe}>
                    <LocateIcon size={15} />
                    Nära mig
                  </button>
                  {filteredCities.length > 0 && (
                    <>
                      <p className={styles.dropTitle}>Populära</p>
                      {filteredCities.map(c => (
                        <button key={c} type="button" className={styles.dropItem} onMouseDown={() => { setCityQ(c); setShowCityDrop(false); doSearch(serviceQ.trim(), c); scrollToResults(); }}>
                          <MapPinIcon size={14} className={styles.dropItemIcon} />
                          {c}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className={styles.searchBtn} aria-label="Sök">
              <SearchIcon size={18} />
              <span className={styles.searchBtnLabel}>Sök</span>
            </button>
          </form>
        </div>
      </section>

      {/* ── KATEGORIER ── */}
      <section className={styles.kategorier}>
        <div className={styles.katInner}>
          <div className={styles.katHeader}>
            <h2 className={`${styles.katTitle} text-serif`}>Kategorier</h2>
            {isSearchActive && (
              <button type="button" className={styles.clearSearch} onClick={() => { setServiceQ(''); setCityQ(''); }}>
                Rensa sökning ×
              </button>
            )}
          </div>
          <div className={styles.katGrid}>
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className={`${styles.katCard} ${serviceQ === cat.query ? styles.katCardActive : ''}`}
                onClick={() => handleCategoryClick(cat.query)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(cat.query);
                  }
                }}
              >
                <div className={styles.katImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.image} alt={cat.label} className={styles.katImg} loading="lazy" />
                  <div className={styles.katOverlay} />
                </div>
                <span className={styles.katLabel}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER CHIPS + RESULTS ── */}
      <section className={styles.resultsSection} id="results-section">
        <div className={styles.containerNarrow}>

          <div className={styles.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                className={`${styles.chip} ${activeFilter === f.id ? styles.active : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <p>Söker efter salonger...</p>
            </div>
          ) : searchError ? (
            <div className={`${styles.emptyBox} card-premium`}>
              <ScissorsIcon size={44} className={styles.emptyIcon} />
              <h3>Kunde inte nå servern</h3>
              <p>Kontrollera att backend-servern är igång och försök igen.</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className={`${styles.emptyBox} card-premium`}>
              <ScissorsIcon size={44} className={styles.emptyIcon} />
              <h3>Inga salonger hittades</h3>
              <p>Prova att justera din sökning eller välj en annan stad.</p>
            </div>
          ) : (
            <>
              <p className={styles.resultsCount}>{filteredShops.length} salong{filteredShops.length !== 1 ? 'er' : ''} hittades</p>
              <div className={styles.grid}>
                {visible.map((shop, i) => (
                  <Link key={shop._id} href={`/${shop.slug}`} className={styles.card}>
                    <div className={styles.cardImg}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shop.images?.[0] || PLACEHOLDER_IMGS[i % 4]} alt={shop.name} loading="lazy" />
                      {isNew(shop)
                        ? <span className={styles.badge}>NYHET</span>
                        : isPremium(shop)
                        ? <span className={styles.badge}>PREMIUM</span>
                        : null}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <h3 className={`${styles.cardName} text-serif`}>{shop.name}</h3>
                        <div className={styles.rating}>
                          <StarIcon size={13} />
                          <span>{shop.rating?.toFixed(1) || '4.9'}</span>
                        </div>
                      </div>
                      <p className={styles.cardDesc}>{descFor(shop, i)}</p>
                      <div className={styles.cardMeta}>
                        <MapPinIcon size={13} />
                        {shop.address.city.toUpperCase()}
                      </div>
                    </div>
                    <div className={styles.bookCta}>BOKA TID</div>
                  </Link>
                ))}
              </div>

              {!showAll && hasMore && (
                <div className={styles.loadMoreWrap}>
                  <button type="button" className={styles.loadMoreBtn} onClick={() => setShowAll(true)}>
                    Visa fler salonger
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SokPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #ececec', borderTopColor: '#c5a059', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <SokPageInner />
    </Suspense>
  );
}

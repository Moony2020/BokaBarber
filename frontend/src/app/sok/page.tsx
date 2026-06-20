'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';
import styles from './page.module.css';

const SearchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const MapPinIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ScissorsIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" />
    <path d="M8.12 8.12 12 12" />
    <path d="M20 4 12 12" />
    <circle cx="6" cy="18" r="3" />
    <path d="M9.8 14.2 12 12" />
    <path d="M20 20 12 12" />
  </svg>
);

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

const INITIAL_VISIBLE_SHOPS = 3;

const normalizeCityKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  stockholm: { lat: 59.3293, lng: 18.0686 },
  goteborg: { lat: 57.7089, lng: 11.9746 },
  malmo: { lat: 55.605, lng: 13.0038 },
  uppsala: { lat: 59.8586, lng: 17.6389 },
  orebro: { lat: 59.2753, lng: 15.2134 },
};

const isPremiumShop = (shop: ShopResult) =>
  (shop.rating || 0) >= 4.8 || shop.reviewCount >= 15 || shop.name.toLowerCase().includes('royal');

const isNewShop = (shop: ShopResult) => shop.reviewCount > 0 && shop.reviewCount <= 5;

const getShopDescription = (shop: ShopResult, index: number) => {
  const descriptions = [
    'En tidlös oas för den medvetna mannen. Här kombineras hantverk med modern lyx.',
    'Specialister på traditionell knivrakning och klassiska konturer i en maskulin miljö.',
    'Skandinavisk minimalism möter barberartradition. Fokus på hållbara produkter och precision.',
  ];

  const city = normalizeCityKey(shop.address.city);
  if (city.includes('orebro')) return descriptions[1];
  if (city.includes('stockholm')) return descriptions[2];
  return descriptions[index % descriptions.length];
};

const getDistanceKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function SokPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAllShops, setShowAllShops] = useState(false);

  const doSearch = async (q?: string, c?: string) => {
    setLoading(true);
    try {
      const res = await api.searchShops(q || '', c || '');
      if (res.ok) {
        setShops((res.data as { shops: ShopResult[] }).shops || []);
      }
    } catch (error) {
      console.error('Sökfel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialSearchTimer = setTimeout(() => {
      doSearch();
    }, 0);

    return () => clearTimeout(initialSearchTimer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      const resetTimer = setTimeout(() => doSearch('', ''), 150);
      return () => clearTimeout(resetTimer);
    }

    if (trimmedQuery.length < 2) return;

    const searchTimer = setTimeout(() => doSearch(trimmedQuery, ''), 250);
    return () => clearTimeout(searchTimer);
  }, [query]);

  const filteredShops = useMemo(() => {
    const result = [...shops];

    if (activeFilter === 'top') {
      return result.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.reviewCount - a.reviewCount);
    }

    if (activeFilter === 'premium') {
      return result.filter(isPremiumShop);
    }

    if (activeFilter === 'near') {
      if (userCoords) {
        return result.sort((a, b) => {
          const cityA = CITY_COORDINATES[normalizeCityKey(a.address.city)];
          const cityB = CITY_COORDINATES[normalizeCityKey(b.address.city)];
          const distanceA = cityA ? getDistanceKm(userCoords, cityA) : Number.MAX_SAFE_INTEGER;
          const distanceB = cityB ? getDistanceKm(userCoords, cityB) : Number.MAX_SAFE_INTEGER;
          return distanceA - distanceB;
        });
      }

      if (query.trim()) {
        const normalizedQuery = query.trim().toLowerCase();
        return result.sort((a, b) => {
          const aMatch = a.address.city.toLowerCase().includes(normalizedQuery) ? 1 : 0;
          const bMatch = b.address.city.toLowerCase().includes(normalizedQuery) ? 1 : 0;
          return bMatch - aMatch;
        });
      }
    }

    return result;
  }, [activeFilter, query, shops, userCoords]);

  useEffect(() => {
    setShowAllShops(false);
  }, [filteredShops]);

  const visibleShops = showAllShops ? filteredShops : filteredShops.slice(0, INITIAL_VISIBLE_SHOPS);
  const hasMoreShops = filteredShops.length > INITIAL_VISIBLE_SHOPS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query.trim(), '');
  };

  const getPlaceholderImage = (index: number) => {
    const fallbacks = [
      'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512690459411-b0fd1c86b8c8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <div className={`${styles.sokPage} sok-page public-theme animate-fade-in`}>
      <section className={styles.sokHeroPremium}>
        <div className="container">
          <h1 className={`${styles.heroTitlePremium} text-serif`}>Hitta din salong</h1>
          <p className={styles.sokSubtitlePremium}>
            Upptäck de mest exklusiva barbershops i din stad. Skräddarsydd service för den moderna gentlemannen.
          </p>

          <form className={styles.searchContainerPremium} onSubmit={handleSearch}>
            <div className={styles.searchFieldPremium}>
              <MapPinIcon size={20} className={styles.iconAccent} />
              <input
                type="text"
                placeholder="Stad eller salongens namn..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={styles.searchInputPremium}
                aria-label="Sök salong eller stad"
              />
            </div>
            <button type="submit" className={styles.searchSubmitBtn} aria-label="Genomför sökning">
              SÖK <SearchIcon size={16} />
            </button>
          </form>
        </div>
      </section>

      <section className={styles.filtersSection}>
        <div className={styles.containerNarrow}>
          <div className={styles.filterChips}>
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                className={`${styles.chip} ${activeFilter === filter.id ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sokResults}>
        <div className={styles.containerNarrow}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinnerPremium}></div>
              <p>Söker efter exklusiva salonger...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className={`${styles.emptyResultsPremium} card-premium`}>
              <ScissorsIcon size={48} className={styles.iconMuted} />
              <h3>Inga salonger hittades</h3>
              <p>Vi hittade tyvärr inga salonger som matchar din sökning. Prova att justera din sökning eller välj en annan stad.</p>
            </div>
          ) : (
            <>
              <div className={styles.shopGridPremium}>
                {visibleShops.map((shop, index) => (
                  <Link key={shop._id} href={`/${shop.slug}`} className={styles.shopCardPremium}>
                    <div className={styles.shopImageWrapper}>
                      <img src={shop.images?.[0] || getPlaceholderImage(index)} alt={shop.name} loading="lazy" />
                    {isNewShop(shop) ? (
                      <span className={styles.imageBadge}>NYHET</span>
                    ) : isPremiumShop(shop) ? (
                      <span className={styles.imageBadge}>PREMIUM</span>
                    ) : null}
                  </div>

                  <div className={styles.shopCardBody}>
                    <div className={styles.shopCardHeader}>
                      <h3 className={`${styles.shopTitlePremium} text-serif`}>{shop.name}</h3>
                      <div className={styles.shopRatingInline} aria-label={`Betyg: ${shop.rating?.toFixed(1) || '4.9'}`}>
                        <StarIcon size={14} />
                        <span>{shop.rating?.toFixed(1) || '4.9'}</span>
                      </div>
                    </div>

                    <p className={styles.shopDescPremium}>{getShopDescription(shop, index)}</p>

                    <div className={styles.shopCardMeta}>
                      <span className={styles.metaItem}>
                        <MapPinIcon size={13} />
                        {shop.address.city.toUpperCase()}
                      </span>
                    </div>
                  </div>

                    <div className={styles.bookCta}>BOKA TID</div>
                  </Link>
                ))}
              </div>

              {!showAllShops && hasMoreShops ? (
                <div className={styles.loadMoreWrap}>
                  <button type="button" className={styles.loadMoreButton} onClick={() => setShowAllShops(true)}>
                    Visa Fler Salonger
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

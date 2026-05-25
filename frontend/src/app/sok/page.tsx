'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';

interface ShopResult {
  _id: string;
  name: string;
  slug: string;
  address: { street: string; city: string; zipCode: string };
  rating: number;
  reviewCount: number;
}

export default function SokPage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q?: string, c?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchShops(q || '', c || '');
      if (res.ok) {
        setShops((res.data as { shops: ShopResult[] }).shops || []);
      }
    } catch {
      console.error('Sökfel');
    } finally {
      setLoading(false);
    }
  };

  // Load all shops initially
  useEffect(() => { doSearch(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, city);
  };

  return (
    <div className="sok-page animate-fade-in">
      {/* Hero Search Bar */}
      <section className="sok-hero">
        <div className="container">
          <h1>Hitta din salong</h1>
          <p className="sok-subtitle">Sök bland registrerade salonger i hela Sverige</p>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-inputs">
              <div className="search-field">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Sök salong, tjänst eller adress..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="search-field">
                <span className="search-icon">📍</span>
                <input
                  type="text"
                  placeholder="Stad..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn btn-primary search-btn">Sök</button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="sok-results">
        <div className="container">
          {loading && <div className="loading-state">⏳ Söker bland salonger...</div>}

          {!loading && searched && shops.length === 0 && (
            <div className="empty-results">
              <div className="empty-icon">🔍</div>
              <h3>Inga salonger hittades</h3>
              <p>Prova att söka med andra sökord eller en annan stad.</p>
            </div>
          )}

          {!loading && shops.length > 0 && (
            <>
              <p className="results-count">{shops.length} salong{shops.length > 1 ? 'er' : ''} hittade</p>
              <div className="shop-grid">
                {shops.map(shop => (
                  <Link key={shop._id} href={`/${shop.slug}`} className="shop-card card-premium">
                    <div className="shop-card-header">
                      <div className="shop-avatar">💈</div>
                      <div>
                        <h3 className="shop-card-name">{shop.name}</h3>
                        <p className="shop-card-location">📍 {shop.address?.street}, {shop.address?.city}</p>
                      </div>
                    </div>

                    <div className="shop-card-footer">
                      <div className="shop-rating">
                        <span className="star">⭐</span>
                        <span className="rating-val">{shop.rating || 'Ny'}</span>
                        {shop.reviewCount > 0 && <span className="review-count">({shop.reviewCount} omdömen)</span>}
                      </div>
                      <span className="book-link">Boka →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        .sok-page { padding-bottom: 64px; }
        .sok-hero {
          background: linear-gradient(135deg, var(--secondary-hover) 0%, var(--secondary) 100%);
          padding: 64px 0 48px;
          text-align: center;
          color: #f8fafc;
        }
        .sok-hero h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
        .sok-subtitle { color: #94a3b8; font-size: 1.1rem; margin-bottom: 32px; }
        .search-form { max-width: 700px; margin: 0 auto; }
        .search-inputs { display: flex; gap: 12px; background-color: #fff; padding: 8px; border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .search-field { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; }
        .search-field .form-input { padding-left: 42px; border: none; background-color: #f8fafc; color: #1e293b; height: 48px; }
        .search-btn { min-width: 100px; height: 48px; border-radius: var(--radius-md) !important; }
        .sok-results { padding: 48px 0; }
        .results-count { font-weight: 700; color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem; }
        .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .shop-card { display: block; text-decoration: none; color: inherit; transition: transform var(--transition-fast), box-shadow var(--transition-fast); cursor: pointer; }
        .shop-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
        .shop-card-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .shop-avatar { width: 56px; height: 56px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; }
        .shop-card-name { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
        .shop-card-location { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
        .shop-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px; }
        .shop-rating { display: flex; align-items: center; gap: 6px; }
        .rating-val { font-weight: 800; color: var(--text-primary); }
        .review-count { font-size: 0.8rem; color: var(--text-muted); }
        .book-link { color: var(--primary); font-weight: 700; font-size: 0.95rem; }
        .loading-state { text-align: center; padding: 64px; font-size: 1.2rem; color: var(--text-secondary); }
        .empty-results { text-align: center; padding: 64px 20px; }
        .empty-icon { font-size: 3rem; margin-bottom: 16px; }
        .empty-results h3 { font-size: 1.3rem; margin-bottom: 8px; }
        .empty-results p { color: var(--text-muted); }
        @media (max-width: 768px) {
          .search-inputs { flex-direction: column; }
          .shop-grid { grid-template-columns: 1fr; }
          .sok-hero h1 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}

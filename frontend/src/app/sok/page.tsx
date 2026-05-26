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
    } catch (error) {
      console.error('Sökfel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all shops initially
  useEffect(() => {
    doSearch();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, city);
  };

  return (
    <div className="sok-page public-theme animate-fade-in">

      {/* 🌌 HERO SEARCH BAR (DEEP PURPLE CONTAINER) */}
      <section className="sok-hero">
        <div className="container">
          <h1 className="hero-title">Hitta din salong</h1>
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
                  className="search-input-field"
                />
              </div>
              <div className="search-field-divider"></div>
              <div className="search-field">
                <span className="search-icon">📍</span>
                <input
                  type="text"
                  placeholder="Stad..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="search-input-field"
                />
              </div>
              <button type="submit" className="btn btn-primary search-btn">Sök</button>
            </div>
          </form>
        </div>
      </section>

      {/* 💈 RESULTS SECTION */}
      <section className="sok-results">
        <div className="container">

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Söker efter tillgängliga salonger...</p>
            </div>
          )}

          {!loading && searched && shops.length === 0 && (
            <div className="empty-results card-premium">
              <div className="empty-icon">🔍</div>
              <h3>Inga salonger hittades</h3>
              <p>Vi hittade inga salonger som matchar din sökning. Prova med andra sökord eller en annan stad.</p>
            </div>
          )}

          {!loading && shops.length > 0 && (
            <>
              <p className="results-count">
                {shops.length} {shops.length === 1 ? 'salong hittade' : 'salonger hittade'}
              </p>

              <div className="shop-grid">
                {shops.map(shop => (
                  <Link key={shop._id} href={`/${shop.slug}`} className="shop-card card-premium">
                    <div className="shop-card-content">
                      <div className="shop-avatar">💈</div>
                      <div className="shop-card-info">
                        <h3 className="shop-card-name">{shop.name}</h3>
                        <p className="shop-card-location">📍 {shop.address?.street}, {shop.address?.city}</p>
                      </div>
                    </div>

                    <div className="shop-card-divider"></div>

                    <div className="shop-card-footer">
                      <div className="shop-rating">
                        <span className="star">⭐</span>
                        <span className="rating-val">{shop.rating ? shop.rating.toFixed(1) : '4.9'}</span>
                        <span className="review-count">
                          ({shop.reviewCount || 142} {shop.reviewCount === 1 ? 'omdöme' : 'omdömen'})
                        </span>
                      </div>
                      <span className="book-link-serif">Boka →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        .sok-page {
          background-color: var(--bg-primary);
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* 🌌 DEEP PURPLE HERO SEARCH */
        .sok-hero {
          background-color: var(--primary);
          padding: 105px 0 64px 0;
          text-align: center;
          color: #ffffff;
          position: relative;
          box-shadow: 0 4px 30px rgba(45, 0, 77, 0.15);
        }

        .hero-title {
          font-family: var(--font-primary);
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .sok-subtitle {
          color: var(--text-muted);
          font-size: 1.1rem;
          margin-bottom: 36px;
          opacity: 0.9;
        }

        .search-form {
          max-width: 740px;
          margin: 0 auto;
        }

        .search-inputs {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #ffffff;
          padding: 8px;
          border-radius: var(--radius-lg);
          box-shadow: 0 15px 35px rgba(27, 3, 48, 0.2);
          border: 1px solid rgba(197, 160, 89, 0.15);
        }

        .search-field {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-field-divider {
          width: 1px;
          height: 32px;
          background-color: var(--border-color);
        }

        .search-icon {
          position: absolute;
          left: 16px;
          font-size: 1.1rem;
          color: var(--accent);
          pointer-events: none;
        }

        .search-input-field {
          width: 100%;
          padding: 14px 16px 14px 44px;
          font-size: 1rem;
          background: transparent;
          border: none;
          color: var(--text-primary);
          outline: none;
        }

        .search-input-field::placeholder {
          color: var(--text-muted);
          opacity: 0.8;
        }

        .search-btn {
          padding: 14px 36px;
          height: 48px;
          border-radius: var(--radius-md) !important;
          font-weight: 700;
        }

        /* 💈 RESULTS SECTION */
        .sok-results {
          padding: 56px 0;
        }

        .results-count {
          font-family: var(--font-secondary);
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 32px;
        }

        @media (max-width: 768px) {
          .search-inputs {
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            border-radius: var(--radius-md);
          }
          .search-field-divider {
            display: none;
          }
          .search-btn {
            width: 100%;
            height: 52px;
          }
          .shop-grid {
            grid-template-columns: 1fr;
          }
          .hero-title {
            font-size: 2.2rem;
          }
        }

        .shop-card {
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: inherit;
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
        }

        .shop-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-premium);
          border-color: var(--accent);
        }

        .shop-card-content {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }

        .shop-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          border: 1px solid var(--border-color);
        }

        .shop-card-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shop-card-name {
          font-family: var(--font-primary);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .shop-card-location {
          font-size: 0.9rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shop-card-divider {
          height: 1px;
          background-color: var(--border-color);
          width: 100%;
        }

        .shop-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background-color: var(--bg-secondary);
          border-bottom-left-radius: var(--radius-md);
          border-bottom-right-radius: var(--radius-md);
        }

        .shop-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .star {
          color: var(--accent);
        }

        .rating-val {
          color: var(--text-primary);
          font-weight: 700;
        }

        .review-count {
          color: var(--text-muted);
        }

        .book-link-serif {
          font-family: var(--font-primary);
          font-weight: 700;
          color: var(--primary);
          font-size: 1rem;
          transition: transform var(--transition-fast);
        }

        .shop-card:hover .book-link-serif {
          transform: translateX(4px);
        }

        /* ⏳ LOADING STATE & SPINNER */
        .loading-state {
          text-align: center;
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-results {
          text-align: center;
          padding: 80px 48px;
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .empty-results h3 {
          font-size: 1.4rem;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .empty-results p {
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>

    </div>
  );
}

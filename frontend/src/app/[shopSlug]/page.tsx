'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/utils/api';

interface ServiceData {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

interface BarberData {
  _id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

interface ShopData {
  _id: string;
  name: string;
  slug: string;
  address: { street: string; city: string; zipCode: string };
  rating: number;
  reviewCount: number;
}

export default function ShopBookingPage() {
  const params = useParams();
  const slug = params.shopSlug as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  // Real data from backend
  const [shop, setShop] = useState<ShopData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<BarberData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });

  // Load shop data
  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const res = await api.getShopBySlug(slug);
        if (res.ok) {
          const d = res.data as { shop: ShopData; services: ServiceData[]; barbers: BarberData[] };
          setShop(d.shop);
          setServices(d.services || []);
          setBarbers(d.barbers || []);
        } else {
          setError('Salongen hittades inte.');
        }
      } catch {
        setError('Kunde inte ladda salongsinformation.');
      } finally {
        setLoading(false);
      }
    };
    loadShop();
  }, [slug]);

  // Set initial date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Load available slots when barber + date + service change
  const loadSlots = useCallback(async () => {
    if (!shop || !selectedBarber || !selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTime('');
    try {
      const res = await api.getAvailableSlots(
        (shop._id as string).toString(),
        selectedBarber._id,
        selectedDate,
        selectedService._id
      );
      if (res.ok) {
        setSlots((res.data as { slots: string[] }).slots || []);
      }
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [shop, selectedBarber, selectedDate, selectedService]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleSubmitBooking = async () => {
    if (!shop || !selectedService || !selectedBarber || !selectedTime) return;
    setSubmitting(true);

    // Build ISO datetime from date + time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);

    try {
      const res = await api.createBooking({
        shopId: shop._id,
        barberId: selectedBarber._id,
        serviceId: selectedService._id,
        startTime: startDate.toISOString(),
        customerData: customerForm
      });

      if (res.ok) {
        setBookingDone(true);
      } else {
        const msg = (res.data as { error?: string }).error || 'Bokningen misslyckades.';
        setError(msg);
      }
    } catch {
      setError('Nätverksfel vid bokning.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-loading animate-fade-in">
        <div className="spinner">⏳</div>
        <p>Laddar salongsinformation...</p>
        <style jsx>{`
          .booking-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; }
          .spinner { font-size: 3rem; animation: spin 1.5s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="booking-error animate-fade-in">
        <h2>⚠️ {error}</h2>
        <p>Kontrollera att webbadressen är korrekt eller <a href="/sok">sök efter salonger</a>.</p>
        <style jsx>{`
          .booking-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; gap: 12px; }
          .booking-error a { color: var(--primary); font-weight: 700; }
        `}</style>
      </div>
    );
  }

  if (bookingDone) {
    return (
      <div className="booking-success animate-fade-in">
        <div className="success-icon">✅</div>
        <h2>Bokning bekräftad!</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Din bokning hos <strong>{shop?.name}</strong> har registrerats.
        </p>
        <div className="confirmation-details card-premium">
          <div className="detail-row"><span>Tjänst:</span><strong>{selectedService?.name}</strong></div>
          <div className="detail-row"><span>Frisör:</span><strong>{selectedBarber?.name}</strong></div>
          <div className="detail-row"><span>Datum:</span><strong>{new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          <div className="detail-row"><span>Tid:</span><strong>Kl. {selectedTime}</strong></div>
          <div className="detail-row"><span>Pris:</span><strong>{selectedService?.price} kr</strong></div>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Betalning sker i salongen.</p>
        <style jsx>{`
          .booking-success { display: flex; flex-direction: column; align-items: center; padding: 64px 20px; text-align: center; }
          .success-icon { font-size: 4rem; margin-bottom: 16px; }
          .confirmation-details { max-width: 400px; width: 100%; text-align: left; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
          .detail-row span { color: var(--text-muted); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="booking-page animate-fade-in">
      {/* Shop Header */}
      <section className="shop-header">
        <div className="container">
          <div className="shop-header-inner">
            <div className="shop-avatar-lg">💈</div>
            <div>
              <h1>{shop?.name}</h1>
              <p className="shop-location">📍 {shop?.address?.street}, {shop?.address?.city}</p>
              {(shop?.rating || 0) > 0 && (
                <div className="shop-rating-lg">
                  <span>⭐ {shop?.rating}</span>
                  <span className="review-ct">({shop?.reviewCount} omdömen)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="progress-bar-section">
        <div className="container">
          <div className="step-indicators">
            {['Tjänst', 'Frisör', 'Tid', 'Uppgifter', 'Bekräfta'].map((label, i) => (
              <div key={label} className={`step-dot ${step >= i + 1 ? 'active' : ''} ${step === i + 1 ? 'current' : ''}`}>
                <span className="dot">{step > i + 1 ? '✓' : i + 1}</span>
                <span className="step-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Wizard */}
      <section className="booking-wizard">
        <div className="container">
          {error && <div className="error-banner">⚠️ {error} <button onClick={() => setError('')}>×</button></div>}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="wizard-step">
              <h2>Välj tjänst</h2>
              {services.length === 0 ? (
                <div className="empty-state">Denna salong har inga aktiva tjänster ännu.</div>
              ) : (
                <div className="service-grid">
                  {services.map(s => (
                    <button
                      key={s._id}
                      onClick={() => { setSelectedService(s); setStep(2); }}
                      className={`service-card card-premium ${selectedService?._id === s._id ? 'selected' : ''}`}
                    >
                      <h3>{s.name}</h3>
                      {s.description && <p className="svc-desc">{s.description}</p>}
                      <div className="svc-meta">
                        <span>⏳ {s.durationMinutes} min</span>
                        <span className="svc-price">{s.price} kr</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Barber */}
          {step === 2 && (
            <div className="wizard-step">
              <h2>Välj frisör</h2>
              {barbers.length === 0 ? (
                <div className="empty-state">Inga frisörer tillgängliga just nu.</div>
              ) : (
                <div className="barber-grid">
                  {barbers.map(b => (
                    <button
                      key={b._id}
                      onClick={() => { setSelectedBarber(b); setStep(3); }}
                      className={`barber-card card-premium ${selectedBarber?._id === b._id ? 'selected' : ''}`}
                    >
                      <div className="barber-avatar">{b.avatar ? <img src={b.avatar} alt={b.name} /> : '✂️'}</div>
                      <h3>{b.name}</h3>
                      {b.bio && <p className="barber-bio">{b.bio}</p>}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setStep(1)} className="btn btn-secondary back-btn">← Tillbaka</button>
            </div>
          )}

          {/* STEP 3: Select Date & Time */}
          {step === 3 && (
            <div className="wizard-step">
              <h2>Välj datum & tid</h2>
              <div className="datetime-picker">
                <div className="form-group">
                  <label className="form-label">Datum</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="slots-section">
                  <label className="form-label">Lediga tider</label>
                  {slotsLoading && <p className="slots-loading">⏳ Söker lediga tider...</p>}
                  {!slotsLoading && slots.length === 0 && selectedDate && (
                    <div className="no-slots">Inga lediga tider detta datum. Prova ett annat datum.</div>
                  )}
                  {!slotsLoading && slots.length > 0 && (
                    <div className="time-grid">
                      {slots.map(time => (
                        <button
                          key={time}
                          className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="wizard-actions">
                <button onClick={() => setStep(2)} className="btn btn-secondary">← Tillbaka</button>
                <button onClick={() => setStep(4)} className="btn btn-primary" disabled={!selectedTime}>Nästa →</button>
              </div>
            </div>
          )}

          {/* STEP 4: Customer Details */}
          {step === 4 && (
            <div className="wizard-step">
              <h2>Dina uppgifter</h2>
              <form className="customer-form" onSubmit={e => { e.preventDefault(); setStep(5); }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Förnamn*</label><input type="text" required value={customerForm.firstName} onChange={e => setCustomerForm({ ...customerForm, firstName: e.target.value })} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Efternamn*</label><input type="text" required value={customerForm.lastName} onChange={e => setCustomerForm({ ...customerForm, lastName: e.target.value })} className="form-input" /></div>
                </div>
                <div className="form-group"><label className="form-label">E-postadress*</label><input type="email" required value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Telefonnummer*</label><input type="tel" required value={customerForm.phoneNumber} onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })} className="form-input" /></div>
                <div className="wizard-actions">
                  <button type="button" onClick={() => setStep(3)} className="btn btn-secondary">← Tillbaka</button>
                  <button type="submit" className="btn btn-primary">Nästa →</button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div className="wizard-step">
              <h2>Bekräfta bokning</h2>
              <div className="booking-summary card-premium">
                <div className="summary-row"><span>Salong</span><strong>{shop?.name}</strong></div>
                <div className="summary-row"><span>Tjänst</span><strong>{selectedService?.name}</strong></div>
                <div className="summary-row"><span>Frisör</span><strong>{selectedBarber?.name}</strong></div>
                <div className="summary-row"><span>Datum</span><strong>{new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div className="summary-row"><span>Tid</span><strong>Kl. {selectedTime}</strong></div>
                <div className="summary-row"><span>Kund</span><strong>{customerForm.firstName} {customerForm.lastName}</strong></div>
                <div className="summary-row total"><span>Totalt att betala</span><strong>{selectedService?.price} kr</strong></div>
                <p className="payment-note">💰 Betalning sker i salongen.</p>
              </div>
              <div className="wizard-actions">
                <button onClick={() => setStep(4)} className="btn btn-secondary">← Tillbaka</button>
                <button onClick={handleSubmitBooking} disabled={submitting} className="btn btn-primary btn-lg">
                  {submitting ? '⏳ Bokar...' : '✅ Boka nu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .shop-header { background: linear-gradient(135deg, var(--secondary-hover) 0%, var(--secondary) 100%); padding: 48px 0; color: #f8fafc; }
        .shop-header-inner { display: flex; align-items: center; gap: 24px; }
        .shop-avatar-lg { width: 80px; height: 80px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; flex-shrink: 0; }
        .shop-header h1 { font-size: 2rem; margin-bottom: 4px; }
        .shop-location { color: #94a3b8; font-size: 1rem; }
        .shop-rating-lg { margin-top: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; }
        .review-ct { color: #94a3b8; font-weight: 400; font-size: 0.9rem; }
        .progress-bar-section { background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-color); padding: 20px 0; }
        .step-indicators { display: flex; justify-content: center; gap: 36px; }
        .step-dot { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.4; transition: opacity var(--transition-fast); }
        .step-dot.active { opacity: 1; }
        .step-dot.current .dot { background-color: var(--primary); color: #fff; transform: scale(1.1); }
        .dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; background-color: var(--bg-tertiary); color: var(--text-secondary); transition: all var(--transition-fast); }
        .step-dot.active .dot { background-color: var(--color-success); color: #fff; }
        .step-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
        .booking-wizard { padding: 48px 0 80px; }
        .wizard-step h2 { font-size: 1.5rem; margin-bottom: 24px; }
        .service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .service-card { cursor: pointer; transition: all var(--transition-fast); border: 2px solid transparent; text-align: left; background: var(--bg-secondary); }
        .service-card:hover, .service-card.selected { border-color: var(--primary); transform: translateY(-2px); }
        .service-card h3 { font-size: 1.1rem; margin-bottom: 8px; }
        .svc-desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }
        .svc-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: var(--text-secondary); }
        .svc-price { font-weight: 800; color: var(--primary); font-size: 1.15rem; }
        .barber-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .barber-card { cursor: pointer; text-align: center; border: 2px solid transparent; transition: all var(--transition-fast); }
        .barber-card:hover, .barber-card.selected { border-color: var(--primary); transform: translateY(-2px); }
        .barber-avatar { width: 64px; height: 64px; border-radius: 50%; background-color: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 12px; }
        .barber-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .barber-card h3 { font-size: 1rem; }
        .barber-bio { font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; }
        .datetime-picker { max-width: 600px; }
        .slots-section { margin-top: 24px; }
        .slots-loading { color: var(--text-muted); padding: 20px; }
        .no-slots { padding: 24px; background: var(--bg-tertiary); border-radius: var(--radius-md); color: var(--text-muted); text-align: center; }
        .time-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-top: 12px; }
        .time-slot { padding: 12px; text-align: center; border: 2px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-secondary); cursor: pointer; font-weight: 700; font-size: 0.95rem; transition: all var(--transition-fast); }
        .time-slot:hover { border-color: var(--primary); }
        .time-slot.selected { background-color: var(--primary); color: #fff; border-color: var(--primary); }
        .customer-form { max-width: 500px; display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .wizard-actions { display: flex; gap: 16px; margin-top: 32px; }
        .back-btn { margin-top: 24px; }
        .booking-summary { max-width: 500px; }
        .summary-row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border-color); }
        .summary-row span { color: var(--text-muted); }
        .summary-row.total { border-bottom: none; padding-top: 20px; }
        .summary-row.total strong { font-size: 1.3rem; color: var(--primary); }
        .payment-note { margin-top: 16px; color: var(--text-muted); font-size: 0.9rem; }
        .error-banner { background-color: #fee2e2; color: var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-weight: 600; }
        .error-banner button { background: none; border: none; color: var(--color-danger); font-size: 1.2rem; cursor: pointer; }
        .empty-state { text-align: center; padding: 40px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted); }
        @media (max-width: 768px) {
          .shop-header-inner { flex-direction: column; text-align: center; }
          .step-indicators { gap: 16px; }
          .step-label { display: none; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

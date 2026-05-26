'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
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
  const [statusFlag, setStatusFlag] = useState<'ready' | 'not_ready' | 'suspended'>('ready');

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<BarberData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [upcomingTimes, setUpcomingTimes] = useState<{ label: string; date: string; time: string }[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  // Load shop data
  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const res = await api.getShopBySlug(slug);
        if (res.ok) {
          const d = res.data as { shop: ShopData; services: ServiceData[]; barbers: BarberData[]; statusFlag: 'ready' | 'not_ready' | 'suspended' };
          setShop(d.shop);
          setServices(d.services || []);
          setBarbers(d.barbers || []);
          setStatusFlag(d.statusFlag || 'ready');
        } else {
          setError('Salongen hittades inte.');
        }
      } catch (err) {
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

  // Fetch upcoming quick slots for today and tomorrow dynamically
  useEffect(() => {
    const fetchUpcomingTimes = async () => {
      if (!shop || services.length === 0 || barbers.length === 0) return;
      setUpcomingLoading(true);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const defaultService = services[0];
      const defaultBarber = barbers[0];
      
      const timesList: { label: string; date: string; time: string }[] = [];
      
      try {
        // Fetch today
        const resToday = await api.getAvailableSlots(shop._id, defaultBarber._id, todayStr, defaultService._id);
        if (resToday.ok) {
          const slotsToday = (resToday.data as { slots: string[] }).slots || [];
          const now = new Date();
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          
          const futureSlots = slotsToday.filter(s => {
            const [h, m] = s.split(':').map(Number);
            return h > currentHour || (h === currentHour && m > currentMin);
          });
          
          if (futureSlots.length > 0) {
            timesList.push({
              label: `Idag, ${futureSlots[0]}`,
              date: todayStr,
              time: futureSlots[0]
            });
          }
        }
        
        // Fetch tomorrow
        const resTomorrow = await api.getAvailableSlots(shop._id, defaultBarber._id, tomorrowStr, defaultService._id);
        if (resTomorrow.ok) {
          const slotsTomorrow = (resTomorrow.data as { slots: string[] }).slots || [];
          if (slotsTomorrow.length > 0) {
            timesList.push({
              label: `Imorgon, ${slotsTomorrow[0]}`,
              date: tomorrowStr,
              time: slotsTomorrow[0]
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch upcoming quick slots', err);
      } finally {
        setUpcomingTimes(timesList);
        setUpcomingLoading(false);
      }
    };
    
    if (shop && services.length > 0 && barbers.length > 0) {
      fetchUpcomingTimes();
    }
  }, [shop, services, barbers]);

  const handleQuickBook = (date: string, time: string) => {
    if (services.length === 0 || barbers.length === 0) return;
    const defaultService = services[0];
    const defaultBarber = barbers[0];
    
    setSelectedService(defaultService);
    setSelectedBarber(defaultBarber);
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(4); // Move directly to step 4 (Dina uppgifter)!
  };

  // Load available slots when barber + date + service change
  const loadSlots = useCallback(async () => {
    if (step !== 3) return;
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
  }, [shop, selectedBarber, selectedDate, selectedService, step]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSubmitBooking = async () => {
    if (!shop || !selectedService || !selectedBarber || !selectedTime) return;
    setSubmitting(true);

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

  // Get service icon dynamically
  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('skägg') || n.includes('skäggtrim') || n.includes('rakning')) return '🧔';
    if (n.includes('fade') || n.includes('sidor')) return '💈';
    if (n.includes('färg') || n.includes('slingor')) return '🎨';
    return '✂️';
  };

  if (loading) {
    return (
      <div className="booking-loading public-theme animate-fade-in">
        <div className="spinner"></div>
        <p>Laddar salongsinformation...</p>
        <style jsx>{`
          .booking-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; gap: 16px; background-color: var(--bg-primary); }
          .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <h2>⚠️ {error}</h2>
        <p>Kontrollera att webbadressen är korrekt eller sök efter andra salonger.</p>
        <Link href="/sok" className="btn btn-primary" style={{ marginTop: '24px' }}>
          Sök salonger
        </Link>
        <style jsx>{`
          .booking-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; gap: 12px; background-color: var(--bg-primary); padding: 24px; }
          .booking-error h2 { font-family: var(--font-primary); font-size: 2rem; color: var(--primary); }
          .booking-error p { color: var(--text-secondary); }
        `}</style>
      </div>
    );
  }

  if (statusFlag === 'suspended') {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <h2>Denna salong tar inte emot bokningar just nu</h2>
        <p>Återkom gärna vid ett senare tillfälle eller sök efter andra salonger.</p>
        <Link href="/sok" className="btn btn-primary" style={{ marginTop: '24px' }}>
          Sök salonger
        </Link>
        <style jsx>{`
          .booking-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; gap: 12px; background-color: var(--bg-primary); padding: 24px; }
          .booking-error h2 { font-family: var(--font-primary); font-size: 2rem; color: var(--primary); }
          .booking-error p { color: var(--text-secondary); }
        `}</style>
      </div>
    );
  }

  if (statusFlag === 'not_ready') {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <h2>Denna salong är inte redo att ta emot bokningar ännu</h2>
        <p>Administratören håller på att ställa in salongen. Sök efter andra salonger.</p>
        <Link href="/sok" className="btn btn-primary" style={{ marginTop: '24px' }}>
          Sök salonger
        </Link>
        <style jsx>{`
          .booking-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; gap: 12px; background-color: var(--bg-primary); padding: 24px; }
          .booking-error h2 { font-family: var(--font-primary); font-size: 2rem; color: var(--primary); }
          .booking-error p { color: var(--text-secondary); }
        `}</style>
      </div>
    );
  }

  if (bookingDone) {
    return (
      <div className="booking-success public-theme animate-fade-in">
        <div className="success-icon">✅</div>
        <h2>Bokning bekräftad!</h2>
        <p className="success-subtitle">
          Din bokning hos <strong>{shop?.name}</strong> har registrerats. Välkommen!
        </p>
        <div className="confirmation-details card-premium">
          <div className="detail-row"><span>Tjänst:</span><strong>{selectedService?.name}</strong></div>
          <div className="detail-row"><span>Frisör:</span><strong>{selectedBarber?.name}</strong></div>
          <div className="detail-row"><span>Datum:</span><strong>{new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          <div className="detail-row"><span>Tid:</span><strong>Kl. {selectedTime}</strong></div>
          <div className="detail-row"><span>Pris:</span><strong>{selectedService?.price} kr</strong></div>
        </div>
        <p className="payment-note">💰 Betalning sker på plats i salongen.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '32px' }}>
          Tillbaka till startsidan
        </Link>
        <style jsx>{`
          .booking-success { display: flex; flex-direction: column; align-items: center; padding: 80px 24px; text-align: center; background-color: var(--bg-primary); min-height: 100vh; }
          .success-icon { font-size: 4rem; margin-bottom: 20px; }
          .booking-success h2 { font-family: var(--font-primary); font-size: 2.4rem; color: var(--primary); margin-bottom: 12px; }
          .success-subtitle { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 32px; }
          .confirmation-details { max-width: 440px; width: 100%; text-align: left; background-color: #ffffff; padding: 32px; }
          .detail-row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border-color); }
          .detail-row:last-child { border-bottom: none; }
          .detail-row span { color: var(--text-secondary); }
          .payment-note { margin-top: 24px; color: var(--text-muted); font-size: 0.95rem; }
        `}</style>
      </div>
    );
  }

  // Identify featured main service (e.g. Signaturritualen, or first service)
  const featuredService = services.find(s => s.name.toLowerCase().includes('ritual') || s.name.toLowerCase().includes('deluxe')) || services[0];
  const normalServices = services.filter(s => s._id !== featuredService?._id);

  return (
    <div className="booking-page public-theme animate-fade-in">
      <div className="container">

        {/* 👑 HEADER SECTION */}
        <section className="booking-header text-center">
          <h1 className="booking-title">Boka Din Ritual</h1>
          <p className="booking-subtitle">Välj den tjänst som passar din stil bäst</p>
        </section>

        {/* 🗺️ STEPS NAVIGATION BAR */}
        <section className="stepper-section">
          <div className="stepper-line">
            <div className="stepper-progress-fill" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
          </div>
          <div className="stepper-dots">
            {['Tjänst', 'Tid & Dag', 'Uppgifter', 'Bekräftelse'].map((lbl, idx) => {
              const stepMap = [1, 3, 4, 5]; // maps visual step indicator to structural wizard step
              const stepValue = idx + 1;
              const actualStep = stepMap[idx];
              const isActive = step >= actualStep;
              return (
                <div key={lbl} className={`step-item ${isActive ? 'active' : ''}`}>
                  <div className="step-number-circle">{stepValue}</div>
                  <span className="step-label">{lbl}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 🧙 BOOKING STEP WIZARD CONTAINER */}
        <div className="booking-layout">
          <div className="booking-main-content">
            {error && <div className="error-banner">⚠️ {error} <button onClick={() => setError('')} className="close-err">×</button></div>}

            {/* STEP 1: SELECT SERVICE */}
            {step === 1 && (
              <div className="step-services animate-fade-in">

                {/* Featured Big Service Card (e.g. Signaturritualen) */}
                {featuredService && (
                  <div className="featured-service-card">
                    <div className="featured-img-box">
                      <span className="featured-badge">PREMIUM</span>
                    </div>
                    <div className="featured-details">
                      <h3 className="featured-name">{featuredService.name}</h3>
                      <p className="featured-desc">
                        {featuredService.description || 'En komplett upplevelse som inkluderar precisionsklippning, varm handduksrakning, ansiktsmassage och en uppfriskande tvätt. För gentlemannen som värdesätter det lilla extra.'}
                      </p>
                      <div className="featured-footer">
                        <span className="featured-duration">Längd: {featuredService.durationMinutes} min</span>
                        <div className="featured-price-action">
                          <span className="featured-price">{featuredService.price} kr</span>
                          <button
                            onClick={() => { setSelectedService(featuredService); setStep(2); }}
                            className="btn btn-primary"
                          >
                            Välj
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Normal Services Grid */}
                {normalServices.length > 0 && (
                  <div className="services-subgrid" style={{ marginTop: '32px' }}>
                    {normalServices.map(s => (
                      <div key={s._id} className="card-premium service-item-card">
                        <div className="service-card-top">
                          <span className="service-icon-lilac">{getServiceIcon(s.name)}</span>
                          <span className="service-duration-badge">{s.durationMinutes} min</span>
                        </div>
                        <h3 className="service-card-title">{s.name}</h3>
                        <p className="service-card-desc">{s.description || 'Professionell behandling anpassad efter dina behov och önskemål.'}</p>
                        <div className="service-card-bottom">
                          <span className="service-card-price">{s.price} kr</span>
                          <button
                            onClick={() => { setSelectedService(s); setStep(2); }}
                            className="btn btn-primary btn-sm-gold"
                          >
                            Boka
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {services.length === 0 && (
                  <div className="empty-state card-premium">Denna salong har inga tjänster tillgängliga just nu.</div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT BARBER */}
            {step === 2 && (
              <div className="step-barbers animate-fade-in">
                <h2 className="step-title">Välj frisör / barberare</h2>
                {barbers.length === 0 ? (
                  <div className="empty-state card-premium">Inga frisörer tillgängliga just nu.</div>
                ) : (
                  <div className="barbers-grid">
                    {barbers.map(b => (
                      <div key={b._id} className="card-premium barber-item-card text-center">
                        <div className="barber-avatar-box">
                          {b.avatar ? <img src={b.avatar} alt={b.name} /> : '🧔'}
                        </div>
                        <h3 className="barber-name-serif">{b.name}</h3>
                        <p className="barber-bio-text">{b.bio || 'Professionell barberare dedikerad till förstklassigt hantverk.'}</p>
                        <button
                          onClick={() => { setSelectedBarber(b); setStep(3); }}
                          className="btn btn-primary"
                          style={{ marginTop: '16px', width: '100%' }}
                        >
                          Välj {b.name.split(' ')[0]}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setStep(1)} className="btn btn-outline back-btn-nav">← Tillbaka till tjänster</button>
              </div>
            )}

            {/* STEP 3: DATE & TIME SELECTOR */}
            {step === 3 && (
              <div className="step-datetime animate-fade-in">
                <h2 className="step-title">Välj datum & tid</h2>
                <div className="datetime-flex">
                  <div className="form-group date-picker-group">
                    <label className="form-label">Datum</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="form-input date-input-field"
                    />
                  </div>

                  <div className="slots-section">
                    <label className="form-label">Lediga tider hos {selectedBarber?.name}</label>
                    {slotsLoading && <div className="slots-loading">Söker efter lediga tider...</div>}
                    {!slotsLoading && slots.length === 0 && selectedDate && (
                      <div className="no-slots">Inga lediga tider detta datum. Prova ett annat datum eller en annan barberare.</div>
                    )}
                    {!slotsLoading && slots.length > 0 && (
                      <div className="time-slots-grid">
                        {slots.map(time => (
                          <button
                            key={time}
                            className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
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
                  <button onClick={() => setStep(2)} className="btn btn-outline">← Tillbaka</button>
                  <button onClick={() => setStep(4)} className="btn btn-primary" disabled={!selectedTime}>Gå vidare →</button>
                </div>
              </div>
            )}

            {/* STEP 4: CUSTOMER DETAILS FORM */}
            {step === 4 && (
              <div className="step-details animate-fade-in">
                <h2 className="step-title">Dina uppgifter</h2>
                <form className="customer-details-form" onSubmit={e => { e.preventDefault(); setStep(5); }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Förnamn*</label>
                      <input
                        type="text"
                        required
                        value={customerForm.firstName}
                        onChange={e => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Efternamn*</label>
                      <input
                        type="text"
                        required
                        value={customerForm.lastName}
                        onChange={e => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-postadress*</label>
                    <input
                      type="email"
                      required
                      value={customerForm.email}
                      onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefonnummer*</label>
                    <input
                      type="tel"
                      required
                      value={customerForm.phoneNumber}
                      onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="wizard-actions">
                    <button type="button" onClick={() => setStep(3)} className="btn btn-outline">← Tillbaka</button>
                    <button type="submit" className="btn btn-primary">Bekräfta uppgifter →</button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 5: FINAL CONFIRMATION */}
            {step === 5 && (
              <div className="step-confirm animate-fade-in">
                <h2 className="step-title">Bekräfta din bokning</h2>

                <div className="booking-summary-invoice card-premium">
                  <div className="summary-headline">Bokningsöversikt</div>
                  <div className="invoice-row"><span>Salong</span><strong>{shop?.name}</strong></div>
                  <div className="invoice-row"><span>Tjänst</span><strong>{selectedService?.name}</strong></div>
                  <div className="invoice-row"><span>Barberare</span><strong>{selectedBarber?.name}</strong></div>
                  <div className="invoice-row">
                    <span>Datum & Tid</span>
                    <strong>
                      {new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} kl. {selectedTime}
                    </strong>
                  </div>
                  <div className="invoice-row"><span>Kund</span><strong>{customerForm.firstName} {customerForm.lastName}</strong></div>

                  <div className="invoice-divider"></div>

                  <div className="invoice-row total-row">
                    <span>Totalt att betala</span>
                    <strong className="text-gold-price">{selectedService?.price} kr</strong>
                  </div>
                  <p className="invoice-note">💰 Betalning sker tryggt på plats efter din behandling.</p>
                </div>

                <div className="wizard-actions" style={{ marginTop: '32px' }}>
                  <button onClick={() => setStep(4)} className="btn btn-outline">← Ändra uppgifter</button>
                  <button onClick={handleSubmitBooking} disabled={submitting} className="btn btn-primary btn-lg-gold">
                    {submitting ? 'Bokar din ritual...' : 'Boka nu'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 🛡️ RIGHT SIDEBAR (VARFÖR OSS? & TIDSLOTTS) */}
          <div className="booking-sidebar">
            <div className="sidebar-card dashed-gold-card">
              <div className="sidebar-title-row">
                <span className="sidebar-gold-icon">⭐</span>
                <h4>Varför oss?</h4>
              </div>
              <ul className="sidebar-benefits-list">
                <li>
                  <span className="benefit-checkmark">✓</span>
                  Mästarklassade barberare med års erfarenhet.
                </li>
                <li>
                  <span className="benefit-checkmark">✓</span>
                  Premiumprodukter från exklusiva märken.
                </li>
                <li>
                  <span className="benefit-checkmark">✓</span>
                  En oas av lugn mitt i stadens brus.
                </li>
              </ul>
            </div>

            <div className="sidebar-card regular-sidebar-card">
              <h4>Kommande tider</h4>
              {upcomingLoading && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Söker tider...</div>}
              {!upcomingLoading && upcomingTimes.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>Inga lediga tider idag eller imorgon.</div>
              )}
              {!upcomingLoading && upcomingTimes.length > 0 && (
                <div className="upcoming-times-list">
                  {upcomingTimes.map((item, idx) => (
                    <button
                      key={idx}
                      className="upcoming-time-item"
                      onClick={() => handleQuickBook(item.date, item.time)}
                      style={{ width: '100%', outline: 'none', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{item.label}</span>
                      <span className="upcoming-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .booking-page {
          background-color: var(--bg-primary);
          min-height: 100vh;
          padding: 60px 0 100px 0;
        }

        /* 👑 HEADER */
        .booking-header {
          margin-bottom: 40px;
        }

        .booking-title {
          font-family: var(--font-primary);
          font-size: 2.8rem;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .booking-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        /* 🗺️ STEPS PROGRESS BAR */
        .stepper-section {
          max-width: 600px;
          margin: 0 auto 56px auto;
          position: relative;
        }

        .stepper-line {
          position: absolute;
          top: 18px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--border-color);
          z-index: 1;
        }

        .stepper-progress-fill {
          height: 100%;
          background-color: var(--primary);
          transition: width var(--transition-normal);
        }

        .stepper-dots {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 2px solid var(--border-color);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all var(--transition-normal);
        }

        .step-item.active .step-number-circle {
          background-color: var(--primary);
          border-color: var(--primary);
          color: #ffffff;
        }

        .step-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          transition: color var(--transition-normal);
        }

        .step-item.active .step-label {
          color: var(--primary);
        }

        /* 🧙 WIZARD LAYOUT */
        .booking-layout {
          display: grid;
          grid-template-columns: 1.5fr 0.8fr;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .booking-layout {
            grid-template-columns: 1fr;
          }
        }

        .booking-main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* FEATURED MAIN SERVICE CARD (SIGNATURRITUALEN) */
        .featured-service-card {
          display: flex;
          background-color: #ffffff;
          border: 1px solid var(--accent);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        @media (max-width: 768px) {
          .featured-service-card {
            flex-direction: column;
          }
        }

        .featured-img-box {
          width: 220px;
          background-image: url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400');
          background-size: cover;
          background-position: center;
          position: relative;
          min-height: 200px;
        }

        @media (max-width: 768px) {
          .featured-img-box {
            width: 100%;
            height: 180px;
          }
        }

        .featured-badge {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background-color: var(--primary);
          color: white;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .featured-details {
          flex: 1;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .featured-name {
          font-family: var(--font-primary);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .featured-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .featured-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .featured-duration {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent);
        }

        .featured-price-action {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .featured-price {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--primary);
        }

        /* SERVICES SUBGRID */
        .services-subgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .service-item-card {
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          padding: 24px;
          height: 100%;
        }

        .service-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .service-icon-lilac {
          width: 40px;
          height: 40px;
          background-color: var(--primary-light);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .service-duration-badge {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .service-card-title {
          font-family: var(--font-primary);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .service-card-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
          flex-grow: 1;
        }

        .service-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .service-card-price {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--primary);
        }

        .btn-sm-gold {
          padding: 8px 16px;
          font-size: 0.85rem;
        }

        /* STEP titles */
        .step-title {
          font-family: var(--font-primary);
          font-size: 1.8rem;
          color: var(--primary);
          margin-bottom: 24px;
        }

        /* BARBER SELECT GRID */
        .barbers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }

        .barber-item-card {
          background-color: #ffffff;
          padding: 32px 24px;
        }

        .barber-avatar-box {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          margin: 0 auto 16px auto;
          overflow: hidden;
        }

        .barber-avatar-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .barber-name-serif {
          font-family: var(--font-primary);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .barber-bio-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .back-btn-nav {
          margin-top: 32px;
          border-width: 1px;
        }

        /* DATETIME STEP */
        .datetime-flex {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 600px;
        }

        .date-picker-group {
          max-width: 320px;
        }

        .date-input-field {
          height: 48px;
        }

        .slots-loading {
          color: var(--text-muted);
          padding: 16px 0;
          font-weight: 600;
        }

        .no-slots {
          padding: 24px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          border: 1px dashed var(--border-color);
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .time-slot-btn {
          padding: 12px;
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .time-slot-btn:hover {
          border-color: var(--accent);
          background-color: var(--bg-primary);
        }

        .time-slot-btn.selected {
          background: var(--accent-gradient);
          color: white;
          border-color: var(--accent);
          box-shadow: 0 4px 12px rgba(197, 160, 89, 0.3);
        }

        /* CUSTOMER FORM */
        .customer-details-form {
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .customer-details-form .form-group {
          margin-bottom: 0px;
          gap: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .wizard-actions {
          display: flex;
          gap: 16px;
          margin-top: 20px;
        }

        /* CONFIRMATION INVOICE */
        .booking-summary-invoice {
          max-width: 520px;
          background-color: #ffffff;
          padding: 40px;
          display: flex;
          flex-direction: column;
        }

        .summary-headline {
          font-family: var(--font-primary);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          border-bottom: 2px solid var(--accent);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--bg-tertiary);
          font-size: 0.95rem;
        }

        .invoice-row span {
          color: var(--text-secondary);
        }

        .invoice-row strong {
          color: var(--text-primary);
        }

        .invoice-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 20px 0;
        }

        .total-row {
          border-bottom: none;
          padding: 10px 0;
        }

        .total-row span {
          font-weight: 700;
          color: var(--text-primary);
        }

        .text-gold-price {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent) !important;
        }

        .invoice-note {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 16px;
        }

        .btn-lg-gold {
          padding: 16px 36px;
          font-size: 1.05rem;
        }

        /* 🛡️ SIDEBAR */
        .booking-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sidebar-card {
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .dashed-gold-card {
          border: 1px dashed var(--accent);
          background-color: rgba(245, 242, 235, 0.25);
        }

        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .sidebar-gold-icon {
          color: var(--accent);
        }

        .sidebar-card h4 {
          font-family: var(--font-primary);
          font-size: 1.15rem;
          color: var(--primary);
          font-weight: 700;
        }

        .sidebar-benefits-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-benefits-list li {
          font-size: 0.9rem;
          color: var(--text-secondary);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.4;
        }

        .benefit-checkmark {
          color: var(--accent);
          font-weight: bold;
        }

        .upcoming-times-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .upcoming-time-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .upcoming-time-item:hover {
          background-color: var(--primary-light) !important;
          border-color: var(--accent) !important;
          color: var(--primary) !important;
          transform: translateY(-1px);
        }

        .upcoming-arrow {
          color: var(--accent);
        }

        /* OTHERS */
        .error-banner {
          background-color: #fee2e2;
          color: var(--color-danger);
          padding: 14px 20px;
          border-radius: var(--radius-sm);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .close-err {
          background: none;
          color: var(--color-danger);
          font-size: 1.3rem;
          cursor: pointer;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }
      `}</style>

    </div>
  );
}

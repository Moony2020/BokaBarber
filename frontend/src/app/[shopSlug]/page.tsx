'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface BookingConfirmationData {
  shopSlug: string;
  shopName: string;
  shopAddress: string;
  service: ServiceData;
  barber: BarberData;
  date: string;
  time: string;
  customerForm: CustomerFormData;
  acceptedPaymentMethods?: ('swish' | 'card' | 'cash')[];
}

interface PersistedBookingState {
  shopSlug: string;
  step: number;
  bookingDone: boolean;
  selectedService: ServiceData | null;
  selectedBarber: BarberData | null;
  selectedDate: string;
  selectedTime: string;
  customerForm: CustomerFormData;
  confirmationData: BookingConfirmationData | null;
}

const INITIAL_CUSTOMER_FORM: CustomerFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

const getBookingStorageKey = (slug: string) => `booking-flow:${slug}`;

const formatShopAddress = (address?: ShopData['address']) => {
  if (!address) return '';
  return [address.street, `${address.zipCode} ${address.city}`].filter(Boolean).join(', ');
};

const formatBookingDate = (date: string) => new Date(date).toLocaleDateString('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatTimeRange = (date: string, time: string, durationMinutes: number) => {
  if (!date || !time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const endHours = `${end.getHours()}`.padStart(2, '0');
  const endMinutes = `${end.getMinutes()}`.padStart(2, '0');
  return `Kl. ${time} - ${endHours}:${endMinutes}`;
};

const formatPaymentMethods = (methods?: ('swish' | 'card' | 'cash')[]) => {
  if (!methods || methods.length === 0) return 'Betalas på plats';
  const labels = { swish: 'Swish', card: 'Kort', cash: 'Kontanter' };
  return methods.map((method) => labels[method]).join(' • ');
};

const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const escapeIcsText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

const getBarberInitials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();





export default function ShopBookingPage() {
  const params = useParams();
  const slug = params.shopSlug as string;
  const bookingStorageKey = getBookingStorageKey(slug);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageErrorKind, setPageErrorKind] = useState<'not_found' | 'temporary' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [confirmationData, setConfirmationData] = useState<BookingConfirmationData | null>(null);

  // Real data from backend
  const [shop, setShop] = useState<ShopData | null>(null);
  const [settings, setSettings] = useState<{ acceptedPaymentMethods?: ('swish' | 'card' | 'cash')[] } | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [statusFlag, setStatusFlag] = useState<'ready' | 'not_ready' | 'suspended'>('ready');

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<BarberData | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(INITIAL_CUSTOMER_FORM);
  const [upcomingTimes, setUpcomingTimes] = useState<{ label: string; date: string; time: string }[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  const barberSectionRef = React.useRef<HTMLDivElement>(null);
  const timeSectionRef = React.useRef<HTMLDivElement>(null);
  const hasHydratedBookingStateRef = React.useRef(false);

  // Load shop data
  const loadShop = useCallback(async () => {
    setLoading(true);
    setError('');
    setPageErrorKind(null);

    try {
      const res = await api.getShopBySlug(slug);
      if (res.ok) {
        const d = res.data as { shop: ShopData; settings?: { acceptedPaymentMethods?: ('swish' | 'card' | 'cash')[] }; services: ServiceData[]; barbers: BarberData[]; statusFlag: 'ready' | 'not_ready' | 'suspended' };
        setShop(d.shop);
        setSettings(d.settings || null);
        setServices(d.services || []);
        setBarbers(d.barbers || []);
        setStatusFlag(d.statusFlag || 'ready');
        return;
      }

      setShop(null);

      if (res.status === 404) {
        setPageErrorKind('not_found');
        setError('Salongen hittades inte.');
      } else if (res.status === 429) {
        setPageErrorKind('temporary');
        setError('För många förfrågningar just nu. Försök igen om en liten stund.');
      } else {
        setPageErrorKind('temporary');
        setError('Kunde inte ladda salongsinformationen just nu.');
      }
    } catch {
      setShop(null);
      setPageErrorKind('temporary');
      setError('Kunde inte ladda salongsinformationen just nu.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadShop();
    });
  }, [loadShop]);

  // Fetch upcoming quick slots — scans up to 7 days ahead until 2 slots are found
  useEffect(() => {
    const fetchUpcomingTimes = async () => {
      if (!shop || services.length === 0 || barbers.length === 0) return;
      setUpcomingLoading(true);

      const defaultService = services[0];
      const defaultBarber = barbers[0];
      const timesList: { label: string; date: string; time: string }[] = [];
      const now = new Date();

      const dayLabel = (offset: number, dateStr: string) => {
        if (offset === 0) return 'Idag';
        if (offset === 1) return 'Imorgon';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('sv-SE', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
      };

      try {
        for (let offset = 0; offset < 7 && timesList.length < 2; offset++) {
          const date = new Date(now);
          date.setDate(now.getDate() + offset);
          const dateStr = date.toISOString().split('T')[0];

          const res = await api.getAvailableSlots(shop._id, defaultBarber._id, dateStr, defaultService._id);
          if (!res.ok) continue;

          const slots: string[] = (res.data as { slots: string[] }).slots || [];
          const available = offset === 0
            ? slots.filter(s => {
                const [h, m] = s.split(':').map(Number);
                return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
              })
            : slots;

          if (available.length > 0) {
            timesList.push({
              label: `${dayLabel(offset, dateStr)}, ${available[0]}`,
              date: dateStr,
              time: available[0]
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
    const timer = setTimeout(() => {
      loadSlots();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedBarber?._id, selectedDate, selectedService?._id, step, shop?._id, loadSlots]);

  useEffect(() => {
    const storedBooking = localStorage.getItem(bookingStorageKey);
    if (!storedBooking) {
      hasHydratedBookingStateRef.current = true;
      return;
    }

    let frameId = 0;

    try {
      const parsed = JSON.parse(storedBooking) as PersistedBookingState;
      if (parsed.shopSlug === slug) {
        frameId = window.requestAnimationFrame(() => {
          setSelectedService(parsed.selectedService || null);
          setSelectedBarber(parsed.selectedBarber || null);
          setSelectedDate(prev => parsed.selectedDate || prev);
          setSelectedTime(parsed.selectedTime || '');
          setCustomerForm(parsed.customerForm || INITIAL_CUSTOMER_FORM);
          setStep(parsed.step || 1);
          setBookingDone(Boolean(parsed.bookingDone));
          setConfirmationData(parsed.confirmationData || null);
        });
      }
    } catch {}

    hasHydratedBookingStateRef.current = true;
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [bookingStorageKey, slug]);

  useEffect(() => {
    if (!hasHydratedBookingStateRef.current) return;

    const bookingState: PersistedBookingState = {
      shopSlug: slug,
      step,
      bookingDone,
      selectedService,
      selectedBarber,
      selectedDate,
      selectedTime,
      customerForm,
      confirmationData,
    };

    localStorage.setItem(bookingStorageKey, JSON.stringify(bookingState));
  }, [bookingDone, bookingStorageKey, confirmationData, customerForm, selectedBarber, selectedDate, selectedService, selectedTime, slug, step]);

  const handleAddToCalendar = () => {
    if (!confirmationData) return;

    const [hours, minutes] = confirmationData.time.split(':').map(Number);
    const start = new Date(confirmationData.date);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + confirmationData.service.durationMinutes * 60000);

    const fileContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BokaBarber//Booking//SV',
      'BEGIN:VEVENT',
      `UID:${confirmationData.shopSlug}-${start.getTime()}@bokabarber`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(`${confirmationData.service.name} - ${confirmationData.shopName}`)}`,
      `DESCRIPTION:${escapeIcsText(`Barberare: ${confirmationData.barber.name}\nKund: ${confirmationData.customerForm.firstName} ${confirmationData.customerForm.lastName}`)}`,
      `LOCATION:${escapeIcsText(confirmationData.shopAddress)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([fileContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bokning-bokabarber.ics';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleEditConfirmedBooking = () => {
    setBookingDone(false);
    setStep(5);
  };

  const activeConfirmation = confirmationData || (shop && selectedService && selectedBarber
    ? {
        shopSlug: slug,
        shopName: shop.name,
        shopAddress: formatShopAddress(shop.address),
        service: selectedService,
        barber: selectedBarber,
        date: selectedDate,
        time: selectedTime,
        customerForm,
        acceptedPaymentMethods: settings?.acceptedPaymentMethods,
      }
    : null);

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
        const confirmedBooking: BookingConfirmationData = {
          shopSlug: slug,
          shopName: shop.name,
          shopAddress: formatShopAddress(shop.address),
          service: selectedService,
          barber: selectedBarber,
          date: selectedDate,
          time: selectedTime,
          customerForm,
          acceptedPaymentMethods: settings?.acceptedPaymentMethods,
        };

        setConfirmationData(confirmedBooking);
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
      <div className="booking-loading public-theme animate-fade-in">
        <div className="booking-state-card">
          <div className="spinner"></div>
          <h2 className="booking-state-title">Laddar salongsinformation...</h2>
          <p className="booking-state-text">Hämtar salong, tjänster och lediga tider.</p>
        </div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <div className="booking-state-card">
          <h2 className="booking-state-title">⚠️ {error}</h2>
          <p className="booking-state-text">{pageErrorKind === 'not_found' ? 'Kontrollera att webbadressen är korrekt eller sök efter andra salonger.' : 'Det verkar vara ett tillfälligt problem. Försök igen om en liten stund.'}</p>
          {pageErrorKind === 'not_found' ? (
            <Link href="/sok" className="btn btn-primary mt-24">
              Sök salonger
            </Link>
          ) : (
            <button onClick={() => void loadShop()} className="btn btn-primary mt-24" type="button">
              Försök igen
            </button>
          )}
        </div>
      </div>
    );
  }

  if (statusFlag === 'suspended') {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <div className="booking-state-card">
          <h2 className="booking-state-title">Denna salong tar inte emot bokningar just nu</h2>
          <p className="booking-state-text">Återkom gärna vid ett senare tillfälle eller sök efter andra salonger.</p>
          <Link href="/sok" className="btn btn-primary mt-24">
            Sök salonger
          </Link>
        </div>
      </div>
    );
  }

  if (statusFlag === 'not_ready') {
    return (
      <div className="booking-error public-theme animate-fade-in">
        <div className="booking-state-card">
          <h2 className="booking-state-title">Denna salong är inte redo att ta emot bokningar ännu</h2>
          <p className="booking-state-text">Administratören håller på att ställa in salongen. Sök efter andra salonger.</p>
          <Link href="/sok" className="btn btn-primary mt-24">
            Sök salonger
          </Link>
        </div>
      </div>
    );
  }

  if (bookingDone && activeConfirmation) {
    return (
      <div className="booking-confirmation-page public-theme animate-fade-in">
        <main className="booking-confirmation-main">
          <section className="booking-confirmation-card">
            <div className="confirmation-icon-wrap">
              <div className="confirmation-icon-box">
                <span className="material-symbols-outlined confirmation-icon" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>

            <div className="confirmation-heading-block">
              <h1 className="confirmation-title">Bokad &amp; Klar!</h1>
              <p className="confirmation-subtitle">
                Tack för din bokning. Vi ser fram emot att välkomna dig till <strong>{activeConfirmation.shopName}</strong> för en förstklassig upplevelse.
              </p>
            </div>

            <div className="confirmation-divider"></div>

            <div className="confirmation-top-grid">
              <div className="confirmation-panel">
                <span className="confirmation-label">TJÄNST</span>
                <h2 className="confirmation-service-name">{activeConfirmation.service.name}</h2>
              </div>

              <div className="confirmation-panel confirmation-barber-panel">
                <span className="confirmation-label">BARBERARE</span>
                <div className="confirmation-barber-row">
                  {activeConfirmation.barber.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeConfirmation.barber.avatar} alt={activeConfirmation.barber.name} className="confirmation-barber-avatar" />
                  ) : (
                    <div className="confirmation-barber-fallback">{getBarberInitials(activeConfirmation.barber.name)}</div>
                  )}
                  <div className="confirmation-barber-text">{activeConfirmation.barber.name}</div>
                </div>
              </div>
            </div>

            <div className="confirmation-meta-grid">
              <div className="confirmation-meta-card">
                <div className="confirmation-meta-head">
                  <span className="material-symbols-outlined confirmation-meta-icon">calendar_month</span>
                  <span className="confirmation-meta-label">DATUM &amp; TID</span>
                </div>
                <p className="confirmation-meta-primary">{formatBookingDate(activeConfirmation.date)}</p>
                <p className="confirmation-meta-strong">{formatTimeRange(activeConfirmation.date, activeConfirmation.time, activeConfirmation.service.durationMinutes)}</p>
              </div>

              <div className="confirmation-meta-card">
                <div className="confirmation-meta-head">
                  <span className="material-symbols-outlined confirmation-meta-icon">payments</span>
                  <span className="confirmation-meta-label">PRIS</span>
                </div>
                <p className="confirmation-price">{activeConfirmation.service.price} SEK</p>
                <p className="confirmation-meta-note">{formatPaymentMethods(activeConfirmation.acceptedPaymentMethods)}</p>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeConfirmation.shopAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="confirmation-map-card"
            >
              <div className="confirmation-map-overlay"></div>
              <div className="confirmation-map-pin">
                <span className="material-symbols-outlined">location_on</span>
                <span>{activeConfirmation.shopAddress}</span>
              </div>
            </a>

            <div className="confirmation-actions-row">
              <button type="button" onClick={handleAddToCalendar} className="confirmation-primary-btn">
                Lägg till i kalendern
              </button>
              <button type="button" onClick={handleEditConfirmedBooking} className="confirmation-secondary-btn">
                Ändra bokning
              </button>
            </div>
          </section>
        </main>

        <style jsx>{`
          .booking-confirmation-page {
            min-height: 100vh;
            background: #faf9f6;
            padding: 120px 20px 72px;
          }

          .booking-confirmation-main {
            max-width: 860px;
            margin: 0 auto;
          }

          .booking-confirmation-card {
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid rgba(197, 160, 89, 0.16);
            border-radius: 28px;
            box-shadow: 0 20px 50px rgba(45, 0, 77, 0.06);
            padding: 40px 28px 28px;
          }

          .confirmation-icon-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 22px;
          }

          .confirmation-icon-box {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f2d78e 0%, #edd08a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 24px rgba(197, 160, 89, 0.18);
          }

          .confirmation-icon {
            color: #1f1a0f;
            font-size: 34px;
            line-height: 1;
            display: block;
          }

          .confirmation-heading-block {
            text-align: center;
            max-width: 560px;
            margin: 0 auto 28px;
          }

          .confirmation-title {
            font-family: var(--font-primary, 'Playfair Display', serif);
            font-size: 3rem;
            line-height: 1.05;
            color: #846823;
            margin-bottom: 12px;
          }

          .confirmation-subtitle {
            font-size: 1.1rem;
            line-height: 1.55;
            color: rgba(28, 27, 31, 0.68);
          }

          .confirmation-divider {
            height: 1px;
            background: rgba(197, 160, 89, 0.14);
            margin: 0 0 28px;
          }

          .confirmation-top-grid,
          .confirmation-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
          }

          .confirmation-label,
          .confirmation-meta-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 800;
            letter-spacing: 0.16em;
            color: #91712f;
            margin-bottom: 10px;
          }

          .confirmation-service-name,
          .confirmation-barber-text {
            font-family: var(--font-primary, 'Playfair Display', serif);
            font-size: 2rem;
            line-height: 1.15;
            color: #2a1b0f;
          }

          .confirmation-barber-row {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .confirmation-barber-avatar,
          .confirmation-barber-fallback {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            flex-shrink: 0;
          }

          .confirmation-barber-avatar {
            object-fit: cover;
            border: 1px solid rgba(197, 160, 89, 0.22);
          }

          .confirmation-barber-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #b89138 0%, #7c5f1c 100%);
            color: white;
            font-weight: 700;
          }

          .confirmation-meta-card {
            padding: 0;
          }

          .confirmation-meta-head {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .confirmation-meta-icon {
            color: #91712f;
            font-size: 20px;
          }

          .confirmation-meta-primary,
          .confirmation-meta-note {
            margin: 0;
            color: rgba(28, 27, 31, 0.72);
            font-size: 1rem;
          }

          .confirmation-meta-strong {
            margin: 4px 0 0;
            font-family: var(--font-primary, 'Playfair Display', serif);
            font-size: 1.75rem;
            color: #2a1b0f;
          }

          .confirmation-price {
            margin: 0;
            font-family: var(--font-primary, 'Playfair Display', serif);
            font-size: 2rem;
            color: #2a1b0f;
          }

          .confirmation-map-card {
            position: relative;
            display: block;
            height: 158px;
            border-radius: 20px;
            overflow: hidden;
            text-decoration: none;
            background:
              linear-gradient(135deg, rgba(253, 250, 243, 0.96) 0%, rgba(244, 239, 226, 0.92) 100%),
              repeating-linear-gradient(25deg, rgba(197, 160, 89, 0.08) 0 2px, transparent 2px 42px),
              repeating-linear-gradient(115deg, rgba(197, 160, 89, 0.08) 0 2px, transparent 2px 42px);
            border: 1px solid rgba(197, 160, 89, 0.14);
            margin-bottom: 28px;
          }

          .confirmation-map-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.26) 100%);
          }

          .confirmation-map-pin {
            position: absolute;
            left: 18px;
            bottom: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.86);
            color: #6f5a2b;
            font-weight: 700;
          }

          .confirmation-actions-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .confirmation-primary-btn,
          .confirmation-secondary-btn {
            min-height: 56px;
            border-radius: 14px;
            font-size: 0.95rem;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            cursor: pointer;
            transition: box-shadow var(--transition-normal), background var(--transition-normal), color var(--transition-normal), border-color var(--transition-normal);
          }

          .confirmation-primary-btn {
            border: 1px solid rgba(152, 118, 38, 0.25);
            background: linear-gradient(135deg, #a78834 0%, #8a6b20 100%);
            color: white;
            box-shadow: 0 10px 22px rgba(167, 136, 52, 0.18);
          }

          .confirmation-secondary-btn {
            border: 1px solid rgba(50, 44, 35, 0.28);
            background: white;
            color: #3a3328;
          }

          @media (max-width: 768px) {
            .booking-confirmation-card {
              padding: 28px 20px 20px;
            }

            .confirmation-title {
              font-size: 2.35rem;
            }

            .confirmation-top-grid,
            .confirmation-meta-grid,
            .confirmation-actions-row {
              grid-template-columns: 1fr;
            }

            .confirmation-service-name,
            .confirmation-barber-text,
            .confirmation-price,
            .confirmation-meta-strong {
              font-size: 1.6rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // Dynamic category image assignment based on keywords in name
  const getServiceImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('skägg') || n.includes('beard') || n.includes('rakning') || n.includes('grooming')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgsX0zM-D9x2XT0kND0cU5n3AW134X7L2u9zFu7oUSekk8FrzJhmPTpCYyz6KKA4SmwOm354hxy-q-N9Bphy9IbWBqS5KEGe3CBF-gZjUXr3ymckckKoNcggWzPYJOFqi86Msx0xW7hTJ_2ye6hwcHEn0iOvNcpFo5wUcna3R0Yal5L2pzZOdbSzOmdojQQHHXmvZThbeH_YIZ5h8xauA5b5ZkkkyxlAIumjrid8Rld1n8WU-QDo_WGnyECxwtsQ9PFvDtDig47Ks';
    }
    if (n.includes('klippning') || n.includes('styling') || n.includes('fade')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTGyYo4zAO-fzNBU8xvv1ku_zSJGMA4uMBumFeB_66g7TWYI5zCTuiYIT113K4K3tRwQIMyrr3lL3t1mVFt-bptNkpvsGZwTuF5AHl1y15nipczGCnJ2WvBDappFs7rK9SwjN0Qbffgv6sH1hA419QwgpOR-cTG4mPPNwPUSpVJ7HKNp7zC4oAH6a_6tMqT1bBMRvKuPsPN3MZ1c0hMuvKZUU1jE77-zAKciJRXbqe74GgXm-ZQDXV6iT3avwJCViAk8Dt6MiQbvQ';
    }
    if (n.includes('ritual') || n.includes('luxe') || n.includes('combo') || n.includes('paket')) {
      return '/trimmer.webp';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTGyYo4zAO-fzNBU8xvv1ku_zSJGMA4uMBumFeB_66g7TWYI5zCTuiYIT113K4K3tRwQIMyrr3lL3t1mVFt-bptNkpvsGZwTuF5AHl1y15nipczGCnJ2WvBDappFs7rK9SwjN0Qbffgv6sH1hA419QwgpOR-cTG4mPPNwPUSpVJ7HKNp7zC4oAH6a_6tMqT1bBMRvKuPsPN3MZ1c0hMuvKZUU1jE77-zAKciJRXbqe74GgXm-ZQDXV6iT3avwJCViAk8Dt6MiQbvQ';
  };

  const getBarberAvatar = (barber: BarberData) => {
    if (barber.avatar) return barber.avatar;
    const name = barber.name.toLowerCase();
    if (name.includes('erik')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4ZDJBJUiB3LZMHX3vW14Wc0Ufdix_QkESsbqvBWVqqC5BFPoy44klN9MsXxvHwXK4G1RsWLcuoHup6o4qDR5QwqZTBX9diwgiSkXzEA4zsZEAxnRurf7Xnp4dxjDXpSj3nEw_TpDO0p6XZ_xj7lFlIp3PvE0wCuUVwMyUUrWc_yVO2lp7hcoVDuq5UgzgTEqWmt41H_GSpqI-TljCpT5L-HaXyuJsG7jqaudxGwYbQxRvR3AdibgNvc6zy6ZDyCzL6xd6ZOEdn3s';
    }
    if (name.includes('johan')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNGplPx2OnhriFBnIX-Swsjx7KCW1txgAjMEhmKUbmEb6Yn4mwjzolJcaHIW1lplMrFKR0X29T3fjiM11pRL3lr6B8deWkKqq_-jSm53fMcxWQQBHUic_6wCNlEvWnLbUFVmIQAORINexbEUlG3RNK8QxnO1ootXU0IHDTPevgcWTXsohumQXjANjsdKgRH8vx1p-5__pDwAvPoFUe8IpTak5WyrM3prl1-ErWjsgHxZekd01O4peHB8LxcjtY9zGEbuiml8GbqI';
    }
    return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400';
  };

  const getNext7Days = () => {
    const days = [];
    const locale = 'sv-SE';
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
      const dayNum = d.getDate();
      const dateStr = d.toISOString().split('T')[0];
      days.push({ dayName, dayNum, dateStr });
    }
    return days;
  };

  const weekDays = getNext7Days();

  const handleSelectService = (service: ServiceData) => {
    setSelectedService(service);
    setSelectedBarber(null);
    setSelectedTime('');
    setStep(2);
  };

  const handleSelectBarber = (barber: BarberData) => {
    setSelectedBarber(barber);
    setSelectedTime('');
    setStep(3);
  };

  return (
    <div className="booking-page public-theme animate-fade-in">
      {/* Decorative Aura Backgrounds */}
      <div className="soft-aura aura-top"></div>
      <div className="soft-aura aura-bottom"></div>

      <div className="container">

        {/* 👑 HEADER SECTION */}
        <section className="booking-header text-center reveal-item">
          <h1 className="booking-title">Boka Din Ritual</h1>
          <p className="booking-subtitle">Välj den tjänst, frisör och tid som passar dig bäst</p>
        </section>

        {/* 🧙 BOOKING STEP WIZARD CONTAINER */}
        {step <= 3 && (
          <div className="wizard-root">
            {/* 🗺️ STEPS DOT PROGRESS BAR */}
            <section className="stepper-section reveal-item">
              <div className="stepper-row">
                <div className="stepper-line">
                  <div
                    className="stepper-active-line"
                    style={{
                      width: selectedService && selectedBarber ? '100%' : selectedService ? '50%' : '0%'
                    }}
                  ></div>
                </div>
                
                <div className="step-item">
                  <div
                    className={`step-circle ${
                      !selectedService ? 'step-circle-pulse' : 'step-circle-active'
                    }`}
                  >
                    1
                  </div>
                  <span className={`step-label-text ${!selectedService ? 'label-active' : 'label-done'}`}>
                    Tjänst
                  </span>
                </div>
                
                <div className="step-item">
                  <div
                    className={`step-circle ${
                      selectedService && !selectedBarber
                        ? 'step-circle-pulse'
                        : selectedBarber
                        ? 'step-circle-active'
                        : 'step-circle-default'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`step-label-text ${
                      selectedService && !selectedBarber
                        ? 'label-active'
                        : selectedBarber
                        ? 'label-done'
                        : 'label-default'
                    }`}
                  >
                    Frisör
                  </span>
                </div>
                
                <div className="step-item">
                  <div
                    className={`step-circle ${
                      selectedBarber && !selectedTime
                        ? 'step-circle-pulse'
                        : selectedTime
                        ? 'step-circle-active'
                        : 'step-circle-default'
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`step-label-text ${
                      selectedBarber && !selectedTime
                        ? 'label-active'
                        : selectedTime
                        ? 'label-done'
                        : 'label-default'
                    }`}
                  >
                    Tid
                  </span>
                </div>
              </div>
            </section>

            <div className="grid-booking-layout">
              {/* Left Column: Selector Sections */}
              <div className="booking-steps-column">
                
                {/* SECTION 1: SELECT SERVICE */}
                <section id="step-service">
                  <h2 className="step-section-title">
                    <span className="text-secondary opacity-50">01.</span> Välj Tjänst
                  </h2>
                  <div className="services-subgrid">
                    {services.map(s => {
                      const isSelected = selectedService?._id === s._id;
                      const isPremium = s.name.toLowerCase().includes('ritual') || s.name.toLowerCase().includes('luxe') || s.price > 500;
                      return (
                        <div
                          key={s._id}
                          onClick={() => handleSelectService(s)}
                          className={`glass-card-light service-card-premium ${isSelected ? 'selected-glow' : ''}`}
                        >
                          <div className="service-card-image-box">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getServiceImage(s.name)}
                              alt={s.name}
                              className="service-card-image"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = '/trimmer.webp';
                              }}
                            />
                            {isPremium && <span className="service-card-badge">POPULÄR</span>}
                          </div>
                          <div className="service-card-info-box">
                            <h3 className="service-card-title flex items-center gap-2">
                              {s.name}
                              {isSelected && (
                                <span className="material-symbols-outlined checkmark-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  check_circle
                                </span>
                              )}
                            </h3>
                            <p className="service-card-desc">{s.description || 'En lyxig behandling anpassad efter dina specifika önskemål.'}</p>
                            <div className="service-card-bottom-row">
                              <span className="service-card-duration">
                                <span className="material-symbols-outlined duration-icon">schedule</span>
                                {s.durationMinutes} min
                              </span>
                              <span className="service-card-price">{s.price} kr</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 2: SELECT BARBER */}
                <section id="step-barber" ref={barberSectionRef} className={selectedService ? '' : 'step-inactive'}>
                  <h2 className="step-section-title">
                    <span className="text-secondary opacity-50">02.</span> Välj Frisör
                  </h2>
                  <div className={`barbers-grid-premium ${barbers.length === 1 ? 'barbers-grid-single' : ''}`}>
                    {barbers.map(b => {
                      const isSelected = selectedBarber?._id === b._id;
                      const isMaster = b.name.toLowerCase().includes('johan') || b.bio?.toLowerCase().includes('master');
                      return (
                        <div
                          key={b._id}
                          onClick={() => handleSelectBarber(b)}
                          className={`glass-card-light barber-card-premium ${isSelected ? 'selected-glow' : ''}`}
                        >
                          <div className="barber-card-image-box">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getBarberAvatar(b)} alt={b.name} className="barber-card-image" />
                            <span className={`barber-badge-overlay ${isMaster ? 'bg-secondary' : 'bg-primary'}`}>
                              {isMaster ? 'Master Barber' : 'Senior Stylist'}
                            </span>
                          </div>
                          <div className="barber-card-info-box">
                            <h3 className="barber-card-name flex items-center gap-2">
                              {b.name}
                              {isSelected && (
                                <span className="material-symbols-outlined checkmark-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  check_circle
                                </span>
                              )}
                            </h3>
                            <p className="barber-card-bio">{b.bio || 'Mästerlig precision med passion för hantverket.'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 3: SELECT TIME */}
                <section id="step-time" ref={timeSectionRef} className={selectedBarber ? '' : 'step-inactive'}>
                  <h2 className="step-section-title">
                    <span className="text-secondary opacity-50">03.</span> Välj Tid
                  </h2>
                  <div className="glass-card-light calendar-container-premium">
                    <div className="calendar-header-row">
                      <h3 className="calendar-title-serif">Välj Dag</h3>
                      <div className="calendar-month-badge">
                        <span className="material-symbols-outlined text-xl">event</span>
                        <span className="font-label-lg">
                          {new Date(selectedDate).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Week Calendar days slider */}
                    <div className="calendar-days-grid-premium">
                      {weekDays.map(day => {
                        const isSelected = selectedDate === day.dateStr;
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => setSelectedDate(day.dateStr)}
                            className={`calendar-day-btn ${isSelected ? 'selected-day' : ''}`}
                            type="button"
                          >
                            <span className="day-name">{day.dayName}</span>
                            <span className="day-num">{day.dayNum}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="slots-section-premium">
                      <p className="slots-label-uppercase">Lediga tider hos {selectedBarber?.name}</p>
                      {slotsLoading && <div className="slots-loading-text">Söker efter lediga tider...</div>}
                      {!slotsLoading && slots.length === 0 && selectedDate && (
                        <div className="no-slots-box">Inga lediga tider detta datum. Prova ett annat datum.</div>
                      )}
                      {!slotsLoading && slots.length > 0 && (
                        <div className="time-slots-grid-premium">
                          {slots.map(time => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                className={`time-slot-btn-premium ${isSelected ? 'selected-slot' : ''}`}
                                onClick={() => setSelectedTime(time)}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Sticky Summary Sidebar */}
              <div className="booking-summary-column-sticky">
                <div className="glass-card-light summary-card-sticky">
                  <h3 className="summary-title-serif">
                    Din Bokning
                    <span className="material-symbols-outlined receipt-icon-floating">receipt_long</span>
                  </h3>

                  <div className="summary-details-list">
                    {/* Service Row */}
                    <div className={`summary-detail-row-animate ${selectedService ? 'active-row' : ''}`}>
                      <div>
                        <p className="summary-detail-label">Tjänst</p>
                        <p className="summary-detail-value">{selectedService ? selectedService.name : 'Ej vald'}</p>
                      </div>
                      {selectedService && <p className="summary-detail-price">{selectedService.price} kr</p>}
                    </div>

                    {/* Barber Row */}
                    <div className={`summary-detail-row-animate ${selectedBarber ? 'active-row' : ''}`}>
                      <div>
                        <p className="summary-detail-label">Frisör</p>
                        <p className="summary-detail-value">{selectedBarber ? selectedBarber.name : 'Ej vald'}</p>
                      </div>
                    </div>

                    {/* Time Row */}
                    <div className={`summary-detail-row-animate ${selectedTime ? 'active-row' : ''}`}>
                      <div>
                        <p className="summary-detail-label">Tid</p>
                        <p className="summary-detail-value">
                          {selectedTime
                            ? `${new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })} kl ${selectedTime}`
                            : 'Ej vald'}
                        </p>
                      </div>
                    </div>

                    {/* Total & Action Button */}
                    <div className="summary-total-footer">
                      <div className="summary-total-row">
                        <span className="summary-total-text">Totalt</span>
                        <span className="summary-total-price">{selectedService ? selectedService.price : 0} kr</span>
                      </div>
                      
                      <button
                        id="btn-confirm"
                        onClick={() => setStep(4)}
                        className={`gold-gradient-btn booking-confirm-action-btn ${
                          selectedService && selectedBarber && selectedTime ? 'enabled' : 'disabled'
                        }`}
                        disabled={!(selectedService && selectedBarber && selectedTime)}
                      >
                        Bekräfta Bokning
                      </button>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="mt-8 flex justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/30 floating"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30 floating" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/30 floating" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>

                {/* ⚡ QUICK BOOKING / NEAREST TIMES */}
                {step <= 3 && (
                  <div className="glass-card-light summary-card-sticky" style={{ marginTop: '24px' }}>
                    <h3 className="upcoming-btn-title-serif !mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Snabbtider
                      <span className="material-symbols-outlined receipt-icon-floating text-secondary">bolt</span>
                    </h3>
                    <p className="upcoming-btn-subtitle">
                      Boka närmaste lediga tid direkt
                    </p>
                    
                    {upcomingLoading && (
                      <div className="py-4 text-center text-sm text-[#4b0082]/70 flex items-center justify-center gap-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div className="mini-spinner"></div>
                        Söker lediga tider...
                      </div>
                    )}
                    
                    {!upcomingLoading && upcomingTimes.length === 0 && (
                      <p className="text-sm text-[#444444]/75 text-center py-4" style={{ textAlign: 'center', color: 'rgba(68, 68, 68, 0.75)' }}>
                        Inga lediga tider de närmaste dagarna.
                      </p>
                    )}
                    
                    {!upcomingLoading && upcomingTimes.length > 0 && (
                      <div className="flex flex-col gap-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {upcomingTimes.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="upcoming-time-btn-premium group"
                            onClick={() => handleQuickBook(item.date, item.time)}
                          >
                            <div className="upcoming-btn-left-content">
                              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>event_available</span>
                              <span className="font-semibold text-primary-purple" style={{ fontWeight: 600 }}>{item.label}</span>
                            </div>
                            <span className="material-symbols-outlined text-secondary arrow-icon">
                              arrow_forward
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS FORM */}
        {step === 4 && (
          <div className="step-details-container max-w-2xl mx-auto reveal-item">
            <h2 className="step-section-title text-center mb-8">Dina Uppgifter</h2>
            <div className="customer-form-card">
              {error && <div className="error-banner">⚠️ {error} <button onClick={() => setError('')} className="close-err">×</button></div>}
              <form className="customer-details-form" onSubmit={e => { e.preventDefault(); setStep(5); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="custFirstName" className="form-label">Förnamn*</label>
                    <input
                      id="custFirstName"
                      type="text"
                      required
                      value={customerForm.firstName}
                      onChange={e => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                      className="form-input-premium"
                      placeholder="Förnamn"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="custLastName" className="form-label">Efternamn*</label>
                    <input
                      id="custLastName"
                      type="text"
                      required
                      value={customerForm.lastName}
                      onChange={e => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                      className="form-input-premium"
                      placeholder="Efternamn"
                    />
                  </div>
                </div>
                <div className="form-group mt-6">
                  <label htmlFor="custEmail" className="form-label">E-postadress*</label>
                  <input
                    id="custEmail"
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="form-input-premium"
                    placeholder="namn@exempel.se"
                  />
                </div>
                <div className="form-group mt-6">
                  <label htmlFor="custPhone" className="form-label">Telefonnummer*</label>
                  <input
                    id="custPhone"
                    type="tel"
                    required
                    value={customerForm.phoneNumber}
                    onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                    className="form-input-premium"
                    placeholder="070-123 45 67"
                  />
                </div>
                
                <div className="wizard-actions-row mt-10">
                  <button type="button" onClick={() => setStep(3)} className="btn-outline-premium">
                    ← Tillbaka
                  </button>
                  <button type="submit" className="gold-gradient-btn py-4 px-8 rounded-xl font-bold uppercase tracking-wider text-white">
                    Bekräfta Uppgifter →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL CONFIRMATION */}
        {step === 5 && (
          <div className="step-confirm-container max-w-2xl mx-auto reveal-item">
            <h2 className="step-section-title text-center mb-8">Bekräfta Din Bokning</h2>
            <div className="customer-form-card">
              {error && <div className="error-banner">⚠️ {error} <button onClick={() => setError('')} className="close-err">×</button></div>}
              <div className="booking-summary-invoice-premium">
                <div className="invoice-header-title">Bokningsöversikt</div>
                <div className="invoice-detail-row"><span>Salong</span><strong>{shop?.name}</strong></div>
                <div className="invoice-detail-row"><span>Tjänst</span><strong>{selectedService?.name}</strong></div>
                <div className="invoice-detail-row"><span>Barberare</span><strong>{selectedBarber?.name}</strong></div>
                <div className="invoice-detail-row">
                  <span>Datum & Tid</span>
                  <strong>
                    {new Date(selectedDate).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} kl {selectedTime}
                  </strong>
                </div>
                <div className="invoice-detail-row"><span>Kund</span><strong>{customerForm.firstName} {customerForm.lastName}</strong></div>

                <div className="invoice-divider-line"></div>

                <div className="invoice-detail-row total-row-premium">
                  <span>Totalt att betala</span>
                  <strong className="text-secondary">{selectedService?.price} kr</strong>
                </div>
                
                <div className="payment-note-box mt-6">
                  <span className="material-symbols-outlined text-secondary">payments</span>
                  <div className="payment-note-text-wrapper">
                    <p className="payment-note-title">Betalning sker på plats i salongen</p>
                    {(() => {
                      const methods = settings?.acceptedPaymentMethods;
                      if (!methods || methods.length === 0) return null;
                      return (
                        <p className="payment-methods-list-text">
                          Denna salong accepterar:{' '}
                          {methods.map((m, idx) => {
                            const labels = { swish: 'Swish 📱', card: 'Kort 💳', cash: 'Kontanter 💵' };
                            const isLast = idx === methods.length - 1;
                            const isSecondToLast = idx === methods.length - 2;
                            return (
                              <span key={m}>
                                {labels[m]}
                                {isLast ? '' : isSecondToLast ? ' och ' : ', '}
                              </span>
                            );
                          })}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="wizard-actions-row mt-10">
                <button onClick={() => setStep(4)} className="btn-outline-premium" disabled={submitting}>
                  ← Ändra uppgifter
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="gold-gradient-btn py-4 px-10 rounded-xl font-bold uppercase tracking-wider text-white"
                >
                  {submitting ? 'Slutför bokning...' : 'Boka Nu'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        :global(html),
        :global(body) {
          overflow-x: clip;
        }

        /* Decorative Aura Backgrounds */
        .soft-aura {
          position: fixed;
          width: min(800px, 70vw);
          height: min(800px, 70vw);
          background: radial-gradient(circle, rgba(75, 0, 130, 0.04) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
          animation: float-aura 20s infinite alternate ease-in-out;
        }

        .aura-top {
          top: -300px;
          left: -300px;
        }

        .aura-bottom {
          bottom: -300px;
          right: -300px;
          animation-delay: -5s;
        }

        @keyframes float-aura {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        .booking-page {
          background-color: #faf9f6;
          background-image: 
            radial-gradient(circle at 100% 0%, rgba(75, 0, 130, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, rgba(184, 134, 11, 0.02) 0%, transparent 40%);
          min-height: 100vh;
          padding: 18px 0 120px 0;
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
        }

        .booking-header {
          margin-bottom: 20px;
        }

        /* 👑 HEADER */
        .booking-title {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 2.45rem;
          font-weight: 700;
          color: #4b0082;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #4b0082 0%, #7b41b3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (max-width: 768px) {
          .booking-title {
            font-size: 2rem;
          }
        }

        .booking-subtitle {
          color: #B8860B;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.4em;
          margin-bottom: 6px;
        }

        /* 🗺️ STEPS NAVIGATION BAR */
        .stepper-section {
          max-width: 600px;
          margin: 0 auto 36px auto;
          position: relative;
        }

        @media (max-width: 786px) {
          .stepper-section {
            margin-bottom: 32px;
          }
        }

        @media (max-width: 640px) {
          .stepper-section {
            margin-bottom: 24px;
          }
        }

        .stepper-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          max-width: 600px;
          margin: 0 auto;
        }

        .stepper-line {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: rgba(0, 0, 0, 0.05);
          z-index: 1;
        }

        .stepper-active-line {
          height: 100%;
          background-color: #B8860B;
          transition: width 0.5s ease;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 10;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.5s ease;
        }

        .step-circle-default {
          background-color: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: rgba(28, 27, 31, 0.4);
        }

        .step-circle-active {
          background-color: #4b0082;
          color: white;
          box-shadow: 0 4px 12px rgba(75, 0, 130, 0.2);
        }

        .step-circle-pulse {
          background-color: #B8860B;
          color: white;
          box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
          animation: stepPulse 2s infinite;
        }

        .step-label-text {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 13px;
          font-weight: 700;
          transition: color 0.5s ease;
        }

        .label-default {
          color: rgba(28, 27, 31, 0.4);
        }

        .label-active {
          color: #B8860B;
        }

        .label-done {
          color: #4b0082;
        }

        @keyframes stepPulse {
          0% { box-shadow: 0 0 0 0 rgba(184, 134, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(184, 134, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(184, 134, 11, 0); }
        }

        /* 🧙 WIZARD LAYOUT */
        .wizard-root {
          /* No animation here to prevent breaking position: sticky on children */
        }

        .grid-booking-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
          gap: 40px;
          align-items: start;
          animation: fadeIn 0.8s ease-out;
        }

        @media (max-width: 1200px) {
          .grid-booking-layout {
            grid-template-columns: 1fr;
          }

          .booking-summary-column-sticky {
            position: static;
            max-width: 920px;
            width: 100%;
            margin-inline: auto;
          }
        }

        .booking-steps-column {
          display: flex;
          flex-direction: column;
          gap: 70px;
          min-width: 0;
        }

        .step-section-title {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 2rem;
          color: #4b0082;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Premium Glass Card Layout */
        .glass-card-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(75, 0, 130, 0.15);
          box-shadow: 0 10px 30px -5px rgba(75, 0, 130, 0.05);
          position: relative;
          overflow: hidden;
          transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
        }

        .glass-card-light:hover {
          box-shadow: 0 20px 45px -10px rgba(75, 0, 130, 0.12), 0 0 15px rgba(184, 134, 11, 0.05);
          border-color: rgba(184, 134, 11, 0.2);
        }

        /* Glass Shimmer sweep */
        .glass-card-light::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 45%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 55%
          );
          transform: rotate(-45deg) translateX(-100%);
          pointer-events: none;
          z-index: 5;
        }

        .glass-card-light:hover::after {
          transform: rotate(-45deg) translateX(100%);
          transition: transform 0.8s ease-in-out;
        }

        /* Selected Glow (No movement on hover) */
        .selected-glow {
          box-shadow: 0 0 0 2px #B8860B, 0 15px 35px rgba(184, 134, 11, 0.15) !important;
          border-color: #B8860B !important;
        }

        .selected-glow:hover {
          transform: none !important;
        }

        /* SERVICES SUBGRID */
        .services-subgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
          gap: 28px;
        }

        .service-card-premium {
          display: flex;
          flex-direction: column;
          border-radius: 1.5rem;
          padding: 16px;
          cursor: pointer;
          height: 100%;
        }

        .service-card-premium:hover {
          transform: translateY(-8px);
        }

        .service-card-image-box {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 1rem;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.02);
        }

        .service-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s ease;
        }

        .service-card-premium:hover .service-card-image {
          transform: scale(1.08);
        }

        .service-card-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #B8860B;
          color: white;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          letter-spacing: 0.05em;
        }

        .service-card-info-box {
          padding: 18px 8px 4px 8px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .service-card-title {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.4rem;
          font-weight: 600;
          color: #4b0082;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkmark-icon {
          color: #B8860B;
          font-size: 20px;
        }

        .service-card-desc {
          font-size: 1rem;
          color: rgba(28, 27, 31, 0.7);
          line-height: 1.6;
          margin-bottom: 20px;
          flex-grow: 1;
        }

        .service-card-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 14px;
        }

        .service-card-duration {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(28, 27, 31, 0.4);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .duration-icon {
          font-size: 14px;
        }

        .service-card-price {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.3rem;
          font-weight: 700;
          color: #B8860B;
        }

        /* BARBER SELECT GRID */
        .barbers-grid-premium {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 320px));
          gap: 24px;
          justify-content: start;
          align-items: start;
        }

        .barbers-grid-single {
          grid-template-columns: minmax(0, 320px);
          justify-content: start;
        }

        @media (max-width: 900px) {
          .barbers-grid-premium {
            grid-template-columns: minmax(0, 320px);
          }
        }

        .barber-card-premium {
          border-radius: 1.5rem;
          padding: 16px;
          cursor: pointer;
          border-radius: 1.5rem;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .barber-card-premium:hover {
          transform: translateY(-8px);
        }

        .barber-card-image-box {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 1rem;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.02);
        }

        .barber-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s ease;
        }

        .barber-card-premium:hover .barber-card-image {
          transform: scale(1.08);
        }

        .barber-badge-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
          color: white;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .barber-card-info-box {
          padding: 18px 8px 4px 8px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .barber-card-name {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.4rem;
          font-weight: 600;
          color: #4b0082;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .barber-card-bio {
          font-size: 0.85rem;
          color: rgba(28, 27, 31, 0.65);
          line-height: 1.5;
          margin: 0;
          flex-grow: 1;
        }

        @media (max-width: 640px) {
          .booking-page {
            padding: 16px 0 96px 0;
          }
        }

        /* CALENDAR CONTAINER */
        .calendar-container-premium {
          border-radius: 1.5rem;
          padding: 32px;
          max-width: 920px;
          margin-inline: auto;
        }

        @media (max-width: 960px) {
          .calendar-container-premium {
            max-width: 100%;
          }
        }

        .calendar-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .calendar-title-serif {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.5rem;
          color: #4b0082;
          font-weight: 600;
          margin: 0;
        }

        .calendar-month-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(75, 0, 130, 0.05);
          color: #4b0082;
          padding: 6px 16px;
          border-radius: 9999px;
          border: 1px solid rgba(75, 0, 130, 0.1);
        }

        .calendar-days-grid-premium {
          display: flex;
          flex-direction: row;
          gap: 8px;
          margin-bottom: 36px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .calendar-days-grid-premium::-webkit-scrollbar {
          display: none;
        }

        .calendar-day-btn {
          background-color: white;
          border: 1.5px solid rgba(75, 0, 130, 0.15);
          border-radius: 1rem;
          padding: 14px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          flex: 1 0 48px;
          min-width: 48px;
        }

        .calendar-day-btn:hover {
          background-color: rgba(0, 0, 0, 0.02);
          border-color: rgba(184, 134, 11, 0.2);
        }

        .selected-day {
          background: #B8860B !important;
          border-color: #B8860B !important;
          box-shadow: 0 8px 20px rgba(184, 134, 11, 0.25);
          transform: scale(1.05);
        }

        .selected-day .day-name {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        .selected-day .day-num {
          color: white !important;
        }

        .day-name {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 10px;
          font-weight: 700;
          color: rgba(28, 27, 31, 0.4);
          margin-bottom: 4px;
        }

        .day-num {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.3rem;
          font-weight: 700;
          color: #4b0082;
        }

        .slots-section-premium {
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 28px;
        }

        .slots-label-uppercase {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 11px;
          font-weight: 700;
          color: rgba(75, 0, 130, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .slots-loading-text {
          color: rgba(28, 27, 31, 0.4);
          font-size: 0.9rem;
          padding: 12px 0;
        }

        .no-slots-box {
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 1rem;
          color: rgba(28, 27, 31, 0.6);
          border: 1px dashed rgba(0, 0, 0, 0.08);
          font-size: 0.9rem;
        }

        .time-slots-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 12px;
        }

        .time-slot-btn-premium {
          padding: 14px 10px;
          background-color: white;
          border: 1.5px solid rgba(75, 0, 130, 0.15);
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: #4b0082;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .time-slot-btn-premium:hover {
          border-color: #B8860B;
          background-color: rgba(184, 134, 11, 0.02);
        }

        .selected-slot {
          background: #B8860B !important;
          color: white !important;
          border-color: #B8860B !important;
          box-shadow: 0 6px 15px rgba(184, 134, 11, 0.25);
        }

        /* STEP LOCKING CLASS */
        .step-inactive {
          opacity: 0.25;
          filter: grayscale(0.8);
          pointer-events: none;
          transition: all 0.6s ease;
        }

        /* 🛡️ STICKY SIDEBAR COLUMN */
        .booking-summary-column-sticky {
          position: sticky;
          top: 120px;
          z-index: 10;
          min-width: 0;
        }

        .summary-card-sticky {
          border-radius: 2rem;
          padding: 36px;
        }

        .summary-title-serif {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.6rem;
          color: #4b0082;
          font-weight: 700;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .receipt-icon-floating {
          color: #B8860B;
          opacity: 0.4;
          animation: float-subtle 4s infinite ease-in-out;
        }

        .summary-details-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-detail-row-animate {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          opacity: 0.2;
          transform: translateX(15px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .active-row {
          opacity: 1;
          transform: translateX(0);
        }

        .summary-detail-label {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 10px;
          font-weight: 700;
          color: rgba(28, 27, 31, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }

        .summary-detail-value {
          font-size: 1.05rem;
          font-weight: 600;
          color: #4b0082;
          margin: 0;
        }

        .summary-detail-price {
          font-weight: 700;
          color: #B8860B;
          margin: 0;
        }

        .summary-total-footer {
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 28px;
          margin-top: 8px;
        }

        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .summary-total-text {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(28, 27, 31, 0.6);
        }

        .summary-total-price {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.8rem;
          font-weight: 700;
          color: #B8860B;
        }

        /* PREMIUM BUTTONS WITH SHIMMER */
        .gold-gradient-btn {
          background: linear-gradient(90deg, #B8860B 0%, #D4AF37 50%, #B8860B 100%);
          background-size: 200% auto;
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(184, 134, 11, 0.25);
          animation: shimmer 6s linear infinite;
          cursor: pointer;
          outline: none;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
          padding: 14px 28px;
          border-radius: 0.75rem;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .gold-gradient-btn::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
          transform: rotate(45deg);
          transition: all 0.7s;
          opacity: 0;
        }

        .gold-gradient-btn:hover::after {
          opacity: 1;
          left: 100%;
          top: 100%;
        }

        .gold-gradient-btn:hover {
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
          transform: translateY(-2px);
          animation: shimmer 2s linear infinite;
        }

        .gold-gradient-btn:active {
          transform: scale(0.96);
        }

        .booking-confirm-action-btn {
          width: 100%;
          padding: 16px;
          border-radius: 1rem;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .booking-confirm-action-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          animation: none;
          transform: none;
          background: #cccccc;
        }

        .booking-confirm-action-btn.disabled::after {
          display: none;
        }

        /* STEP 4 & 5 CUSTOM CONTAINERS */
        .step-details-container, .step-confirm-container {
          animation: fadeIn 0.8s ease-out;
        }

        .customer-form-card {
          background-color: rgba(255, 255, 255, 0.6);
          padding: 40px;
          border-radius: 2rem;
          border: 1px solid rgba(75, 0, 130, 0.15);
        }

        @media (max-width: 576px) {
          .customer-form-card {
            padding: 24px;
          }
        }

        .customer-details-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 576px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 11px;
          font-weight: 700;
          color: rgba(75, 0, 130, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input-premium {
          height: 48px;
          padding: 0 16px;
          border-radius: 0.75rem;
          border: 1.5px solid rgba(75, 0, 130, 0.15);
          background-color: white;
          color: #1c1b1f;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-input-premium:focus {
          border-color: #B8860B;
          box-shadow: 0 0 0 3px rgba(184, 134, 11, 0.15);
        }

        .wizard-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .btn-outline-premium {
          height: 48px;
          padding: 0 28px;
          border-radius: 0.75rem;
          border: 1px solid rgba(75, 0, 130, 0.2);
          background-color: transparent;
          color: #4b0082;
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .btn-outline-premium:hover {
          background-color: rgba(75, 0, 130, 0.05);
          border-color: #4b0082;
        }

        .btn-outline-premium:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: transparent;
        }

        /* INVOICE CARD */
        .booking-summary-invoice-premium {
          display: flex;
          flex-direction: column;
        }

        .invoice-header-title {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.5rem;
          font-weight: 700;
          color: #4b0082;
          border-bottom: 2px solid #B8860B;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        .invoice-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
          font-size: 0.95rem;
        }

        .invoice-detail-row span {
          color: rgba(28, 27, 31, 0.55);
        }

        .invoice-detail-row strong {
          color: #4b0082;
        }

        .invoice-divider-line {
          height: 1px;
          background-color: rgba(0, 0, 0, 0.08);
          margin: 20px 0;
        }

        .total-row-premium {
          border-bottom: none;
          padding: 8px 0;
        }

        .total-row-premium span {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-weight: 700;
          color: #1c1b1f;
        }

        .total-row-premium strong {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.6rem;
          font-weight: 700;
        }

        .payment-note-box {
          display: flex;
          gap: 12px;
          background-color: rgba(75, 0, 130, 0.04);
          padding: 16px 20px;
          border-radius: 1rem;
          align-items: flex-start;
        }

        .payment-note-text-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .payment-note-title {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 0.8rem;
          font-weight: 700;
          color: #4b0082;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .payment-methods-list-text {
          font-size: 0.8rem;
          color: rgba(28, 27, 31, 0.6);
          margin: 0;
          line-height: 1.4;
        }

        /* OTHER LAYOUTS */
        .error-banner {
          background-color: #fee2e2;
          color: #ef4444;
          padding: 14px 20px;
          border-radius: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .close-err {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 1.3rem;
          cursor: pointer;
          outline: none;
        }

        /* ANIMATIONS */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reveal-item {
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .floating {
          animation: float-subtle 4s infinite ease-in-out;
        }

        /* ⚡ Upcoming Snabbtider Styles */
        .upcoming-time-btn-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: white;
          border: 1.5px solid rgba(75, 0, 130, 0.15);
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          outline: none;
          text-align: left;
        }

        .upcoming-time-btn-premium:hover {
          background-color: rgba(184, 134, 11, 0.03);
          border-color: #B8860B;
          box-shadow: 0 6px 20px rgba(184, 134, 11, 0.12);
        }

        .upcoming-btn-left-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upcoming-btn-title-serif {
          font-family: var(--font-primary, 'Playfair Display', serif);
          font-size: 1.5rem;
          color: #4b0082;
          font-weight: 700;
          margin: 0;
        }

        .upcoming-btn-subtitle {
          font-family: var(--font-secondary, 'Montserrat', sans-serif);
          font-size: 11px;
          font-weight: 700;
          color: #B8860B;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
        }

        .text-primary-purple {
          color: #4b0082;
        }

        .arrow-icon {
          transition: transform 0.3s ease;
          transform: translateY(-3px);
        }

        .upcoming-time-btn-premium:hover .arrow-icon {
          transform: translateX(4px) translateY(-3px);
        }

        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(184, 134, 11, 0.2);
          border-top-color: #B8860B;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>

    </div>
  );
}

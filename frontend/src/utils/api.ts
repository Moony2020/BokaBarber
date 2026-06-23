const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const { method = 'GET', body, headers = {} } = options;

  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const config: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...headers },
    // No credentials:'include' needed – auth uses Bearer token in the Authorization header
    cache: 'no-store',
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, config);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Auth helpers
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password } }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }),

  registerShop: (data: unknown) =>
    apiFetch('/auth/register-shop', { method: 'POST', body: data }),

  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token: string, password: string) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } }),

  me: () => apiFetch('/auth/me'),

  // Public
  // Billing / Stripe
  createCheckout: (shopId: string, plan: 'bas' | 'pro') =>
    apiFetch(`/billing/${shopId}/quick-checkout`, { method: 'POST', body: { plan } }),

  verifyStripeSession: (shopId: string, sessionId: string) =>
    apiFetch(`/billing/${shopId}/verify-session`, { method: 'POST', body: { session_id: sessionId } }),

  createPayPalOrder: (shopId: string, plan: 'bas' | 'pro') =>
    apiFetch(`/billing/${shopId}/create-paypal-order`, { method: 'POST', body: { plan } }),

  capturePayPalOrder: (shopId: string, orderId: string, plan: 'bas' | 'pro') =>
    apiFetch(`/billing/${shopId}/capture-paypal-order`, { method: 'POST', body: { order_id: orderId, plan } }),

  // Public
  searchShops: (query?: string, city?: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    return apiFetch(`/shops/search?${params.toString()}`);
  },

  getShopBySlug: (slug: string) =>
    apiFetch(`/shops/${slug}`),

  getAvailableSlots: (shopId: string, barberId: string, date: string, serviceId: string) =>
    apiFetch(`/shops/${shopId}/barbers/${barberId}/slots?date=${date}&serviceId=${serviceId}`),

  createBooking: (data: unknown) =>
    apiFetch('/bookings/hold', { method: 'POST', body: data }),

  // Shop Admin
  adminDashboard: (shopId: string) =>
    apiFetch(`/admin/${shopId}/dashboard`),

  adminBookings: (shopId: string) =>
    apiFetch(`/admin/${shopId}/bookings`),

  adminUpdateBookingStatus: (shopId: string, bookingId: string, status: string) =>
    apiFetch(`/admin/${shopId}/bookings/${bookingId}/status`, { method: 'PUT', body: { status } }),

  adminServices: (shopId: string) =>
    apiFetch(`/admin/${shopId}/services`),

  adminCreateService: (shopId: string, data: unknown) =>
    apiFetch(`/admin/${shopId}/services`, { method: 'POST', body: data }),

  adminUpdateService: (shopId: string, serviceId: string, data: { name: string; description?: string; durationMinutes: number; price: number }) =>
    apiFetch(`/admin/${shopId}/services/${serviceId}`, { method: 'PUT', body: data }),

  adminToggleService: (shopId: string, serviceId: string) =>
    apiFetch(`/admin/${shopId}/services/${serviceId}/toggle`, { method: 'PUT' }),

  adminBarbers: (shopId: string) =>
    apiFetch(`/admin/${shopId}/barbers`),

  adminAddBarber: (shopId: string, data: unknown) =>
    apiFetch(`/admin/${shopId}/barbers`, { method: 'POST', body: data }),

  adminCustomers: (shopId: string) =>
    apiFetch(`/admin/${shopId}/customers`),

  adminGetSettings: (shopId: string) =>
    apiFetch(`/admin/${shopId}/settings`),

  adminUpdateSettings: (shopId: string, data: unknown) =>
    apiFetch(`/admin/${shopId}/settings`, { method: 'PUT', body: data }),

  adminNotifications: (shopId: string) =>
    apiFetch(`/admin/${shopId}/notifications`),

  adminMarkNotificationRead: (shopId: string, notificationId: string) =>
    apiFetch(`/admin/${shopId}/notifications/${notificationId}/read`, { method: 'PATCH' }),

  adminMarkAllNotificationsRead: (shopId: string) =>
    apiFetch(`/admin/${shopId}/notifications/read-all`, { method: 'PATCH' }),

  // Super Admin
  superDashboard: () => apiFetch('/super/dashboard'),
  superShops: () => apiFetch('/super/shops'),
  superToggleShop: (shopId: string, action: 'suspend' | 'reactivate') =>
    apiFetch(`/super/shops/${shopId}/status`, { method: 'PUT', body: { action } }),
  superPlans: () => apiFetch('/super/plans'),
  superAuditLogs: () => apiFetch('/super/audit-logs'),
  superChangePassword: (currentPassword: string, newPassword: string) =>
    apiFetch('/super/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),
  superUsers: () => apiFetch('/super/users'),
  superNotifications: () => apiFetch('/super/notifications'),
  superMarkNotificationsRead: () => apiFetch('/super/notifications/read', { method: 'PATCH' }),
  superTrend: () => apiFetch('/super/trend'),
};

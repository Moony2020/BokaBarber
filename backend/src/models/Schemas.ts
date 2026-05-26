import { Schema, model, Document, Types } from 'mongoose';

// ==========================================
// 1. USER MODEL (Global Identity)
// ==========================================
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'shop_admin' | 'barber' | 'customer';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailVerified: boolean;
  shopId?: Types.ObjectId; // Null för Super Admins och globala Kunder tills de associeras med en salong
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'shop_admin', 'barber', 'customer'], required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phoneNumber: { type: String },
  emailVerified: { type: Boolean, default: false },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', index: true }
}, { timestamps: true });

// ==========================================
// 2. SHOP MODEL (Tenant)
// ==========================================
export interface IShop extends Document {
  name: string;
  slug: string; // T.ex. "royal-cuts" för bokabarber.se/royal-cuts
  logo?: string;
  images: string[];
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String },
  images: [{ type: String }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Sweden' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [18.0686, 59.3293] } // [longitude, latitude] (Stockholm default)
    }
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ShopSchema.index({ 'address.coordinates': '2dsphere' });
ShopSchema.index({ slug: 1 });

// ==========================================
// 3. SHOP SETTINGS MODEL (Tenant Settings)
// ==========================================
export interface IShopSettings extends Document {
  shopId: Types.ObjectId;
  cancellationWindowHours: number;
  allowRescheduling: boolean;
  depositPercentage: number;
  paymentMethods: ('online' | 'at_shop' | 'deposit')[];
  currency: string;
  openingHours: {
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    isOpen: boolean;
    openTime: string; // "09:00"
    closeTime: string; // "18:00"
    breaks: { startTime: string; endTime: string; label: string }[];
  }[];
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}

const ShopSettingsSchema = new Schema<IShopSettings>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true, index: true },
  cancellationWindowHours: { type: Number, default: 24 },
  allowRescheduling: { type: Boolean, default: true },
  depositPercentage: { type: Number, default: 0 },
  paymentMethods: [{ type: String, enum: ['online', 'at_shop', 'deposit'], default: ['at_shop'] }],
  currency: { type: String, default: 'SEK' },
  openingHours: [{
    dayOfWeek: { type: Number, required: true },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '18:00' },
    breaks: [{
      startTime: { type: String },
      endTime: { type: String },
      label: { type: String }
    }]
  }],
  smsEnabled: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: false }
});

// ==========================================
// 4. BARBER PROFILE MODEL
// ==========================================
export interface IBarberProfile extends Document {
  userId: Types.ObjectId;
  shopId: Types.ObjectId;
  bio?: string;
  avatar?: string;
  services: Types.ObjectId[];
  customAvailability?: {
    date: Date;
    isOpen: boolean;
    startTime?: string;
    endTime?: string;
  }[];
  isActive: boolean;
}

const BarberProfileSchema = new Schema<IBarberProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  bio: { type: String },
  avatar: { type: String },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  customAvailability: [{
    date: { type: Date },
    isOpen: { type: Boolean },
    startTime: { type: String },
    endTime: { type: String }
  }],
  isActive: { type: Boolean, default: true }
});

BarberProfileSchema.index({ shopId: 1, userId: 1 });

// ==========================================
// 5. CUSTOMER PROFILE MODEL (Tenant Localized)
// ==========================================
export interface ICustomerProfile extends Document {
  userId?: Types.ObjectId; // Optional link to a global registered user
  shopId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  notes?: string;
  bookingCount: number;
}

const CustomerProfileSchema = new Schema<ICustomerProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true },
  notes: { type: String },
  bookingCount: { type: Number, default: 0 }
});

CustomerProfileSchema.index({ shopId: 1, email: 1 });

// ==========================================
// 6. SERVICE MODEL
// ==========================================
export interface IService extends Document {
  shopId: Types.ObjectId;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  depositAmount: number;
  isActive: boolean;
}

const ServiceSchema = new Schema<IService>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

// ==========================================
// 7. BOOKING MODEL (Transactions)
// ==========================================
export interface IBooking extends Document {
  shopId: Types.ObjectId;
  barberId: Types.ObjectId;
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled_by_customer' | 'cancelled_by_shop' | 'rescheduled' | 'completed' | 'no_show';
  totalPrice: number;
  depositPaid: number;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';
  stripePaymentIntentId?: string;
  notes?: string;
  history: {
    status: string;
    modifiedBy: Types.ObjectId;
    timestamp: Date;
    note?: string;
  }[];
}

const BookingSchema = new Schema<IBooking>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  barberId: { type: Schema.Types.ObjectId, ref: 'BarberProfile', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'CustomerProfile', required: true, index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'paid', 'cancelled_by_customer', 'cancelled_by_shop', 'rescheduled', 'completed', 'no_show'], 
    default: 'confirmed' 
  },
  totalPrice: { type: Number, required: true },
  depositPaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'deposit_paid', 'fully_paid', 'refunded'], default: 'unpaid' },
  stripePaymentIntentId: { type: String },
  notes: { type: String },
  history: [{
    status: { type: String },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

// Strict double-booking prevention compound index
BookingSchema.index({ barberId: 1, startTime: 1, endTime: 1, status: 1 });

// ==========================================
// 8. PAYMENT MODEL (Audit Payments)
// ==========================================
export interface IPayment extends Document {
  shopId: Types.ObjectId;
  bookingId: Types.ObjectId;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'cash_at_shop';
  invoiceUrl?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  stripePaymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'SEK' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], required: true },
  paymentMethod: { type: String, enum: ['stripe', 'cash_at_shop'], required: true },
  invoiceUrl: { type: String }
}, { timestamps: true });

// ==========================================
// 9. PLAN MODEL (SaaS)
// ==========================================
export interface IPlan extends Document {
  name: string;
  priceMonthly: number;
  stripePriceId: string;
  features: string[];
  maxBarbers: number;
}

const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true, unique: true },
  priceMonthly: { type: Number, required: true },
  stripePriceId: { type: String, required: true },
  features: [{ type: String }],
  maxBarbers: { type: Number, default: 3 }
});

// ==========================================
// 10. SUBSCRIPTION MODEL (Tenant SaaS Status)
// ==========================================
export interface ISubscription extends Document {
  shopId: Types.ObjectId;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  planId: Types.ObjectId;
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  trialEndsAt: Date;
  currentPeriodEnd: Date;
  gracePeriodEndsAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true, index: true },
  stripeSubscriptionId: { type: String, required: false, unique: true, sparse: true },
  stripeCustomerId: { type: String, required: false },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  status: { type: String, enum: ['trial', 'active', 'past_due', 'suspended', 'cancelled'], required: true },
  trialEndsAt: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  gracePeriodEndsAt: { type: Date }
}, { timestamps: true });

// ==========================================
// 11. REVIEW MODEL
// ==========================================
export interface IReview extends Document {
  shopId: Types.ObjectId;
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  rating: number;
  comment?: string;
  reply?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'CustomerProfile', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  reply: { type: String }
}, { timestamps: true });

// ==========================================
// 12. COUPON MODEL
// ==========================================
export interface ICoupon extends Document {
  shopId?: Types.ObjectId;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt: Date;
  maxRedemptions?: number;
  redemptionCount: number;
}

const CouponSchema = new Schema<ICoupon>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  maxRedemptions: { type: Number },
  redemptionCount: { type: Number, default: 0 }
});
CouponSchema.index({ shopId: 1, code: 1 }, { unique: true });

// ==========================================
// 13. AUDIT LOG MODEL
// ==========================================
export interface IAuditLog extends Document {
  shopId?: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  details: Schema.Types.Mixed;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true }
}, { timestamps: true });

// Expose Mongoose Models
export const User = model<IUser>('User', UserSchema);
export const Shop = model<IShop>('Shop', ShopSchema);
export const ShopSettings = model<IShopSettings>('ShopSettings', ShopSettingsSchema);
export const BarberProfile = model<IBarberProfile>('BarberProfile', BarberProfileSchema);
export const CustomerProfile = model<ICustomerProfile>('CustomerProfile', CustomerProfileSchema);
export const Service = model<IService>('Service', ServiceSchema);
export const Booking = model<IBooking>('Booking', BookingSchema);
export const Payment = model<IPayment>('Payment', PaymentSchema);
export const Plan = model<IPlan>('Plan', PlanSchema);
export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
export const Review = model<IReview>('Review', ReviewSchema);
export const Coupon = model<ICoupon>('Coupon', CouponSchema);
export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);

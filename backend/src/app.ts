import express, { Response, Request } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db';
import {
  User, Shop, ShopSettings, Booking, CustomerProfile,
  Service, BarberProfile, Plan, Subscription, Review, AuditLog
} from './models/Schemas';
import {
  authenticateUser, requireRoles, verifyTenantAccess,
  checkSubscriptionActive, AuthenticatedRequest
} from './middleware/auth';

import Stripe from 'stripe';
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendSubscriptionPaymentWarningEmail,
  sendSubscriptionSuspendedEmail
} from './services/emailService';

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ FATAL ERROR: STRIPE_SECRET_KEY is missing in production.');
    process.exit(1);
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ FATAL ERROR: STRIPE_WEBHOOK_SECRET is missing in production.');
    process.exit(1);
  }
  if (!process.env.CLIENT_URL) {
    console.error('❌ FATAL ERROR: CLIENT_URL is missing in production.');
    process.exit(1);
  }
}

// Instantiate Stripe securely using environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key_for_compilation_safety_2026', {
  apiVersion: '2023-10-16' as any
});

// Configure Express trust proxy for Render / behind proxy environments
app.set('trust proxy', 1);

// Configure CORS first so OPTIONS/Preflight requests succeed immediately
const CLIENT_URL = process.env.CLIENT_URL;
if (!CLIENT_URL && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: CLIENT_URL environment variable is missing in production.');
  process.exit(1);
}

app.use(cors({
  origin: CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Global Helmet Protection
app.use(helmet());

// Global Rate Limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'För många förfrågningar från denna IP-adress, försök igen om 15 minuter.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Auth Rate Limiter: 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'För många inloggningsförsök eller registreringar. Försök igen om 15 minuter.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all API requests
app.use('/api', generalLimiter);

// Apply strict rate limiting to auth/sensitive routes
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register-shop', authLimiter);

// Prevent NoSQL query injection
app.use(mongoSanitize());

// Save raw body for Stripe webhook validation
app.use(express.json({
  verify: (req: any, _res, buf) => {
    if (req.originalUrl?.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(cookieParser());

// Connect Database
connectDB();

// Reusable helper to check and expire active trials for a shop
export const expireTrialsIfNeeded = async (shopId: string | Types.ObjectId): Promise<void> => {
  try {
    const sub = await Subscription.findOne({ shopId: new Types.ObjectId(shopId.toString()) });
    if (sub && sub.status === 'trial' && new Date(sub.trialEndsAt) < new Date()) {
      sub.status = 'suspended';
      await sub.save();
      await Shop.findByIdAndUpdate(shopId, { isActive: false });
      console.log(`[Subscription Guard] Expired trial for shop ${shopId} and set to suspended.`);
    }
  } catch (error) {
    console.error(`Error checking trial expiration for shop ${shopId}:`, error);
  }
};

// Daily cron/job-friendly function for future production use to expire all trials
export const runDailyTrialExpirationCheck = async (): Promise<void> => {
  try {
    const expiredSubs = await Subscription.find({
      status: 'trial',
      trialEndsAt: { $lt: new Date() }
    });
    console.log(`[Cron Job] Found ${expiredSubs.length} expired trials to suspend.`);
    for (const sub of expiredSubs) {
      sub.status = 'suspended';
      await sub.save();
      await Shop.findByIdAndUpdate(sub.shopId, { isActive: false });
      console.log(`[Cron Job] Suspended trial for shop ${sub.shopId}.`);
    }
  } catch (error) {
    console.error('[Cron Job] Error running daily trial expiration check:', error);
  }
};

// Middleware to handle express-validator results
const validateRequest = (req: Request, res: Response, next: express.NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Standardize error message to match frontend expectations
    const firstError = errors.array()[0].msg;
    res.status(400).json({ error: firstError, errors: errors.array() });
    return;
  }
  next();
};

// ===========================================================================
// 🗝️ AUTH ROUTES
// ===========================================================================

// Register Shop + Admin
app.post('/api/v1/auth/register-shop', 
  [
    body('email').isEmail().withMessage('Ogiltig e-postadress.'),
    body('password').isLength({ min: 6 }).withMessage('Lösenordet måste vara minst 6 tecken.'),
    body('firstName').notEmpty().withMessage('Förnamn krävs.'),
    body('lastName').notEmpty().withMessage('Efternamn krävs.'),
    body('shopName').notEmpty().withMessage('Salongsnamn krävs.'),
    body('slug').matches(/^[a-z0-9-]+$/).withMessage('Ogiltig webbadress.'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, shopName, slug, address } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'E-postadressen är redan registrerad.' });
    }

    const existingShop = await Shop.findOne({ slug });
    if (existingShop) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Webbadressen (slug) används redan av en annan salong.' });
    }

    const newShop = new Shop({
      name: shopName,
      slug: slug.toLowerCase().trim(),
      address: {
        street: address.street,
        city: address.city,
        zipCode: address.zipCode,
        country: address.country || 'Sweden'
      }
    });
    const savedShop = await newShop.save({ session });

    const defaultSettings = new ShopSettings({
      shopId: savedShop._id,
      openingHours: [
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
        { dayOfWeek: 6, isOpen: false, openTime: '10:00', closeTime: '15:00', breaks: [] },
        { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '15:00', breaks: [] }
      ]
    });
    await defaultSettings.save({ session });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email, passwordHash, role: 'shop_admin',
      firstName, lastName, shopId: savedShop._id, emailVerified: false
    });
    const savedUser = await newUser.save({ session });

    // Fetch default "Bas" plan
    const plan = await Plan.findOne({ name: 'Bas' });
    if (!plan) {
      throw new Error('Default Bas plan not found in database. Seed the database first.');
    }

    const defaultSubscription = new Subscription({
      shopId: savedShop._id,
      planId: plan._id,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });
    await defaultSubscription.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Salong och administratörskonto har skapats framgångsrikt!',
      shopId: savedShop._id, userId: savedUser._id
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Registreringsfel:', error);
    return res.status(500).json({ error: 'Ett internt fel uppstod vid registreringen.' });
  }
});

// Login
app.post('/api/v1/auth/login', 
  [
    body('email').isEmail().withMessage('Ogiltig e-postadress.'),
    body('password').notEmpty().withMessage('Lösenord krävs.'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Felaktig e-postadress eller lösenord.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Felaktig e-postadress eller lösenord.' });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, shopId: user.shopId?.toString() },
      JWT_SECRET, { expiresIn: '7d' }
    );

    res.cookie('accessToken', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Inloggningen lyckades!',
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, shopId: user.shopId }
    });
  } catch (error) {
    console.error('Inloggningsfel:', error);
    return res.status(500).json({ error: 'Ett internt fel uppstod vid inloggningen.' });
  }
});

// Logout
app.post('/api/v1/auth/logout', (_req, res) => {
  res.clearCookie('accessToken');
  return res.json({ message: 'Du har loggats ut.' });
});

// Get profile
app.get('/api/v1/auth/me', authenticateUser, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// ===========================================================================
// 🌐 PUBLIC SHOP ROUTES (Used by Search page & Booking page)
// ===========================================================================

// Helper to escape regex special characters (prevents ReDoS and injection)
const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// Search shops — supports ?city=, ?q=, ?service= query params
app.get('/api/v1/shops/search', async (req, res) => {
  try {
    const { city, q, service } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (city) {
      filter['address.city'] = { $regex: new RegExp(escapeRegExp(city as string), 'i') };
    }
    
    if (q) {
      const escapedQ = escapeRegExp(q as string);
      filter.$or = [
        { name: { $regex: new RegExp(escapedQ, 'i') } },
        { 'address.city': { $regex: new RegExp(escapedQ, 'i') } },
        { 'address.street': { $regex: new RegExp(escapedQ, 'i') } }
      ];
    }

    let shops = await Shop.find(filter).lean();

    // If searching by service name, filter shops that have a matching service
    if (service) {
      const shopIds = await Service.distinct('shopId', {
        name: { $regex: new RegExp(escapeRegExp(service as string), 'i') }, isActive: true
      });
      shops = shops.filter(s => shopIds.some((id: Types.ObjectId) => id.toString() === (s._id as Types.ObjectId).toString()));
    }

    // Dynamically filter active/trial and fully ready salons
    const verifiedShops = await Promise.all(
      shops.map(async (shop) => {
        // Run trial expiration detector
        await expireTrialsIfNeeded(shop._id);

        // 1. Subscription Status validation
        const sub = await Subscription.findOne({ shopId: shop._id });
        if (!sub) return null;
        if (sub.status !== 'trial' && sub.status !== 'active') return null;

        // 2. Active service verification
        const serviceCount = await Service.countDocuments({ shopId: shop._id, isActive: true });
        if (serviceCount === 0) return null;

        // 3. Active barber verification
        const barberCount = await BarberProfile.countDocuments({ shopId: shop._id, isActive: true });
        if (barberCount === 0) return null;

        // 4. Opening hours verification
        const settings = await ShopSettings.findOne({ shopId: shop._id });
        const hasOpeningHours = settings?.openingHours?.some(oh => oh.isOpen) ?? false;
        if (!hasOpeningHours) return null;

        return shop;
      })
    );

    shops = verifiedShops.filter(Boolean) as any[];

    return res.json({ shops });
  } catch (error) {
    console.error('Sökfel:', error);
    return res.status(500).json({ error: 'Kunde inte söka salonger.' });
  }
});

// Get single shop by slug (public booking page)
app.get('/api/v1/shops/:slug', async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug }).lean();
    if (!shop) return res.status(404).json({ error: 'Salongen hittades inte.' });

    // Run trial expiration detector
    await expireTrialsIfNeeded(shop._id);

    const settings = await ShopSettings.findOne({ shopId: shop._id }).lean();
    const services = await Service.find({ shopId: shop._id, isActive: true }).lean();
    const barberProfiles = await BarberProfile.find({ shopId: shop._id, isActive: true }).lean();

    // Populate barber user names
    const barbers = await Promise.all(barberProfiles.map(async (bp) => {
      const user = await User.findById(bp.userId).lean();
      return {
        _id: bp._id,
        name: user ? `${user.firstName} ${user.lastName}` : 'Okänd frisör',
        bio: bp.bio,
        avatar: bp.avatar,
        services: bp.services
      };
    }));

    const reviews = await Review.find({ shopId: shop._id }).sort({ createdAt: -1 }).limit(10).lean();

    // Evaluate subscription and readiness statusFlag
    const sub = await Subscription.findOne({ shopId: shop._id });
    let statusFlag: 'ready' | 'not_ready' | 'suspended' = 'ready';

    if (!sub || sub.status === 'suspended' || sub.status === 'cancelled' || (sub.status === 'trial' && new Date(sub.trialEndsAt) < new Date())) {
      statusFlag = 'suspended';
    } else {
      const hasOpeningHours = settings?.openingHours?.some(oh => oh.isOpen) ?? false;
      if (services.length === 0 || barbers.length === 0 || !hasOpeningHours) {
        statusFlag = 'not_ready';
      }
    }

    return res.json({ shop, settings, services, barbers, reviews, statusFlag });
  } catch (error) {
    console.error('Hämtningsfel:', error);
    return res.status(500).json({ error: 'Kunde inte hämta salongsdata.' });
  }
});

// Get available time slots for a barber on a specific date
app.get('/api/v1/shops/:shopId/barbers/:barberId/slots', async (req, res) => {
  try {
    const { shopId, barberId } = req.params;
    const { date, serviceId } = req.query;
    if (!date || !serviceId) return res.status(400).json({ error: 'Datum och tjänst-ID krävs.' });

    const settings = await ShopSettings.findOne({ shopId: new Types.ObjectId(shopId) });
    if (!settings) return res.status(404).json({ error: 'Salonginställningar hittades inte.' });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Tjänsten hittades inte.' });

    const dateObj = new Date(date as string);
    const dayOfWeek = dateObj.getDay();
    const daySettings = settings.openingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!daySettings || !daySettings.isOpen) return res.json({ slots: [] });

    // Parse open/close times
    const [openH, openM] = daySettings.openTime.split(':').map(Number);
    const [closeH, closeM] = daySettings.closeTime.split(':').map(Number);

    // Get all existing bookings for this barber on this date
    const dayStart = new Date(date as string);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date as string);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      barberId: new Types.ObjectId(barberId),
      status: { $in: ['confirmed', 'paid', 'pending', 'rescheduled'] },
      startTime: { $gte: dayStart, $lte: dayEnd }
    }).lean();

    // Generate available slots
    const slots: string[] = [];
    const slotDuration = service.durationMinutes;
    let currentMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    while (currentMinutes + slotDuration <= closeMinutes) {
      const slotStart = new Date(date as string);
      slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

      // Check if slot overlaps with any break
      const isInBreak = daySettings.breaks.some(brk => {
        const [bsH, bsM] = brk.startTime.split(':').map(Number);
        const [beH, beM] = brk.endTime.split(':').map(Number);
        const bStart = bsH * 60 + bsM;
        const bEnd = beH * 60 + beM;
        return currentMinutes < bEnd && (currentMinutes + slotDuration) > bStart;
      });

      // Check if slot overlaps with existing booking
      const isBooked = existingBookings.some(b => {
        return slotStart < new Date(b.endTime) && slotEnd > new Date(b.startTime);
      });

      if (!isInBreak && !isBooked) {
        const hh = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
        const mm = String(currentMinutes % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }

      currentMinutes += 15; // 15 min interval
    }

    return res.json({ slots });
  } catch (error) {
    console.error('Slot-fel:', error);
    return res.status(500).json({ error: 'Kunde inte hämta lediga tider.' });
  }
});

// ===========================================================================
// 📅 BOOKING ENGINE (ACID transactions for double-booking prevention)
// ===========================================================================

app.post('/api/v1/bookings/hold', async (req, res) => {
  const { shopId, barberId, serviceId, startTime, customerData } = req.body;

  if (!shopId || !barberId || !serviceId || !startTime || !customerData) {
    return res.status(400).json({ error: 'Alla bokningsparametrar måste anges.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Ensure subscription is active or in a valid trial state
    await expireTrialsIfNeeded(shopId);
    const sub = await Subscription.findOne({ shopId: new Types.ObjectId(shopId) }).session(session);
    if (!sub || sub.status === 'suspended' || sub.status === 'cancelled' || (sub.status === 'trial' && new Date(sub.trialEndsAt) < new Date())) {
      await session.abortTransaction(); session.endSession();
      return res.status(402).json({
        error: 'Denna salong tar inte emot bokningar just nu på grund av abonnemangsstatus.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    const service = await Service.findById(serviceId).session(session);
    if (!service || !service.isActive) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Tjänsten hittades inte eller är inaktiv.' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    // Check for overlapping bookings
    const overlap = await Booking.findOne({
      shopId: new Types.ObjectId(shopId),
      barberId: new Types.ObjectId(barberId),
      status: { $in: ['confirmed', 'paid', 'rescheduled', 'pending'] },
      startTime: { $lt: end }, endTime: { $gt: start }
    }).session(session);

    if (overlap) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({
        error: 'Den valda tiden är tyvärr upptagen.',
        code: 'TIME_SLOT_TAKEN'
      });
    }

    // Find or create customer profile for this shop
    let customer = await CustomerProfile.findOne({
      shopId: new Types.ObjectId(shopId),
      email: customerData.email.toLowerCase().trim()
    }).session(session);

    if (!customer) {
      customer = new CustomerProfile({
        shopId: new Types.ObjectId(shopId),
        firstName: customerData.firstName, lastName: customerData.lastName,
        email: customerData.email.toLowerCase().trim(),
        phoneNumber: customerData.phoneNumber, bookingCount: 1
      });
      await customer.save({ session });
    } else {
      customer.bookingCount += 1;
      await customer.save({ session });
    }

    const newBooking = new Booking({
      shopId: new Types.ObjectId(shopId),
      barberId: new Types.ObjectId(barberId),
      customerId: customer._id, serviceId: service._id,
      startTime: start, endTime: end,
      status: 'confirmed', totalPrice: service.price,
      depositPaid: 0, paymentStatus: 'unpaid',
      history: [{ status: 'confirmed', modifiedBy: customer._id, note: 'Bokning skapad online.' }]
    });

    const savedBooking = await newBooking.save({ session });
    await session.commitTransaction(); session.endSession();

    // Send email notification in the background
    (async () => {
      try {
        const dbShop = await Shop.findById(shopId);
        const dbBarberProfile = await BarberProfile.findById(barberId);
        const dbBarberUser = dbBarberProfile ? await User.findById(dbBarberProfile.userId) : null;
        
        const barberName = dbBarberUser ? `${dbBarberUser.firstName} ${dbBarberUser.lastName}` : 'Okänd frisör';
        const shopAddressStr = dbShop ? `${dbShop.address.street}, ${dbShop.address.city}` : 'Salongen';
        
        await sendBookingConfirmationEmail({
          customerEmail: customerData.email.toLowerCase().trim(),
          customerName: `${customerData.firstName} ${customerData.lastName}`,
          shopName: dbShop?.name || 'Vår salong',
          serviceName: service.name,
          barberName,
          startTime: start,
          price: service.price,
          shopAddress: shopAddressStr
        });
      } catch (err) {
        console.error('Error sending confirmation email:', err);
      }
    })();

    return res.status(201).json({ message: 'Bokningen har bekräftats!', booking: savedBooking });
  } catch (error) {
    await session.abortTransaction(); session.endSession();
    console.error('Bokningsfel:', error);
    return res.status(500).json({ error: 'Ett fel uppstod vid bokningen.' });
  }
});

// ===========================================================================
// 💈 SHOP ADMIN ROUTES (Protected: shop_admin + tenant isolation)
// ===========================================================================

// Dashboard stats
app.get('/api/v1/admin/:shopId/dashboard', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = new Types.ObjectId(req.params.shopId);

    // Run trial expiration detector
    await expireTrialsIfNeeded(shopId);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayBookings, monthBookings, totalCustomers, activeBarbers, sub] = await Promise.all([
      Booking.countDocuments({ shopId, startTime: { $gte: today, $lt: tomorrow } }),
      Booking.find({
        shopId,
        createdAt: { $gte: monthStart },
        $or: [
          { status: { $in: ['paid', 'completed'] } },
          { paymentStatus: 'paid' }
        ]
      }).lean(),
      CustomerProfile.countDocuments({ shopId }),
      BarberProfile.countDocuments({ shopId, isActive: true }),
      Subscription.findOne({ shopId })
    ]);

    const monthRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return res.json({
      todayBookings, monthRevenue, totalCustomers, activeBarbers,
      totalMonthBookings: monthBookings.length,
      subscription: sub ? {
        status: sub.status,
        trialEndsAt: sub.trialEndsAt,
        gracePeriodEndsAt: sub.gracePeriodEndsAt
      } : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta statistik.' });
  }
});

// Get all bookings for shop
app.get('/api/v1/admin/:shopId/bookings', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = new Types.ObjectId(req.params.shopId);
    const bookings = await Booking.find({ shopId })
      .populate('customerId').populate('serviceId')
      .sort({ startTime: -1 }).lean();

    // Attach barber names
    const enriched = await Promise.all(bookings.map(async (b) => {
      const bp = await BarberProfile.findById(b.barberId).lean();
      const barberUser = bp ? await User.findById(bp.userId).lean() : null;
      return {
        ...b,
        barberName: barberUser ? `${barberUser.firstName} ${barberUser.lastName}` : 'Okänd',
        customerName: (b.customerId as any)?.firstName ? `${(b.customerId as any).firstName} ${(b.customerId as any).lastName}` : 'Gäst',
        serviceName: (b.serviceId as any)?.name || 'Okänd tjänst',
        servicePrice: (b.serviceId as any)?.price || 0
      };
    }));

    return res.json({ bookings: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta bokningar.' });
  }
});

// Update booking status
app.put('/api/v1/admin/:shopId/bookings/:bookingId/status', 
  authenticateUser, 
  requireRoles('shop_admin', 'super_admin'), 
  verifyTenantAccess, 
  [
    body('status').isIn(['pending', 'confirmed', 'paid', 'cancelled_by_customer', 'cancelled_by_shop', 'rescheduled', 'completed', 'no_show'])
      .withMessage('Ogiltig status.'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, shopId: new Types.ObjectId(req.params.shopId) },
      {
        status,
        $push: { history: { status, modifiedBy: new Types.ObjectId(req.user!.userId), note: `Status ändrad till ${status}` } }
      },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Bokning hittades inte.' });

    await AuditLog.create({
      shopId: new Types.ObjectId(req.params.shopId),
      userId: new Types.ObjectId(req.user!.userId),
      action: 'booking_status_updated',
      details: { bookingId: req.params.bookingId, status },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    // Send cancellation email in the background if status is changed to cancelled
    if (status === 'cancelled_by_customer' || status === 'cancelled_by_shop') {
      (async () => {
        try {
          const dbShop = await Shop.findById(req.params.shopId);
          const dbCustomer = await CustomerProfile.findById(booking.customerId);
          const dbService = await Service.findById(booking.serviceId);
          
          if (dbCustomer && dbShop && dbService) {
            await sendBookingCancellationEmail({
              customerEmail: dbCustomer.email,
              customerName: `${dbCustomer.firstName} ${dbCustomer.lastName}`,
              shopName: dbShop.name,
              serviceName: dbService.name,
              startTime: booking.startTime
            });
          }
        } catch (err) {
          console.error('Error sending cancellation email:', err);
        }
      })();
    }

    return res.json({ booking });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte uppdatera bokning.' });
  }
});

// Get services for shop
app.get('/api/v1/admin/:shopId/services', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const services = await Service.find({ shopId: new Types.ObjectId(req.params.shopId) });
    return res.json({ services });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta tjänster.' });
  }
});

// Create service
app.post('/api/v1/admin/:shopId/services', 
  authenticateUser, 
  requireRoles('shop_admin', 'super_admin'), 
  verifyTenantAccess, 
  checkSubscriptionActive, 
  [
    body('name').notEmpty().withMessage('Namn krävs.'),
    body('durationMinutes').isInt({ min: 1 }).withMessage('Ogiltig tid.'),
    body('price').isFloat({ min: 0 }).withMessage('Ogiltigt pris.'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, durationMinutes, price } = req.body;
    const service = new Service({
      shopId: new Types.ObjectId(req.params.shopId),
      name, description, durationMinutes, price, isActive: true
    });
    await service.save();

    await AuditLog.create({
      shopId: new Types.ObjectId(req.params.shopId),
      userId: new Types.ObjectId(req.user!.userId),
      action: 'service_created',
      details: { serviceId: service._id, name },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(201).json({ service });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte skapa tjänst.' });
  }
});

// Toggle service active/inactive
app.put('/api/v1/admin/:shopId/services/:serviceId/toggle', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = await Service.findOne({ _id: req.params.serviceId, shopId: new Types.ObjectId(req.params.shopId) });
    if (!service) return res.status(404).json({ error: 'Tjänst hittades inte.' });
    service.isActive = !service.isActive;
    await service.save();

    await AuditLog.create({
      shopId: new Types.ObjectId(req.params.shopId),
      userId: new Types.ObjectId(req.user!.userId),
      action: 'service_toggled',
      details: { serviceId: req.params.serviceId, isActive: service.isActive },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.json({ service });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte ändra tjänststatus.' });
  }
});

// Get barbers for shop
app.get('/api/v1/admin/:shopId/barbers', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profiles = await BarberProfile.find({ shopId: new Types.ObjectId(req.params.shopId) }).lean();
    const barbers = await Promise.all(profiles.map(async (bp) => {
      const user = await User.findById(bp.userId).lean();
      const serviceNames = await Service.find({ _id: { $in: bp.services } }).lean();
      return {
        _id: bp._id, userId: bp.userId, bio: bp.bio, avatar: bp.avatar,
        isActive: bp.isActive,
        name: user ? `${user.firstName} ${user.lastName}` : 'Okänd',
        email: user?.email || '',
        services: serviceNames.map(s => s.name)
      };
    }));
    return res.json({ barbers });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta frisörer.' });
  }
});

// Add barber
app.post('/api/v1/admin/:shopId/barbers', 
  authenticateUser, 
  requireRoles('shop_admin', 'super_admin'), 
  verifyTenantAccess, 
  checkSubscriptionActive, 
  [
    body('email').isEmail().withMessage('Ogiltig e-postadress.'),
    body('password').isLength({ min: 6 }).withMessage('Lösenordet måste vara minst 6 tecken.'),
    body('firstName').notEmpty().withMessage('Förnamn krävs.'),
    body('lastName').notEmpty().withMessage('Efternamn krävs.'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, bio, serviceIds } = req.body;
    const shopId = new Types.ObjectId(req.params.shopId);

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'E-postadressen används redan.' });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ email, passwordHash, role: 'barber', firstName, lastName, shopId, emailVerified: true });
    const savedUser = await user.save();

    const profile = new BarberProfile({
      userId: savedUser._id, shopId, bio,
      services: serviceIds?.map((id: string) => new Types.ObjectId(id)) || [],
      isActive: true
    });
    await profile.save();

    await AuditLog.create({
      shopId,
      userId: new Types.ObjectId(req.user!.userId),
      action: 'barber_added',
      details: { barberId: profile._id, email },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(201).json({ message: 'Frisör tillagd!', barber: { name: `${firstName} ${lastName}`, email } });
  } catch (error) {
    console.error('Barber creation error:', error);
    return res.status(500).json({ error: 'Kunde inte lägga till frisör.' });
  }
});

// Get customers for shop
app.get('/api/v1/admin/:shopId/customers', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await CustomerProfile.find({ shopId: new Types.ObjectId(req.params.shopId) })
      .sort({ bookingCount: -1 });
    return res.json({ customers });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta kunder.' });
  }
});

// Get & Update shop settings
app.get('/api/v1/admin/:shopId/settings', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await ShopSettings.findOne({ shopId: new Types.ObjectId(req.params.shopId) });
    const shop = await Shop.findById(req.params.shopId);
    
    // Safety fallback: if existing shop settings don't have acceptedPaymentMethods yet, set them to default
    if (settings && (!settings.acceptedPaymentMethods || settings.acceptedPaymentMethods.length === 0)) {
      settings.acceptedPaymentMethods = ['swish', 'card'];
      await settings.save();
    }
    
    return res.json({ settings, shop });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta inställningar.' });
  }
});

app.put('/api/v1/admin/:shopId/settings', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cancellationWindowHours, allowRescheduling, depositPercentage, paymentMethods, acceptedPaymentMethods, openingHours } = req.body;
    const settings = await ShopSettings.findOneAndUpdate(
      { shopId: new Types.ObjectId(req.params.shopId) },
      { $set: { cancellationWindowHours, allowRescheduling, depositPercentage, paymentMethods, acceptedPaymentMethods, openingHours } },
      { new: true }
    );

    await AuditLog.create({
      shopId: new Types.ObjectId(req.params.shopId),
      userId: new Types.ObjectId(req.user!.userId),
      action: 'settings_updated',
      details: { cancellationWindowHours, depositPercentage },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.json({ settings });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte spara inställningar.' });
  }
});

// ===========================================================================
// 👑 SUPER ADMIN ROUTES
// ===========================================================================

// Platform dashboard
app.get('/api/v1/super/dashboard', authenticateUser, requireRoles('super_admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Run trial expiration detector for all shops
    const allShops = await Shop.find().lean();
    for (const shop of allShops) {
      await expireTrialsIfNeeded(shop._id);
    }

    const [totalShops, activeShops, suspendedSubs, totalBookings, totalUsers] = await Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ isActive: true }),
      Subscription.countDocuments({ status: 'suspended' }),
      Booking.countDocuments(),
      User.countDocuments()
    ]);

    const subs = await Subscription.find({ status: { $in: ['active', 'past_due'] } }).populate('planId').lean();
    const mrr = subs.reduce((sum, s) => sum + ((s.planId as any)?.priceMonthly || 0), 0);

    return res.json({ totalShops, activeShops, suspendedSubs, totalBookings, totalUsers, mrr });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta plattformsstatistik.' });
  }
});

// List all shops with subscription info
app.get('/api/v1/super/shops', authenticateUser, requireRoles('super_admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const shops = await Shop.find().lean();
    const enriched = await Promise.all(shops.map(async (shop) => {
      // Expiry trial detector
      await expireTrialsIfNeeded(shop._id);

      const owner = await User.findOne({ shopId: shop._id, role: 'shop_admin' }).lean();
      const sub = await Subscription.findOne({ shopId: shop._id }).populate('planId').lean();

      // Calculate readiness status
      const serviceCount = await Service.countDocuments({ shopId: shop._id, isActive: true });
      const barberCount = await BarberProfile.countDocuments({ shopId: shop._id, isActive: true });
      const settings = await ShopSettings.findOne({ shopId: shop._id });
      const hasOpeningHours = settings?.openingHours?.some(oh => oh.isOpen) ?? false;
      const isReady = serviceCount > 0 && barberCount > 0 && hasOpeningHours;

      return {
        ...shop,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Okänd',
        ownerEmail: owner?.email || '',
        planName: sub ? (sub.planId as any)?.name || 'Okänd' : 'Ingen plan',
        subStatus: sub?.status || 'no_subscription',
        mrr: sub?.status === 'active' ? ((sub.planId as any)?.priceMonthly || 0) : 0,
        isReady
      };
    }));
    return res.json({ shops: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta salonger.' });
  }
});

// Suspend / Reactivate shop
app.put('/api/v1/super/shops/:shopId/status', 
  authenticateUser, 
  requireRoles('super_admin'), 
  [
    body('action').isIn(['suspend', 'reactivate']).withMessage('Ogiltig åtgärd.'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action } = req.body; // 'suspend' | 'reactivate'
    const shopId = new Types.ObjectId(req.params.shopId);

    if (action === 'suspend') {
      await Shop.findByIdAndUpdate(shopId, { isActive: false });
      await Subscription.findOneAndUpdate({ shopId }, { status: 'suspended' });
    } else if (action === 'reactivate') {
      await Shop.findByIdAndUpdate(shopId, { isActive: true });
      await Subscription.findOneAndUpdate({ shopId }, { status: 'active' });
    }

    await AuditLog.create({
      shopId, userId: new Types.ObjectId(req.user!.userId),
      action: action === 'suspend' ? 'shop_suspended' : 'shop_reactivated',
      details: { action }, ipAddress: req.ip || 'unknown', userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.json({ message: action === 'suspend' ? 'Salongen har stängts av.' : 'Salongen har återaktiverats.' });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte ändra salongsstatus.' });
  }
});

// Get plans
app.get('/api/v1/super/plans', authenticateUser, requireRoles('super_admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await Plan.find();
    return res.json({ plans });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta planer.' });
  }
});

// Get audit logs
app.get('/api/v1/super/audit-logs', authenticateUser, requireRoles('super_admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100)
      .populate('userId', 'firstName lastName email').lean();

    const enriched = await Promise.all(logs.map(async (log) => {
      let shopName = 'Plattform';
      if (log.shopId) {
        const shop = await Shop.findById(log.shopId).lean();
        shopName = shop?.name || 'Okänd';
      }
      return { ...log, shopName };
    }));

    return res.json({ logs: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte hämta loggar.' });
  }
});

// ===========================================================================
// 💳 STRIPE BILLING & CHECKOUT ROUTES
// ===========================================================================

// Create checkout session for Shop Admin subscription
app.post('/api/v1/billing/:shopId/create-checkout-session', authenticateUser, requireRoles('shop_admin', 'super_admin'), verifyTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = new Types.ObjectId(req.params.shopId);
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Abonnemangsplan-ID (planId) krävs.' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Abonnemangsplanen hittades inte.' });
    }

    const owner = await User.findOne({ shopId, role: 'shop_admin' });
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripePriceId && plan.stripePriceId !== 'price_bas_placeholder' && plan.stripePriceId !== 'price_pro_placeholder'
          ? plan.stripePriceId
          : 'price_1Q5vM7RHalytsNI9alPriceBas', // Test price ID fallback
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/${shopId}?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/${shopId}?checkout_cancel=true`,
      customer_email: owner?.email,
      metadata: {
        shopId: shopId.toString(),
        planId: planId.toString()
      }
    });

    return res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: 'Kunde inte skapa Stripe checkout-session.' });
  }
});

// Stripe Webhook handler
app.post('/api/v1/billing/webhook', async (req: any, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;

  // Critical Security: Webhook secret MUST be configured
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is missing. Rejecting webhook.');
    return res.status(500).json({ error: 'Webhook configuration missing' });
  }

  // Critical Security: Reject requests without signature or raw body
  if (!signature || !req.rawBody) {
    console.warn('⚠️ Webhook received without signature or rawBody.');
    return res.status(400).send('Webhook Error: Missing signature or raw body');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature as string,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`❌ Stripe Webhook signaturfel: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const shopId = session.metadata?.shopId;
        const planId = session.metadata?.planId;
        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        if (shopId && planId) {
          // Save active subscription to MongoDB
          await Subscription.findOneAndUpdate(
            { shopId: new Types.ObjectId(shopId) },
            {
              stripeSubscriptionId,
              stripeCustomerId,
              planId: new Types.ObjectId(planId),
              status: 'active',
              trialEndsAt: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            { upsert: true, new: true }
          );

          // Activate the salon
          await Shop.findByIdAndUpdate(new Types.ObjectId(shopId), { isActive: true });
          console.log(`✅ Salong ${shopId} har aktiverat abonnemang ${planId}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const status = sub.status;
        const stripeSubscriptionId = sub.id;

        let mappedStatus: 'active' | 'past_due' | 'suspended' | 'trial' | 'cancelled' = 'active';
        if (status === 'active') mappedStatus = 'active';
        else if (status === 'past_due') mappedStatus = 'past_due';
        else if (status === 'trialing') mappedStatus = 'trial';
        else if (status === 'canceled' || status === 'unpaid') mappedStatus = 'suspended';

        const dbSub = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId },
          { status: mappedStatus, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
          { new: true }
        );

        if (dbSub) {
          if (mappedStatus === 'suspended') {
            await Shop.findByIdAndUpdate(dbSub.shopId, { isActive: false });
            const shop = await Shop.findById(dbSub.shopId);
            const owner = await User.findOne({ shopId: dbSub.shopId, role: 'shop_admin' });
            if (shop && owner) {
              await sendSubscriptionSuspendedEmail({
                ownerEmail: owner.email,
                ownerName: `${owner.firstName} ${owner.lastName}`,
                shopName: shop.name
              });
            }
          } else if (mappedStatus === 'past_due') {
            const gracePeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await Subscription.findByIdAndUpdate(dbSub._id, { gracePeriodEndsAt });
            const shop = await Shop.findById(dbSub.shopId);
            const owner = await User.findOne({ shopId: dbSub.shopId, role: 'shop_admin' });
            if (shop && owner) {
              await sendSubscriptionPaymentWarningEmail({
                ownerEmail: owner.email,
                ownerName: `${owner.firstName} ${owner.lastName}`,
                shopName: shop.name,
                gracePeriodEndsAt
              });
            }
          } else if (mappedStatus === 'active') {
            await Shop.findByIdAndUpdate(dbSub.shopId, { isActive: true });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const stripeSubscriptionId = sub.id;
        
        const dbSub = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId },
          { status: 'cancelled' },
          { new: true }
        );

        if (dbSub) {
          await Shop.findByIdAndUpdate(dbSub.shopId, { isActive: false });
          const shop = await Shop.findById(dbSub.shopId);
          const owner = await User.findOne({ shopId: dbSub.shopId, role: 'shop_admin' });
          if (shop && owner) {
            await sendSubscriptionSuspendedEmail({
              ownerEmail: owner.email,
              ownerName: `${owner.firstName} ${owner.lastName}`,
              shopName: shop.name
            });
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const stripeSubscriptionId = invoice.subscription as string;
        if (stripeSubscriptionId) {
          const gracePeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const dbSub = await Subscription.findOneAndUpdate(
            { stripeSubscriptionId },
            { status: 'past_due', gracePeriodEndsAt },
            { new: true }
          );

          if (dbSub) {
            const shop = await Shop.findById(dbSub.shopId);
            const owner = await User.findOne({ shopId: dbSub.shopId, role: 'shop_admin' });
            if (shop && owner) {
              await sendSubscriptionPaymentWarningEmail({
                ownerEmail: owner.email,
                ownerName: `${owner.firstName} ${owner.lastName}`,
                shopName: shop.name,
                gracePeriodEndsAt
              });
            }
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const stripeSubscriptionId = invoice.subscription as string;
        if (stripeSubscriptionId) {
          const dbSub = await Subscription.findOneAndUpdate(
            { stripeSubscriptionId },
            { status: 'active', gracePeriodEndsAt: undefined },
            { new: true }
          );
          if (dbSub) {
            await Shop.findByIdAndUpdate(dbSub.shopId, { isActive: true });
          }
        }
        break;
      }
    }
    return res.json({ received: true });
  } catch (webhookErr) {
    console.error('❌ Webhook data processing error:', webhookErr);
    return res.status(500).json({ error: 'Internal processing error' });
  }
});

// Global Production Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ett oväntat fel uppstod.' 
    : err.message || 'Internt serverfel.';
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===========================================================================
// Start Server
// ===========================================================================
app.listen(PORT, () => {
  console.log(`🚀 BokaBarber Backend körs på http://localhost:${PORT}`);
});

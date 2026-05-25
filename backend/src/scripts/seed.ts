import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Plan, Shop, ShopSettings, User, BarberProfile, Service, Subscription } from '../models/Schemas';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';
const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

const seedDatabase = async () => {
  try {
    console.log('🌱 Startar databassådd...');
    try {
      console.log('🔄 Försöker ansluta till MongoDB Atlas...');
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Databasanslutning till Atlas upprättad.');
    } catch (atlasErr) {
      console.warn(`⚠️ Kunde inte ansluta till Atlas under sådd: ${(atlasErr as Error).message}`);
      console.log('🔄 Försöker ansluta till lokal databas fallback...');
      await mongoose.connect(LOCAL_MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Lokal databasanslutning upprättad.');
    }

    // 1. Rensa befintliga data
    await Plan.deleteMany({});
    console.log('🧹 Gamla planer rensade.');

    // 2. Skapa abonnemangsplaner
    const planBas = await new Plan({
      name: 'Bas',
      priceMonthly: 499,
      stripePriceId: 'price_bas_placeholder',
      features: ['Upp till 3 frisörer', 'Onlinebokning', 'E-postpåminnelser'],
      maxBarbers: 3
    }).save();

    const planPro = await new Plan({
      name: 'Professional',
      priceMonthly: 999,
      stripePriceId: 'price_pro_placeholder',
      features: ['Obegränsat antal frisörer', 'Onlinebokning', 'E-postpåminnelser', 'SMS-påminnelser', 'Intäktsstatistik'],
      maxBarbers: 99
    }).save();
    console.log('✔ Abonnemangsplaner sparade (Bas & Professional).');

    // 3. Skapa Super Admin (om inte finns)
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (!existingSuperAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('SuperAdmin123!', salt);
      await new User({
        email: 'admin@bokabarber.se',
        passwordHash,
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true
      }).save();
      console.log('👑 Super Admin skapad:');
      console.log('   E-post: admin@bokabarber.se');
      console.log('   Lösenord: SuperAdmin123!');
    } else {
      console.log('ℹ Super Admin finns redan.');
    }

    // 4. Skapa testsalong om den inte redan finns
    let existingShop = await Shop.findOne({ slug: 'royal-cuts' });
    if (!existingShop) {
      console.log('💈 Skapar testsalongen "Royal Cuts"...');

      const shop = await new Shop({
        name: 'Royal Cuts',
        slug: 'royal-cuts',
        address: {
          street: 'Kungsgatan 12', city: 'Stockholm',
          zipCode: '111 35', country: 'Sweden'
        },
        rating: 4.9, reviewCount: 142
      }).save();

      await new ShopSettings({
        shopId: shop._id,
        paymentMethods: ['at_shop'],
        openingHours: [
          { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '15:00', breaks: [] },
          { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch' }] },
          { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch' }] },
          { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch' }] },
          { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch' }] },
          { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch' }] },
          { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '15:00', breaks: [] }
        ]
      }).save();

      // Tjänster
      const svc1 = await new Service({ shopId: shop._id, name: 'Herrklippning', description: 'Klassisk herrklippning inklusive tvätt och styling.', durationMinutes: 30, price: 450 }).save();
      const svc2 = await new Service({ shopId: shop._id, name: 'Skäggtrimning Deluxe', description: 'Trimning av skägg med kniv, varma omslag och skäggolja.', durationMinutes: 30, price: 350 }).save();
      await new Service({ shopId: shop._id, name: 'Klippning & Skägg Paket', description: 'Vårt mest populära kombipaket.', durationMinutes: 60, price: 700 }).save();

      // Shop Admin
      const salt1 = await bcrypt.genSalt(12);
      const ownerHash = await bcrypt.hash('ShopAdmin123!', salt1);
      await new User({
        email: 'owner@royalcuts.se', passwordHash: ownerHash, role: 'shop_admin',
        firstName: 'Erik', lastName: 'Karlsson', shopId: shop._id, emailVerified: true
      }).save();

      // Barber 1
      const salt2 = await bcrypt.genSalt(12);
      const barberHash1 = await bcrypt.hash('Frisor123!', salt2);
      const barber1 = await new User({
        email: 'johan@royalcuts.se', passwordHash: barberHash1, role: 'barber',
        firstName: 'Johan', lastName: 'Andersson', shopId: shop._id, emailVerified: true
      }).save();
      await new BarberProfile({
        userId: barber1._id, shopId: shop._id,
        bio: 'Mästare på klassiska herrklippningar med 10 års erfarenhet.',
        services: [svc1._id, svc2._id], isActive: true
      }).save();

      // Barber 2
      const salt3 = await bcrypt.genSalt(12);
      const barberHash2 = await bcrypt.hash('Frisor123!', salt3);
      const barber2 = await new User({
        email: 'maria@royalcuts.se', passwordHash: barberHash2, role: 'barber',
        firstName: 'Maria', lastName: 'Berg', shopId: shop._id, emailVerified: true
      }).save();
      await new BarberProfile({
        userId: barber2._id, shopId: shop._id,
        bio: 'Expert på moderna herrtrender och färgning.',
        services: [svc1._id], isActive: true
      }).save();

      // Subscription
      await new Subscription({
        shopId: shop._id,
        stripeSubscriptionId: 'sub_test_royal_cuts',
        stripeCustomerId: 'cus_test_royal_cuts',
        planId: planPro._id,
        status: 'active',
        trialEndsAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }).save();

      console.log('✅ Testsalong med full data skapad!');
      console.log('   Shop Admin: owner@royalcuts.se / ShopAdmin123!');
      console.log('   Frisör 1: johan@royalcuts.se / Frisor123!');
      console.log('   Frisör 2: maria@royalcuts.se / Frisor123!');

      existingShop = shop;
    } else {
      console.log('ℹ Testsalongen "royal-cuts" finns redan.');
    }

    // 5. Skapa en andra salong för att visa sök-funktionen
    const existingShop2 = await Shop.findOne({ slug: 'barber-co' });
    if (!existingShop2) {
      const shop2 = await new Shop({
        name: 'Barber & Co', slug: 'barber-co',
        address: { street: 'Avenyn 18', city: 'Göteborg', zipCode: '411 36', country: 'Sweden' },
        rating: 4.8, reviewCount: 96
      }).save();

      await new ShopSettings({
        shopId: shop2._id,
        openingHours: [
          { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '15:00', breaks: [] },
          { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '19:00', breaks: [] },
          { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '19:00', breaks: [] },
          { dayOfWeek: 3, isOpen: true, openTime: '10:00', closeTime: '19:00', breaks: [] },
          { dayOfWeek: 4, isOpen: true, openTime: '10:00', closeTime: '19:00', breaks: [] },
          { dayOfWeek: 5, isOpen: true, openTime: '10:00', closeTime: '19:00', breaks: [] },
          { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '16:00', breaks: [] }
        ]
      }).save();

      await new Service({ shopId: shop2._id, name: 'Fade Klippning', description: 'Modern fade med ren linje.', durationMinutes: 45, price: 500 }).save();
      await new Service({ shopId: shop2._id, name: 'Skägg Trim', description: 'Snabb skäggtrimning.', durationMinutes: 20, price: 250 }).save();

      const salt4 = await bcrypt.genSalt(12);
      const owner2Hash = await bcrypt.hash('ShopAdmin123!', salt4);
      await new User({
        email: 'anders@barberco.se', passwordHash: owner2Hash, role: 'shop_admin',
        firstName: 'Anders', lastName: 'Lind', shopId: shop2._id, emailVerified: true
      }).save();

      await new Subscription({
        shopId: shop2._id,
        stripeSubscriptionId: 'sub_test_barber_co',
        stripeCustomerId: 'cus_test_barber_co',
        planId: planBas._id,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }).save();

      console.log('✔ Andra testsalongen "Barber & Co" i Göteborg skapad.');
    }

    console.log('\n🚀 Databassådd avslutades framgångsrikt!');
    console.log('\n📋 TESTKONTON:');
    console.log('   👑 Super Admin: admin@bokabarber.se / SuperAdmin123!');
    console.log('   💈 Shop Admin (Royal Cuts): owner@royalcuts.se / ShopAdmin123!');
    console.log('   ✂️ Frisör (Royal Cuts): johan@royalcuts.se / Frisor123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fel vid sådd av databas:', error);
    process.exit(1);
  }
};

seedDatabase();

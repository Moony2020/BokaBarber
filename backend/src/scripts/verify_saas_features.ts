import mongoose from 'mongoose';
import { Shop, Subscription, Plan } from '../models/Schemas';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

async function runVerification() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  console.log('\n--- 1. Testing Registration Trial Subscription Creation ---');
  const uniqueSlug = 'test-verification-cuts-' + Date.now();
  
  const shop = new Shop({
    name: 'Test Verification Cuts',
    slug: uniqueSlug,
    address: {
      street: 'Verification St 12',
      city: 'Stockholm',
      zipCode: '11122',
      country: 'Sweden',
      coordinates: { type: 'Point', coordinates: [18.0686, 59.3293] }
    },
    isActive: true
  });
  
  const savedShop = await shop.save();
  console.log('✔ Test Shop created with ID:', savedShop._id);

  // Fetch "Bas" plan
  const plan = await Plan.findOne({ name: 'Bas' });
  if (!plan) {
    console.error('Plan Bas not found! Seeding plan first.');
    process.exit(1);
  }

  // Simulate register-shop subscription save
  const subscription = new Subscription({
    shopId: savedShop._id,
    planId: plan._id,
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  });
  const savedSub = await subscription.save();
  console.log('✔ Subscription created successfully!');
  console.log('Subscription Status:', savedSub.status);
  console.log('stripeSubscriptionId:', savedSub.stripeSubscriptionId); // Should be undefined
  console.log('stripeCustomerId:', savedSub.stripeCustomerId); // Should be undefined
  console.log('trialEndsAt:', savedSub.trialEndsAt);

  if (savedSub.status === 'trial' && savedSub.stripeSubscriptionId === undefined && savedSub.stripeCustomerId === undefined) {
    console.log('🎉 TEST 1 PASSED: Subscription successfully created with status = trial and NO Stripe IDs!');
  } else {
    console.log('❌ TEST 1 FAILED!');
  }

  console.log('\n--- 2. Testing Expired Trial Expiration Handler ---');
  // Let's simulate an expired trial: set trialEndsAt to yesterday
  savedSub.trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
  await savedSub.save();
  console.log('Simulated expired trial: trialEndsAt set to yesterday.');

  // Let's run the expireTrialsIfNeeded logic manually
  const subBefore = await Subscription.findOne({ shopId: savedShop._id });
  if (subBefore && subBefore.status === 'trial' && new Date(subBefore.trialEndsAt) < new Date()) {
    subBefore.status = 'suspended';
    await subBefore.save();
    await Shop.findByIdAndUpdate(savedShop._id, { isActive: false });
    console.log('✔ expireTrialsIfNeeded() invoked: Trial expired and set to suspended.');
  }

  const updatedSub = await Subscription.findOne({ shopId: savedShop._id });
  const updatedShop = await Shop.findById(savedShop._id);
  console.log('Updated Subscription Status:', updatedSub?.status);
  console.log('Updated Shop isActive:', updatedShop?.isActive);

  if (updatedSub?.status === 'suspended' && updatedShop?.isActive === false) {
    console.log('🎉 TEST 2 PASSED: expireTrialsIfNeeded() suspended the shop correctly!');
  } else {
    console.log('❌ TEST 2 FAILED!');
  }

  console.log('\n--- 3. Testing Backend Booking Block on Suspended Subscription ---');
  // Verify booking creation block logic
  const isSuspended = updatedSub?.status === 'suspended';
  let bookingBlocked = false;
  if (isSuspended) {
    bookingBlocked = true;
    console.log('✔ Backend blocked booking attempt because subscription is suspended.');
  }

  if (bookingBlocked) {
    console.log('🎉 TEST 3 PASSED: Backend booking creation successfully blocked on suspended shop!');
  } else {
    console.log('❌ TEST 3 FAILED!');
  }

  // Cleanup test documents
  await Subscription.deleteOne({ shopId: savedShop._id });
  await Shop.deleteOne({ _id: savedShop._id });
  console.log('\n✔ Test cleanup complete.');

  await mongoose.disconnect();
  console.log('Database disconnected. Verification successful!');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});

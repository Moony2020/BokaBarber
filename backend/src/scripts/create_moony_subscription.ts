import mongoose from 'mongoose';
import { Shop, Plan, Subscription } from '../models/Schemas';

const MONGODB_URI = 'mongodb+srv://mymoon676_db_user:kxWbviWxLRHgAgDk@cluster0.cg5jh48.mongodb.net/bokabarber?appName=Cluster0';

async function createSubscription() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  const slug = 'moony-salong';
  const shop = await Shop.findOne({ slug });

  if (!shop) {
    console.log(`❌ Salong med slug "${slug}" hittades inte i databasen!`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Hittade salong: ${shop.name} (ID: ${shop._id})`);

  // Check if subscription already exists
  const existingSub = await Subscription.findOne({ shopId: shop._id });
  if (existingSub) {
    console.log(`✔ En prenumeration finns redan för denna salong (Status: ${existingSub.status})`);
    await mongoose.disconnect();
    return;
  }

  // Find first available plan
  const plan = await Plan.findOne({ name: 'Professional' }) || await Plan.findOne({});
  if (!plan) {
    console.log('❌ Inga abonnemangsplaner (Plans) hittades i databasen. Kan inte skapa prenumeration.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Använder abonnemangsplan: ${plan.name} (ID: ${plan._id})`);

  // Create new active 14-day trial subscription
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  const subscription = new Subscription({
    shopId: shop._id,
    planId: plan._id,
    status: 'trial',
    trialEndsAt,
    currentPeriodEnd: trialEndsAt
  });

  await subscription.save();
  console.log('✔ Provprenumeration (14-dagars fri testperiod) har skapats framgångsrikt i databasen!');

  // Ensure shop is active
  shop.isActive = true;
  await shop.save();
  console.log('✔ Salongens status har bekräftats som aktiv (isActive: true).');

  await mongoose.disconnect();
  console.log('Databas bortkopplad.');
}

createSubscription().catch(err => {
  console.error(err);
});

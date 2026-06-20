import mongoose from 'mongoose';
import { User, Shop, Subscription } from '../models/Schemas';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL = 'mymoon676@hotmail.com';
const EXTEND_DAYS = 90;

async function restoreSalon() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber');
  console.log('Connected!\n');

  const user = await User.findOne({ email: EMAIL.toLowerCase() });
  if (!user) {
    console.log(`❌ No user found with email: ${EMAIL}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`✔ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

  if (!user.shopId) {
    console.log(`❌ User has no shopId linked.`);
    await mongoose.disconnect();
    return;
  }
  const shop = await Shop.findById(user.shopId);
  if (!shop) {
    console.log(`❌ No shop found with id: ${user.shopId}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`✔ Found shop: "${shop.name}" (slug: ${shop.slug})`);

  const sub = await Subscription.findOne({ shopId: shop._id });
  if (!sub) {
    console.log(`❌ No subscription found for this shop.`);
    await mongoose.disconnect();
    return;
  }

  const newTrialEnd = new Date(Date.now() + EXTEND_DAYS * 24 * 60 * 60 * 1000);
  sub.status = 'trial';
  sub.trialEndsAt = newTrialEnd;
  sub.currentPeriodEnd = newTrialEnd;
  await sub.save();

  shop.isActive = true;
  await shop.save();

  console.log(`\n✅ Salon restored!`);
  console.log(`   Shop: "${shop.name}" → slug: ${shop.slug}`);
  console.log(`   New trial ends: ${newTrialEnd.toLocaleDateString('sv-SE')}`);
  console.log(`\n   Log in at: http://localhost:3000/login`);
  console.log(`   Your dashboard: http://localhost:3000/admin/${shop._id}`);

  await mongoose.disconnect();
}

restoreSalon().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

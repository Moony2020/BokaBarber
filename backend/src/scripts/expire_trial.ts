import mongoose from 'mongoose';
import { Shop, Subscription } from '../models/Schemas';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

async function expireTrial() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected\n');

  const shop = await Shop.findOne({ slug: 'moony-salong' });
  if (!shop) { console.log('❌ moony-salong not found'); await mongoose.disconnect(); return; }

  const sub = await Subscription.findOne({ shopId: shop._id });
  if (!sub) { console.log('❌ No subscription found'); await mongoose.disconnect(); return; }

  console.log(`Before: status=${sub.status}, trialEndsAt=${sub.trialEndsAt}, currentPeriodEnd=${sub.currentPeriodEnd}`);

  // Set trial to have ended 1 day ago — this triggers the paywall
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  sub.status = 'suspended';
  sub.trialEndsAt = yesterday;
  sub.currentPeriodEnd = yesterday;
  await sub.save();

  console.log(`\n✔ Subscription expired. Status: suspended, trialEndsAt: ${sub.trialEndsAt}`);
  console.log('The salon owner will now see the "choose a plan" paywall when they log in.\n');

  await mongoose.disconnect();
}

expireTrial().catch(err => { console.error(err); process.exit(1); });

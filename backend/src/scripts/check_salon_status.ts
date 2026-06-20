import mongoose from 'mongoose';
import { Shop, Subscription } from '../models/Schemas';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function check() {
  await mongoose.connect(MONGODB_URI);
  const shop = await Shop.findOne({ slug: 'moony-salong' });
  if (!shop) { console.log('❌ Shop not found'); await mongoose.disconnect(); return; }

  const sub = await Subscription.findOne({ shopId: shop._id });
  console.log('\n🏪 Shop:');
  console.log('  name:', shop.name);
  console.log('  isActive:', shop.isActive);

  console.log('\n📋 Subscription:');
  console.log('  status:', sub?.status);
  console.log('  trialEndsAt:', sub?.trialEndsAt);
  console.log('  currentPeriodEnd:', sub?.currentPeriodEnd);

  await mongoose.disconnect();
}

check().catch(err => { console.error(err); process.exit(1); });

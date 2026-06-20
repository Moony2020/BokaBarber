import mongoose from 'mongoose';
import { Shop, Service, BarberProfile } from '../models/Schemas';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const shop = await Shop.findOne({ slug: 'moony-salong' }) || await Shop.findOne({ slug: 'moony-salon' });
  if (!shop) {
    console.log('Shop not found');
    await mongoose.disconnect();
    return;
  }

  const services = await Service.find({ shopId: shop._id });
  console.log('\n--- Services in DB ---');
  for (const s of services) {
    console.log(`- Service Name: ${s.name}, ID: ${s._id}, Active: ${s.isActive}`);
  }

  const barbers = await BarberProfile.find({ shopId: shop._id });
  console.log('\n--- Barbers in DB ---');
  for (const b of barbers) {
    console.log(`- Barber ID: ${b._id}, Active: ${b.isActive}, Services: ${JSON.stringify(b.services)}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

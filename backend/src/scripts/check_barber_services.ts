import mongoose from 'mongoose';
import { Shop, Service, BarberProfile } from '../models/Schemas';

const MONGODB_URI = 'mongodb+srv://mymoon676_db_user:kxWbviWxLRHgAgDk@cluster0.cg5jh48.mongodb.net/bokabarber?appName=Cluster0';

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

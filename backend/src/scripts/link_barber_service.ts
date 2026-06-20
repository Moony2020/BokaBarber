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

  const barber = await BarberProfile.findOne({ shopId: shop._id });
  if (!barber) {
    console.log('Barber not found');
    await mongoose.disconnect();
    return;
  }

  const service = await Service.findOne({ shopId: shop._id, name: /Klippning & Skägg/i });
  if (!service) {
    console.log('Service "Klippning & Skägg Paket" not found');
    await mongoose.disconnect();
    return;
  }

  // Check if already linked
  const hasService = barber.services.some(id => id.toString() === service._id.toString());
  if (hasService) {
    console.log('Barber already performs this service');
  } else {
    barber.services.push(service._id);
    await barber.save();
    console.log(`Successfully added "${service.name}" to barber "${barber._id}"!`);
  }

  // Verify updated list
  const updatedBarber = await BarberProfile.findById(barber._id);
  console.log('Updated Barber services array:', JSON.stringify(updatedBarber?.services));

  await mongoose.disconnect();
}

main().catch(console.error);

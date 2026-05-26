import mongoose from 'mongoose';
import { Shop, Service, BarberProfile, ShopSettings, Subscription } from '../models/Schemas';

const MONGODB_URI = 'mongodb+srv://mymoon676_db_user:kxWbviWxLRHgAgDk@cluster0.cg5jh48.mongodb.net/bokabarber?appName=Cluster0';

async function checkShop() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  // Find the shop with slug "moony-salong" or similar
  const shops = await Shop.find({});
  console.log('=== All Shops in Database ===');
  for (const s of shops) {
    console.log(`- Name: ${s.name}, Slug: ${s.slug}, ID: ${s._id}, isActive: ${s.isActive}`);
  }

  const slugToFind = 'moony-salong';
  const targetShop = await Shop.findOne({ slug: slugToFind }) || await Shop.findOne({ slug: 'moony-salon' });

  if (!targetShop) {
    console.log(`\n❌ Shop with slug "${slugToFind}" not found in database!`);
    await mongoose.disconnect();
    return;
  }

  const shopId = targetShop._id;
  console.log(`\n=== Verification details for: ${targetShop.name} (${targetShop.slug}) ===`);

  // 1. Subscription
  const sub = await Subscription.findOne({ shopId });
  console.log('Prenumeration:', sub ? `Status: ${sub.status}, CurrentPeriodEnd: ${sub.currentPeriodEnd}` : '❌ Ingen prenumeration funnen');

  // 2. Services
  const services = await Service.find({ shopId });
  console.log('Tjänster:', services.length > 0 ? `✔ ${services.length} st` : '❌ Inga tjänster konfigurerade');
  for (const s of services) {
    console.log(`  * ${s.name} (${s.price} kr, ${s.durationMinutes} min)`);
  }

  // 3. Barbers
  const barbers = await BarberProfile.find({ shopId });
  console.log('Barberare (Personal):', barbers.length > 0 ? `✔ ${barbers.length} st` : '❌ Inga barberare konfigurerade');
  for (const b of barbers) {
    console.log(`  * ID: ${b._id}, UserLink: ${b.userId}, isActive: ${b.isActive}`);
  }

  // 4. Working hours
  const settings = await ShopSettings.findOne({ shopId });
  const hours = settings?.openingHours || [];
  const activeHours = hours.filter(h => h.isOpen);
  console.log('Öppettider/Arbetstider:', activeHours.length > 0 ? `✔ ${activeHours.length} dagar öppna` : '❌ Inga arbetstider konfigurerade');
  for (const h of activeHours) {
    console.log(`  * DayOfWeek: ${h.dayOfWeek}, Time: ${h.openTime} - ${h.closeTime}`);
  }

  // 5. Overall readiness check
  const hasServices = services.length > 0;
  const hasBarbers = barbers.length > 0;
  const hasHours = activeHours.length > 0;
  const isReady = hasServices && hasBarbers && hasHours;

  console.log('\n=== Status Sammanfattning ===');
  console.log(`- Prenumeration Aktiv (Aktiv provperiod): ${targetShop.isActive ? 'Ja' : 'Nej'}`);
  console.log(`- Konfigurerad & Redo för bokning (Ready): ${isReady ? '🎉 JA!' : '❌ NEJ'}`);
  if (!isReady) {
    console.log('  Anledning till att den inte är redo:');
    if (!hasServices) console.log('  -> Saknar tjänster (Måste lägga till minst en tjänst i admin-panelen)');
    if (!hasBarbers) console.log('  -> Saknar personal/barberare (Måste lägga till minst en personal i admin-panelen)');
    if (!hasHours) console.log('  -> Saknar arbetstider (Måste ställa in öppettider/scheman i admin-panelen)');
  }

  await mongoose.disconnect();
}

checkShop().catch(err => {
  console.error(err);
});

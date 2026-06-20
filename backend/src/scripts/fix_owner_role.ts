import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Shop } from '../models/Schemas';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

// Minimal User model reference (only what we need)
const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  shopId: mongoose.Schema.Types.ObjectId,
  firstName: String,
  lastName: String,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixRole() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Show ALL users and their roles
  const allUsers = await User.find({}).lean();
  console.log('=== All Users ===');
  for (const u of allUsers) {
    const any = u as Record<string, unknown>;
    console.log(`  ${any['email']}  role=${any['role']}  shopId=${any['shopId'] || 'none'}`);
  }

  // Find moony-salong
  const shop = await Shop.findOne({ slug: 'moony-salong' });
  if (!shop) {
    console.log('\n❌ moony-salong not found');
    await mongoose.disconnect();
    return;
  }
  console.log(`\n=== Shop: ${shop.name} (${shop._id}) ===`);

  // Find users linked to this shop that have role 'barber' (should be 'shop_admin')
  const wrongRoleUsers = await User.find({ shopId: shop._id, role: { $ne: 'shop_admin' } }).lean();
  if (wrongRoleUsers.length === 0) {
    // Maybe shopId not linked — find by any user who is barber
    const barbers = await User.find({ role: 'barber' }).lean();
    console.log('\nBarbers (no shopId match):');
    for (const u of barbers) {
      const any = u as Record<string, unknown>;
      console.log(`  ${any['email']}  shopId=${any['shopId'] || 'none'}`);
    }

    // Promote the first barber that has this shopId, or just the shop owner
    const shopOwnerByOwnerId = await User.findById(shop.get('ownerId'));
    if (shopOwnerByOwnerId) {
      console.log(`\nFixing shop owner: ${shopOwnerByOwnerId.get('email')} (was: ${shopOwnerByOwnerId.get('role')})`);
      await User.updateOne({ _id: shopOwnerByOwnerId._id }, { role: 'shop_admin', shopId: shop._id });
      console.log('✔ Role updated to shop_admin');
    } else {
      console.log('\n⚠️  Could not find shop owner via ownerId. Fixing ALL barbers linked to this shop:');
      // fallback: fix any user whose email was used during shop registration
      console.log('Run the script again after checking the user list above and edit TARGET_EMAIL below.');
    }
  } else {
    for (const u of wrongRoleUsers) {
      const any = u as Record<string, unknown>;
      console.log(`\nFixing: ${any['email']}  ${any['role']} → shop_admin`);
      await User.updateOne({ _id: any['_id'] as string }, { role: 'shop_admin' });
      console.log('✔ Done');
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

fixRole().catch(err => {
  console.error(err);
  process.exit(1);
});

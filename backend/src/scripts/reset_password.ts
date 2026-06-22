import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/Schemas';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL = process.argv[2] || '';
const NEW_PASSWORD = process.argv[3] || '';

if (!EMAIL || !NEW_PASSWORD) {
  console.error('Usage: ts-node reset_password.ts <email> <new_password>');
  process.exit(1);
}

async function resetPassword() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber');
  console.log('Connected!\n');

  const user = await User.findOne({ email: EMAIL.toLowerCase() });
  if (!user) {
    console.log(`❌ No user found with email: ${EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  user.passwordHash = hash;
  await user.save();

  console.log(`✅ Password reset for: ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`\n   New password: ${NEW_PASSWORD}`);
  console.log(`   Login at:     http://localhost:3000/login`);

  await mongoose.disconnect();
}

resetPassword().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

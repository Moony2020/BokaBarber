import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

console.log('Testing connection to MongoDB...');
console.log('URI:', MONGODB_URI.replace(/:[^@]+@/, ':****@')); // Hide password in logs

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Keep it short to fail fast
})
.then(() => {
  console.log('Successfully connected to MongoDB!');
  process.exit(0);
})
.catch((err: any) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

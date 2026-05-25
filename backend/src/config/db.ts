import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bokabarber';
const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/bokabarber';

export const connectDB = async (): Promise<void> => {
  try {
    console.log('🔄 Ansluter till MongoDB (försök 1: Atlas)...');
    const conn = await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 4000, // Wait max 4 seconds before failing
    });
    console.log(`✅ MongoDB ansluten till Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Kunde inte ansluta till MongoDB Atlas: ${(error as Error).message}`);
    console.log('🔄 Försöker ansluta till lokal fallback...');
    try {
      const conn = await mongoose.connect(LOCAL_MONGODB_URI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB ansluten till lokal databas: ${conn.connection.host}`);
    } catch (localError) {
      console.error(`❌ Totalt databasanslutningsfel: ${(localError as Error).message}`);
      console.error('Se till att antingen MongoDB Atlas IP-vitlistning är korrekt eller att en lokal MongoDB-server körs.');
      process.exit(1);
    }
  }
};

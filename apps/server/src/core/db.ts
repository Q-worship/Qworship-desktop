import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qworship-v2';
    console.log(`[DB] Attempting connection to Primary MongoDB...`);
    // Add a 5 second timeout so it doesn't hang forever if Atlas is down
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('\x1b[32m[DB] Primary MongoDB connection successful.\x1b[0m');
  } catch (error) {
    console.log('\x1b[33m[DB] Primary connection failed (Likely Offline or Atlas Paused). Engaging Local Fallback...\x1b[0m');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/qworship-v2', { serverSelectionTimeoutMS: 3000 });
      console.log('\x1b[32m[DB] ✅ Local MongoDB fallback connection successful.\x1b[0m');
    } catch (fallbackError) {
      console.error('\x1b[31m[DB] ❌ FATAL: Both Primary Atlas and Local Desktop MongoDB connections failed.\x1b[0m');
      console.error('\x1b[31mPlease ensure MongoDB is running locally (mongod) or your V1 .env Atlas cluster is resumed.\x1b[0m');
      process.exit(1);
    }
  }
}

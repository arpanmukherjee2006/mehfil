import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mehfile';

const globalWithMongo = global as any;

if (!globalWithMongo.mongoose) {
  globalWithMongo.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (globalWithMongo.mongoose?.conn) {
    return { conn: globalWithMongo.mongoose.conn, isConnected: true };
  }

  if (!globalWithMongo.mongoose?.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB...');
    globalWithMongo.mongoose!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected Successfully');
      return mongooseInstance;
    }).catch((err) => {
      console.warn('MongoDB connection failed. Continuing in offline/fallback mode.', err.message);
      globalWithMongo.mongoose!.promise = null; // Clear so we can retry later
      throw err;
    });
  }

  try {
    const conn = await globalWithMongo.mongoose!.promise;
    globalWithMongo.mongoose!.conn = conn;
    return { conn, isConnected: true };
  } catch (e) {
    return { conn: null, isConnected: false };
  }
}

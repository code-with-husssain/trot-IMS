const mongoose = require('mongoose');

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

// Reuse the connection across serverless invocations (Vercel) and local dev.
async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@trottk.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Trot TK Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`Created admin: ${email}`);
  }

  console.log('Seed complete. You can log in with the credentials from your .env.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

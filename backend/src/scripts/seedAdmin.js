require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = process.env.ADMIN_EMAIL || 'admin@ktripz.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: 'KTripZ Admin',
    email,
    phone: '9999999999',
    password,
    role: 'admin',
  });

  console.log(`✅ Admin created: ${email} / ${password}`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

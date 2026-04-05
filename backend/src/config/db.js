const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected:', process.env.MONGODB_URI);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Server starting without DB — replace MONGODB_URI in .env with a valid connection string.');
    // Don't exit — let server start so health check and other routes work
  }
};

module.exports = connectDB;

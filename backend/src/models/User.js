const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['passenger', 'provider', 'admin'], default: 'passenger' },
  profileImage: { type: String, default: null },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  fcmToken: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  savedLocation: {
    country: { type: String },
    state: { type: String },
    district: { type: String },
    city: { type: String },
    village: { type: String },
    street: { type: String },
    pincode: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

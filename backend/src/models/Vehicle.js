const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  model: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  seats: { type: Number, required: true },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'cng', 'electric'], required: true },
  color: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);

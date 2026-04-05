const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  origin: {
    name: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
  },
  destination: {
    name: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
  },
  stops: [{ name: String, coordinates: { lat: Number, lng: Number } }],
  departureTime: { type: Date, required: true },
  pricePerSeat: { type: Number, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
  polyline: { type: String },
  distance: { type: Number },
  duration: { type: Number },
  preferences: {
    smoking: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    music: { type: Boolean, default: true },
  },
  description: { type: String },
}, { timestamps: true });

rideSchema.index({ 'origin.name': 'text', 'destination.name': 'text' });
rideSchema.index({ departureTime: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);

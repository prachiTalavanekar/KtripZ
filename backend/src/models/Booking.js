const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seatsBooked: { type: Number, required: true, default: 1 },
  seatNumbers: [{ type: Number }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'ride_started'],
    default: 'pending',
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['passenger', 'driver', 'admin'] },
  // Tracking
  driverLocation: {
    lat: Number, lng: Number,
    heading: Number, speed: Number,
    updatedAt: Date,
  },
  pickupOtp: { type: String },
  otpVerified: { type: Boolean, default: false },
  rideStartedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

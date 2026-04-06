const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seatsBooked: { type: Number, required: true, default: 1 },
  seatNumbers: [{ type: Number }],  // which seat numbers were booked
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['passenger', 'driver', 'admin'] },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

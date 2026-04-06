const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { getIO } = require('../socket');
const { sendPushNotification } = require('../services/notification.service');

// Helper: broadcast updated ride to all listeners
const broadcastRideUpdate = async (rideId) => {
  const ride = await Ride.findById(rideId);
  if (ride) getIO().to(`ride:${rideId}`).emit('ride_updated', ride);
};

// ── Create Booking ────────────────────────────────────────────────────────────
// Immediately deduct availableSeats on booking request (pending state)
// This prevents double-booking while driver reviews
exports.createBooking = async (req, res, next) => {
  try {
    const { rideId, seatsBooked = 1, seatNumbers = [] } = req.body;

    // Atomic check + deduct to prevent race conditions
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, availableSeats: { $gte: seatsBooked }, status: 'scheduled' },
      { $inc: { availableSeats: -seatsBooked } },
      { new: true }
    ).populate('driverId');

    if (!ride) {
      // Either ride not found or not enough seats
      const check = await Ride.findById(rideId);
      if (!check) return res.status(404).json({ message: 'Ride not found' });
      return res.status(400).json({ message: `Only ${check.availableSeats} seat(s) available` });
    }

    // Re-verify seat numbers not already taken
    if (seatNumbers.length > 0) {
      const conflict = await Booking.findOne({
        rideId,
        status: { $in: ['pending', 'approved'] },
        seatNumbers: { $in: seatNumbers },
      });
      if (conflict) {
        // Rollback the seat deduction
        await Ride.findByIdAndUpdate(rideId, { $inc: { availableSeats: seatsBooked } });
        return res.status(409).json({ message: 'One or more seats just got booked. Please re-select.' });
      }
    }

    const booking = await Booking.create({
      rideId,
      passengerId: req.user._id,
      seatsBooked,
      seatNumbers,
      totalAmount: ride.pricePerSeat * seatsBooked,
    });

    // Notify driver
    getIO().to(`user:${ride.driverId._id}`).emit('booking_request', {
      booking, passenger: req.user, updatedAvailableSeats: ride.availableSeats,
    });

    // Broadcast updated ride availability to all passengers viewing this ride
    getIO().to(`ride:${rideId}`).emit('ride_updated', ride);

    await sendPushNotification(
      ride.driverId.fcmToken,
      'New Booking Request',
      `${req.user.name} wants ${seatsBooked} seat(s) — ${ride.availableSeats} remaining`
    );

    res.status(201).json({ booking, availableSeats: ride.availableSeats });
  } catch (err) { next(err); }
};

// ── Approve Booking ───────────────────────────────────────────────────────────
// Seats already deducted on create — just update status
exports.approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('rideId')
      .populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.rideId.driverId) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'pending')
      return res.status(400).json({ message: `Cannot approve a ${booking.status} booking` });

    booking.status = 'approved';
    await booking.save();

    // Notify passenger
    getIO().to(`user:${booking.passengerId._id}`).emit('booking_approved', booking);
    getIO().to(`booking:${booking._id}`).emit('booking_approved', booking);

    await sendPushNotification(
      booking.passengerId.fcmToken,
      'Booking Approved!',
      `Your ${booking.seatsBooked} seat(s) have been confirmed`
    );

    res.json(booking);
  } catch (err) { next(err); }
};

// ── Reject Booking ────────────────────────────────────────────────────────────
// Restore seats since they were deducted on create
exports.rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('rideId')
      .populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'pending')
      return res.status(400).json({ message: `Cannot reject a ${booking.status} booking` });

    booking.status = 'rejected';
    await booking.save();

    // Restore seats
    const updatedRide = await Ride.findByIdAndUpdate(
      booking.rideId._id,
      { $inc: { availableSeats: booking.seatsBooked } },
      { new: true }
    );

    // Notify passenger
    getIO().to(`user:${booking.passengerId._id}`).emit('booking_cancelled', booking);
    // Broadcast updated availability
    getIO().to(`ride:${booking.rideId._id}`).emit('ride_updated', updatedRide);

    await sendPushNotification(
      booking.passengerId.fcmToken,
      'Booking Not Accepted',
      'The driver could not accept your booking'
    );

    res.json(booking);
  } catch (err) { next(err); }
};

// ── Cancel Booking (by passenger) ────────────────────────────────────────────
// Restore seats regardless of pending/approved status
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('rideId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.passengerId) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (!['pending', 'approved'].includes(booking.status))
      return res.status(400).json({ message: 'Cannot cancel this booking' });

    const prevStatus = booking.status;
    booking.status = 'cancelled';
    booking.cancelledBy = 'passenger';
    booking.cancellationReason = req.body.reason;
    await booking.save();

    // Always restore seats (deducted on create for both pending and approved)
    const updatedRide = await Ride.findByIdAndUpdate(
      booking.rideId._id,
      { $inc: { availableSeats: booking.seatsBooked } },
      { new: true }
    );

    getIO().to(`booking:${booking._id}`).emit('booking_cancelled', booking);
    getIO().to(`ride:${booking.rideId._id}`).emit('ride_updated', updatedRide);

    // Notify driver
    const ride = await Ride.findById(booking.rideId._id).populate('driverId');
    if (ride?.driverId?.fcmToken) {
      await sendPushNotification(
        ride.driverId.fcmToken,
        'Booking Cancelled',
        `A passenger cancelled — ${updatedRide.availableSeats} seat(s) now available`
      );
    }

    res.json({ message: 'Booking cancelled', availableSeats: updatedRide.availableSeats });
  } catch (err) { next(err); }
};

// ── Get My Bookings ───────────────────────────────────────────────────────────
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id })
      .populate({ path: 'rideId', populate: { path: 'driverId', select: 'name profileImage rating' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { next(err); }
};

// ── Get Ride Bookings (driver) ────────────────────────────────────────────────
exports.getRideBookings = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.rideId, driverId: req.user._id });
    if (!ride) return res.status(403).json({ message: 'Not authorized' });
    const bookings = await Booking.find({ rideId: req.params.rideId })
      .populate('passengerId', 'name profileImage rating phone');
    res.json(bookings);
  } catch (err) { next(err); }
};

// ── Get Seat Map (real-time) ──────────────────────────────────────────────────
exports.getBookedSeats = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const ride = await Ride.findById(rideId).populate('vehicleId');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const totalSeats = ride.vehicleId?.seats || 4;

    // All active bookings (pending + approved) hold seats
    const bookings = await Booking.find({
      rideId,
      status: { $in: ['pending', 'approved'] },
    }).select('seatNumbers');

    const bookedNums = new Set();
    bookings.forEach(b => (b.seatNumbers || []).forEach(n => bookedNums.add(n)));

    // Seat 1 = driver always, rest = available or booked from DB
    const seats = Array.from({ length: totalSeats }, (_, i) => {
      const num = i + 1;
      if (num === 1) return { seatNumber: num, status: 'driver' };
      return { seatNumber: num, status: bookedNums.has(num) ? 'booked' : 'available' };
    });

    const availableCount = seats.filter(s => s.status === 'available').length;

    res.json({ seats, totalSeats, availableCount, rideAvailableSeats: ride.availableSeats });
  } catch (err) { next(err); }
};

// GET /bookings/driver/pending — all pending bookings across driver's rides
exports.getDriverPendingBookings = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driverId: req.user._id }).select('_id');
    const rideIds = rides.map(r => r._id);
    const bookings = await Booking.find({
      rideId: { $in: rideIds },
      status: 'pending',
    })
      .populate('passengerId', 'name profileImage')
      .populate('rideId', 'origin destination departureTime')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { next(err); }
};

const Booking = require('../models/Booking');
const { getIO } = require('../socket');
const { sendPushNotification } = require('../services/notification.service');
const crypto = require('crypto');
const axios = require('axios');

// ── Driver updates location ───────────────────────────────────────────────────
exports.updateDriverLocation = async (req, res, next) => {
  try {
    const { bookingId, lat, lng, heading, speed } = req.body;
    const booking = await Booking.findById(bookingId).populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const location = { lat, lng, heading, speed, updatedAt: new Date() };
    await Booking.findByIdAndUpdate(bookingId, { driverLocation: location });

    // Broadcast to passenger
    getIO().to(`booking:${bookingId}`).emit('driver_location_update', {
      bookingId, lat, lng, heading, speed,
    });

    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ── Driver reached pickup → generate OTP ─────────────────────────────────────
exports.generateOtp = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'approved')
      return res.status(400).json({ message: 'Booking not approved' });

    const otp = crypto.randomInt(1000, 9999).toString();
    await Booking.findByIdAndUpdate(bookingId, { pickupOtp: otp, otpVerified: false });

    // Send OTP to passenger via socket + push
    getIO().to(`booking:${bookingId}`).emit('pickup_otp_generated', { bookingId, otp });
    getIO().to(`user:${booking.passengerId._id}`).emit('pickup_otp_generated', { bookingId, otp });

    await sendPushNotification(
      booking.passengerId.fcmToken,
      'Driver Arrived!',
      `Your pickup OTP is: ${otp}`
    );

    res.json({ message: 'OTP generated', otp });
  } catch (err) { next(err); }
};

// ── Verify OTP → start ride ───────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { bookingId, otp } = req.body;
    const booking = await Booking.findById(bookingId)
      .populate('passengerId')
      .populate({ path: 'rideId', populate: { path: 'driverId' } });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.pickupOtp !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (booking.otpVerified)
      return res.status(400).json({ message: 'OTP already used' });

    await Booking.findByIdAndUpdate(bookingId, {
      status: 'ride_started',
      otpVerified: true,
      rideStartedAt: new Date(),
    });

    // Notify both
    getIO().to(`booking:${bookingId}`).emit('ride_started', { bookingId });
    getIO().to(`user:${booking.passengerId._id}`).emit('ride_started', { bookingId });
    getIO().to(`user:${booking.rideId.driverId._id}`).emit('ride_started', { bookingId });

    await sendPushNotification(booking.passengerId.fcmToken, 'Ride Started!', 'Your ride has begun. Have a safe journey!');

    res.json({ message: 'Ride started', bookingId });
  } catch (err) { next(err); }
};

// ── Get route from OLA Maps (backend only) ────────────────────────────────────
exports.getRoute = async (req, res, next) => {
  try {
    const { origin, destination } = req.body;
    const apiKey = process.env.OLA_MAPS_API_KEY;

    const response = await axios.get('https://api.olamaps.io/routing/v1/directions', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        api_key: apiKey,
      },
    });

    const route = response.data.routes?.[0];
    const leg = route?.legs?.[0];

    res.json({
      polyline: route?.overview_polyline?.points || '',
      distance: leg?.distance?.value || 0,
      duration: leg?.duration?.value || 0,
      distanceText: leg?.distance?.text || '',
      durationText: leg?.duration?.text || '',
    });
  } catch (err) {
    // Return empty route on OLA API failure
    res.json({ polyline: '', distance: 0, duration: 0, distanceText: '—', durationText: '—' });
  }
};

// ── Get booking tracking state ────────────────────────────────────────────────
exports.getTrackingState = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('passengerId', 'name phone')
      .populate({ path: 'rideId', populate: { path: 'driverId', select: 'name phone fcmToken' } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) { next(err); }
};

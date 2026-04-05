const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { getIO } = require('../socket');
const { sendPushNotification } = require('../services/notification.service');

exports.createBooking = async (req, res, next) => {
  try {
    const { rideId, seatsBooked = 1 } = req.body;
    const ride = await Ride.findById(rideId).populate('driverId');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.availableSeats < seatsBooked)
      return res.status(400).json({ message: 'Not enough seats available' });

    const booking = await Booking.create({
      rideId,
      passengerId: req.user._id,
      seatsBooked,
      totalAmount: ride.pricePerSeat * seatsBooked,
    });

    // Notify driver
    getIO().to(`user:${ride.driverId._id}`).emit('booking_request', { booking, passenger: req.user });
    await sendPushNotification(ride.driverId.fcmToken, 'New Booking Request', `${req.user.name} wants to join your ride`);

    res.status(201).json(booking);
  } catch (err) { next(err); }
};

exports.approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('rideId').populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.rideId.driverId) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    booking.status = 'approved';
    await booking.save();
    await Ride.findByIdAndUpdate(booking.rideId._id, { $inc: { availableSeats: -booking.seatsBooked } });

    getIO().to(`user:${booking.passengerId._id}`).emit('booking_approved', booking);
    await sendPushNotification(booking.passengerId.fcmToken, 'Booking Approved', 'Your ride booking has been approved');

    res.json(booking);
  } catch (err) { next(err); }
};

exports.rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('rideId').populate('passengerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'rejected';
    await booking.save();

    getIO().to(`user:${booking.passengerId._id}`).emit('booking_cancelled', booking);
    await sendPushNotification(booking.passengerId.fcmToken, 'Booking Rejected', 'Your booking request was not accepted');

    res.json(booking);
  } catch (err) { next(err); }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.passengerId) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    booking.status = 'cancelled';
    booking.cancelledBy = 'passenger';
    booking.cancellationReason = req.body.reason;
    await booking.save();

    if (booking.status === 'approved') {
      await Ride.findByIdAndUpdate(booking.rideId, { $inc: { availableSeats: booking.seatsBooked } });
    }

    getIO().to(`booking:${booking._id}`).emit('booking_cancelled', booking);
    res.json({ message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id })
      .populate({ path: 'rideId', populate: { path: 'driverId', select: 'name profileImage rating' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getRideBookings = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.rideId, driverId: req.user._id });
    if (!ride) return res.status(403).json({ message: 'Not authorized' });
    const bookings = await Booking.find({ rideId: req.params.rideId })
      .populate('passengerId', 'name profileImage rating phone');
    res.json(bookings);
  } catch (err) { next(err); }
};

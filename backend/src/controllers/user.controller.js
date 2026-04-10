const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;
    if (req.file) updates.profileImage = req.file.path;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) { next(err); }
};

exports.saveLocation = async (req, res, next) => {
  try {
    const { country, state, district, city, village, street, pincode, lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { savedLocation: { country, state, district, city, village, street, pincode, lat, lng } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { next(err); }
};

exports.saveLocation = async (req, res, next) => {
  try {
    const { country, state, district, city, village, street, pincode, lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { savedLocation: { country, state, district, city, village, street, pincode, lat, lng } },
      { new: true }
    ).select('-password');
    res.json({ message: 'Location saved', savedLocation: user.savedLocation });
  } catch (err) { next(err); }
};

exports.getLocation = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedLocation');
    res.json(user.savedLocation || {});
  } catch (err) { next(err); }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const Booking = require('../models/Booking');
    const Ride = require('../models/Ride');

    const rides = await Ride.find({ driverId: req.user._id });
    const rideIds = rides.map(r => r._id);
    const bookings = await Booking.find({ rideId: { $in: rideIds }, paymentStatus: 'paid' });
    const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({ totalEarnings: total, totalRides: rides.length, completedBookings: bookings.length });
  } catch (err) { next(err); }
};

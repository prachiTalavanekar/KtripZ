const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalRides, totalBookings, payments] = await Promise.all([
      User.countDocuments(),
      Ride.countDocuments(),
      Booking.countDocuments(),
      Payment.find({ status: 'paid' }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const activeRides = await Ride.countDocuments({ status: 'scheduled' });
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({ totalUsers, totalRides, totalBookings, totalRevenue, activeRides, activeUsers });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page) });
  } catch (err) { next(err); }
};

exports.getRides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const rides = await Ride.find(filter)
      .populate('driverId', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Ride.countDocuments(filter);
    res.json({ rides, total, page: Number(page) });
  } catch (err) { next(err); }
};

exports.getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const bookings = await Booking.find()
      .populate('rideId')
      .populate('passengerId', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Booking.countDocuments();
    res.json({ bookings, total, page: Number(page) });
  } catch (err) { next(err); }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const revenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(revenue);
  } catch (err) { next(err); }
};

exports.getPopularRoutes = async (req, res, next) => {
  try {
    const routes = await Ride.aggregate([
      { $group: { _id: { origin: '$origin.name', destination: '$destination.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(routes);
  } catch (err) { next(err); }
};

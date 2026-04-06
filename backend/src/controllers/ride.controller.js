const Ride = require('../models/Ride');
const { getIO } = require('../socket');

exports.createRide = async (req, res, next) => {
  try {
    const ride = await Ride.create({ ...req.body, driverId: req.user._id });
    res.status(201).json(ride);
  } catch (err) { next(err); }
};

exports.searchRides = async (req, res, next) => {
  try {
    const { origin, destination, date, seats } = req.query;
    if (!origin || !destination) return res.status(400).json({ message: 'origin and destination are required' });

    const filter = {
      'origin.name': { $regex: origin.trim(), $options: 'i' },
      'destination.name': { $regex: destination.trim(), $options: 'i' },
      status: 'scheduled',
      departureTime: { $gte: new Date() },
    };

    // Date is optional — if provided filter by that day
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.departureTime = { $gte: start, $lt: end };
    }

    // Seats optional
    if (seats && Number(seats) > 0) {
      filter.availableSeats = { $gte: Number(seats) };
    }

    const rides = await Ride.find(filter)
      .sort({ departureTime: 1 })
      .populate('driverId', 'name profileImage rating')
      .populate('vehicleId');

    res.json(rides);
  } catch (err) { next(err); }
};

// GET /api/rides/upcoming?limit=5 — top upcoming rides sorted by time
exports.getUpcomingRides = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const rides = await Ride.find({
      status: 'scheduled',
      departureTime: { $gte: new Date() },
    })
      .sort({ departureTime: 1 })
      .limit(limit)
      .populate('driverId', 'name profileImage rating')
      .populate('vehicleId');
    res.json(rides);
  } catch (err) { next(err); }
};

exports.getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name profileImage rating phone')
      .populate('vehicleId');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (err) { next(err); }
};

exports.getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driverId: req.user._id }).sort({ departureTime: -1 });
    res.json(rides);
  } catch (err) { next(err); }
};

exports.updateRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      req.body,
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    getIO().to(`ride:${ride._id}`).emit('ride_updated', ride);
    res.json(ride);
  } catch (err) { next(err); }
};

exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    getIO().to(`ride:${ride._id}`).emit('ride_updated', { ...ride.toObject(), status: 'cancelled' });
    res.json({ message: 'Ride cancelled' });
  } catch (err) { next(err); }
};

exports.completeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      { status: 'completed' },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    getIO().to(`ride:${ride._id}`).emit('ride_updated', { ...ride.toObject(), status: 'completed' });
    res.json({ message: 'Ride marked as completed' });
  } catch (err) { next(err); }
};

exports.deleteRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndDelete({ _id: req.params.id, driverId: req.user._id });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ message: 'Ride deleted' });
  } catch (err) { next(err); }
};

exports.calculateRoute = async (req, res, next) => {
  try {
    const axios = require('axios');
    const { origin, destination } = req.body;
    const apiKey = process.env.OLA_MAPS_API_KEY;

    const response = await axios.get(
      `https://api.olamaps.io/routing/v1/directions`,
      {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          api_key: apiKey,
        },
      }
    );

    const route = response.data.routes?.[0];
    res.json({
      polyline: route?.overview_polyline?.points,
      distance: route?.legs?.[0]?.distance?.value,
      duration: route?.legs?.[0]?.duration?.value,
    });
  } catch (err) { next(err); }
};

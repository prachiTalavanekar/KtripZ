const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res, next) => {
  try {
    const { rideId, bookingId, revieweeId, rating, comment } = req.body;
    const existing = await Review.findOne({ bookingId, reviewerId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const review = await Review.create({ rideId, bookingId, reviewerId: req.user._id, revieweeId, rating, comment });

    // Update user average rating
    const reviews = await Review.find({ revieweeId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, { rating: avg.toFixed(1), totalRatings: reviews.length });

    res.status(201).json(review);
  } catch (err) { next(err); }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate('reviewerId', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { next(err); }
};

const router = require('express').Router();
const {
  updateDriverLocation, generateOtp, verifyOtp, getRoute, getTrackingState,
} = require('../controllers/tracking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/location', protect, authorize('provider'), updateDriverLocation);
router.post('/generate-otp', protect, authorize('provider'), generateOtp);
router.post('/verify-otp', protect, verifyOtp);
router.post('/route', protect, getRoute);
router.get('/state/:bookingId', protect, getTrackingState);

module.exports = router;

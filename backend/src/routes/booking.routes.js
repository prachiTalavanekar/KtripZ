const router = require('express').Router();
const {
  createBooking, approveBooking, rejectBooking,
  cancelBooking, getMyBookings, getRideBookings, getBookedSeats,
  getDriverPendingBookings,
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('passenger'), createBooking);
router.get('/my', protect, getMyBookings);
router.get('/driver/pending', protect, authorize('provider'), getDriverPendingBookings);
router.get('/ride/:rideId', protect, authorize('provider'), getRideBookings);
router.get('/seats/:rideId', protect, getBookedSeats);
router.patch('/:id/approve', protect, authorize('provider'), approveBooking);
router.patch('/:id/reject', protect, authorize('provider'), rejectBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;

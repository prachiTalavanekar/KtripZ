const router = require('express').Router();
const {
  createRide, searchRides, getUpcomingRides, getRide,
  getMyRides, updateRide, cancelRide, completeRide, deleteRide, calculateRoute,
} = require('../controllers/ride.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/search', searchRides);
router.get('/upcoming', getUpcomingRides);
router.post('/calculate-route', calculateRoute);
router.get('/my', protect, authorize('provider'), getMyRides);
router.post('/', protect, authorize('provider'), createRide);
router.get('/:id', getRide);
router.put('/:id', protect, authorize('provider'), updateRide);
router.patch('/:id/cancel', protect, authorize('provider'), cancelRide);
router.patch('/:id/complete', protect, authorize('provider'), completeRide);
router.delete('/:id', protect, authorize('provider'), deleteRide);

module.exports = router;

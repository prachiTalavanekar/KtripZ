const router = require('express').Router();
const { createRide, searchRides, getRide, getMyRides, updateRide, cancelRide, calculateRoute } = require('../controllers/ride.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/search', searchRides);
router.post('/calculate-route', calculateRoute);
router.get('/my', protect, authorize('provider'), getMyRides);
router.post('/', protect, authorize('provider'), createRide);
router.get('/:id', getRide);
router.put('/:id', protect, authorize('provider'), updateRide);
router.patch('/:id/cancel', protect, authorize('provider'), cancelRide);

module.exports = router;

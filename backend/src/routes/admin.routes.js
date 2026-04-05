const router = require('express').Router();
const { getDashboard, getUsers, getRides, getBookings, getRevenue, getPopularRoutes } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/rides', getRides);
router.get('/bookings', getBookings);
router.get('/revenue', getRevenue);
router.get('/popular-routes', getPopularRoutes);

module.exports = router;

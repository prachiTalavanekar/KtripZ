const router = require('express').Router();
const { createReview, getUserReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);

module.exports = router;

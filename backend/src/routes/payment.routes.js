const router = require('express').Router();
const { createOrder, verifyPayment, webhook, getPaymentHistory } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/webhook', webhook);
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;

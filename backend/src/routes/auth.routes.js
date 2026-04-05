const router = require('express').Router();
const { register, login, me, updateFcmToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;

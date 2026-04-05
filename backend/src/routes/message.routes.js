const router = require('express').Router();
const { sendMessage, getMessages, markRead } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', sendMessage);
router.get('/:bookingId', getMessages);
router.patch('/:bookingId/read', markRead);

module.exports = router;

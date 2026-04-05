const router = require('express').Router();
const { getProfile, updateProfile, getEarnings } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/earnings', protect, authorize('provider'), getEarnings);
router.get('/:id', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

module.exports = router;

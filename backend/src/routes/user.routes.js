const router = require('express').Router();
const { getProfile, updateProfile, getEarnings, saveLocation } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/earnings', protect, authorize('provider'), getEarnings);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.put('/location', protect, saveLocation);
router.get('/:id', protect, getProfile);

module.exports = router;

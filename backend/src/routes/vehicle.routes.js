const router = require('express').Router();
const { addVehicle, getMyVehicles, updateVehicle, deleteVehicle } = require('../controllers/vehicle.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect, authorize('provider'));
router.post('/', upload.single('image'), addVehicle);
router.get('/', getMyVehicles);
router.put('/:id', upload.single('image'), updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;

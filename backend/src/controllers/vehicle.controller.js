const Vehicle = require('../models/Vehicle');

exports.addVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, ownerId: req.user._id, image: req.file?.path });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
};

exports.getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user._id, isActive: true });
    res.json(vehicles);
  } catch (err) { next(err); }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { ...req.body, ...(req.file && { image: req.file.path }) },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) { next(err); }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    await Vehicle.findOneAndUpdate({ _id: req.params.id, ownerId: req.user._id }, { isActive: false });
    res.json({ message: 'Vehicle removed' });
  } catch (err) { next(err); }
};

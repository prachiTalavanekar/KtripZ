const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { getIO } = require('../socket');

exports.sendMessage = async (req, res, next) => {
  try {
    const { bookingId, receiverId, message } = req.body;

    // Validate booking exists and is approved
    const booking = await Booking.findById(bookingId).populate('rideId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!['approved', 'ride_started'].includes(booking.status))
      return res.status(403).json({ message: 'Chat is only available for approved bookings' });

    // Ensure sender is either the passenger or the driver of this booking
    const driverId = String(booking.rideId.driverId);
    const passengerId = String(booking.passengerId);
    const senderId = String(req.user._id);
    if (senderId !== passengerId && senderId !== driverId)
      return res.status(403).json({ message: 'Not authorized to send messages in this booking' });

    const msg = await Message.create({ bookingId, senderId: req.user._id, receiverId, message });
    const populated = await msg.populate('senderId', 'name profileImage');

    getIO().to(`booking:${bookingId}`).emit('new_message', populated);
    getIO().to(`user:${receiverId}`).emit('new_message', populated);

    res.status(201).json(populated);
  } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ bookingId: req.params.bookingId })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Message.updateMany(
      { bookingId: req.params.bookingId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) { next(err); }
};

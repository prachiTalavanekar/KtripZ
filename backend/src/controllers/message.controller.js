const Message = require('../models/Message');
const { getIO } = require('../socket');

exports.sendMessage = async (req, res, next) => {
  try {
    const { bookingId, receiverId, message } = req.body;
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

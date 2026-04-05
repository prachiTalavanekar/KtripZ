const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    console.log(`Socket connected: ${userId}`);

    socket.on('join_ride_room', (rideId) => socket.join(`ride:${rideId}`));
    socket.on('join_booking_room', (bookingId) => socket.join(`booking:${bookingId}`));
    socket.on('leave_ride_room', (rideId) => socket.leave(`ride:${rideId}`));

    socket.on('disconnect', () => console.log(`Socket disconnected: ${userId}`));
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };

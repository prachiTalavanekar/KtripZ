const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
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

    // Room management
    socket.on('join_ride_room', (rideId) => socket.join(`ride:${rideId}`));
    socket.on('join_booking_room', (bookingId) => socket.join(`booking:${bookingId}`));
    socket.on('leave_ride_room', (rideId) => socket.leave(`ride:${rideId}`));
    socket.on('leave_booking_room', (bookingId) => socket.leave(`booking:${bookingId}`));

    // ── Driver location update ────────────────────────────────────────────────
    socket.on('driver_location_update', async (data) => {
      const { bookingId, lat, lng, heading, speed } = data;
      if (!bookingId || lat == null || lng == null) return;

      try {
        // Persist to DB
        await Booking.findByIdAndUpdate(bookingId, {
          driverLocation: { lat, lng, heading, speed, updatedAt: new Date() },
        });

        // Broadcast to booking room (passenger sees it)
        io.to(`booking:${bookingId}`).emit('driver_location_update', {
          bookingId, lat, lng, heading, speed, timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Location update error:', err.message);
      }
    });

    socket.on('disconnect', () => console.log(`Socket disconnected: ${userId}`));
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };

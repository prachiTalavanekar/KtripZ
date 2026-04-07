const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const rideRoutes = require('./routes/ride.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const messageRoutes = require('./routes/message.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const mapRoutes = require('./routes/map.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));

// Raw body for Razorpay webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const trackingRoutes = require('./routes/tracking.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/tracking', trackingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'KTripZ API' }));

app.use(errorHandler);

module.exports = app;

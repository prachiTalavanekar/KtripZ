const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,
      currency: 'INR',
      receipt: `booking_${bookingId}`,
    });

    const payment = await Payment.create({
      bookingId,
      userId: req.user._id,
      amount: booking.totalAmount,
      razorpayOrderId: order.id,
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment._id });
  } catch (err) { next(err); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

    if (expected !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed' });

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'paid' }
    );
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });

    res.json({ message: 'Payment verified successfully' });
  } catch (err) { next(err); }
};

exports.webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
    if (expected !== signature) return res.status(400).json({ message: 'Invalid webhook signature' });

    const event = JSON.parse(body);
    if (event.event === 'payment.captured') {
      const orderId = event.payload.payment.entity.order_id;
      await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'paid' });
    }
    res.json({ received: true });
  } catch (err) { next(err); }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).populate('bookingId').sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { next(err); }
};

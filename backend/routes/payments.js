import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Booking from '../models/Booking.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order (legacy path kept as /create-intent for frontend compatibility)
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(409).json({ error: 'Booking is already paid' });
    }

    // Security: always derive payable amount from server-side booking state.
    const bookingAmount = Number(booking.totalAmount);
    if (!Number.isFinite(bookingAmount) || bookingAmount <= 0) {
      return res.status(400).json({ error: 'Invalid booking amount' });
    }

    // If client sends amount, ensure it matches the booking amount.
    if (amount !== undefined && Number(amount) !== bookingAmount) {
      return res.status(400).json({ error: 'Amount mismatch with booking' });
    }

    const amountInPaise = Math.round(bookingAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingRef || `booking_${bookingId}`,
      notes: {
        bookingId,
        userId: req.user.userId
      }
    });

    await Booking.findByIdAndUpdate(bookingId, {
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      paymentStatus: 'pending'
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Server error creating Razorpay order' });
  }
});

// Verify Razorpay payment signature (legacy path kept as /confirm for frontend compatibility)
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing Razorpay verification payload' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(409).json({ error: 'Payment already confirmed' });
    }

    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ error: 'Order mismatch for booking' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'completed',
        paymentGateway: 'razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      },
      { new: true }
    );

    res.json({
      message: 'Payment confirmed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Server error verifying payment' });
  }
});

// Get payment status
router.get('/:bookingId', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking || booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      paymentStatus: booking.paymentStatus,
      paymentGateway: booking.paymentGateway || 'razorpay',
      stripePaymentId: booking.stripePaymentId,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Server error fetching payment status' });
  }
});

export default router;

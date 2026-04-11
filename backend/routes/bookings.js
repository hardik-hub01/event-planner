import express from 'express';
import Booking from '../models/Booking.js';
import { authMiddleware } from '../middleware/auth.js';
import { syncBookingToFirebase } from '../services/firebaseSync.js';

const router = express.Router();

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const isValidFutureDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

// Create booking
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventCategory, packageName, venue, guests, eventDate, totalAmount, vendors } = req.body;

    if (!isNonEmptyString(eventCategory) || !isNonEmptyString(packageName) || !isNonEmptyString(venue)) {
      return res.status(400).json({ error: 'Event category, package and venue are required' });
    }

    if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
      return res.status(400).json({ error: 'Guests must be a positive integer' });
    }

    if (!isPositiveNumber(totalAmount)) {
      return res.status(400).json({ error: 'Total amount must be greater than 0' });
    }

    if (!isValidFutureDate(eventDate)) {
      return res.status(400).json({ error: 'Event date must be a valid future date' });
    }

    if (vendors !== undefined && !Array.isArray(vendors)) {
      return res.status(400).json({ error: 'Vendors must be an array' });
    }

    if (
      eventCategory === undefined ||
      packageName === undefined ||
      venue === undefined ||
      guests === undefined ||
      eventDate === undefined ||
      totalAmount === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = new Booking({
      userId: req.user.userId,
      eventCategory,
      packageName,
      venue,
      guests: Number(guests),
      eventDate: new Date(eventDate),
      totalAmount: Number(totalAmount),
      vendors: vendors || [],
      paymentStatus: 'pending'
    });

    await booking.save();

    // Non-blocking realtime projection update
    syncBookingToFirebase(booking);

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// Get user's bookings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({ error: 'Server error fetching booking' });
  }
});

// Update booking
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Update fields
    const { venue, guests, eventDate, vendors } = req.body;

    if (venue !== undefined) {
      if (!isNonEmptyString(venue)) {
        return res.status(400).json({ error: 'Venue must be a non-empty string' });
      }
      booking.venue = venue;
    }

    if (guests !== undefined) {
      if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
        return res.status(400).json({ error: 'Guests must be a positive integer' });
      }
      booking.guests = Number(guests);
    }

    if (eventDate !== undefined) {
      if (!isValidFutureDate(eventDate)) {
        return res.status(400).json({ error: 'Event date must be a valid future date' });
      }
      booking.eventDate = new Date(eventDate);
    }

    if (vendors !== undefined) {
      if (!Array.isArray(vendors)) {
        return res.status(400).json({ error: 'Vendors must be an array' });
      }
      booking.vendors = vendors;
    }

    booking.updatedAt = Date.now();
    await booking.save();

    // Non-blocking realtime projection update
    syncBookingToFirebase(booking);

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error updating booking' });
  }
});

// Cancel booking
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Keep Firebase projection consistent with cancellation state
    syncBookingToFirebase(booking);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

export default router;

import express from 'express';
import Booking from '../models/Booking.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create booking
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventCategory, packageName, venue, guests, eventDate, totalAmount, vendors } = req.body;

    if (!eventCategory || !packageName || !venue || !guests || !eventDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = new Booking({
      userId: req.user.userId,
      eventCategory,
      packageName,
      venue,
      guests,
      eventDate,
      totalAmount,
      vendors: vendors || [],
      paymentStatus: 'pending'
    });

    await booking.save();

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
    if (venue) booking.venue = venue;
    if (guests) booking.guests = guests;
    if (eventDate) booking.eventDate = eventDate;
    if (vendors) booking.vendors = vendors;

    booking.updatedAt = Date.now();
    await booking.save();

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

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

export default router;

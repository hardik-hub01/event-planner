import express from 'express';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Admin middleware - check if user is admin
const isAdmin = async (req, res, next) => {
  // TODO: Implement proper admin role checking
  // For now, we'll implement in full version
  next();
};

// Dashboard stats
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingPayments = await Booking.countDocuments({ paymentStatus: 'pending' });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalUsers,
      totalBookings,
      completedBookings,
      pendingPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      conversionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// Get all users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Get all bookings
router.get('/bookings', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Bookings list error:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Get booking details
router.get('/bookings/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Booking details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.put('/bookings/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, paymentStatus, notes } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentStatus,
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Log audit
    const auditLog = new AuditLog({
      userId: req.user.userId,
      action: 'UPDATE',
      resource: 'Booking',
      resourceId: req.params.id,
      changes: { status, paymentStatus }
    });
    await auditLog.save();

    res.json({ message: 'Booking updated', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error updating booking' });
  }
});

// Cancel booking
router.delete('/bookings/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    // Log audit
    const auditLog = new AuditLog({
      userId: req.user.userId,
      action: 'CANCEL',
      resource: 'Booking',
      resourceId: req.params.id
    });
    await auditLog.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

// Get audit logs
router.get('/logs', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, action } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ error: 'Server error fetching logs' });
  }
});

// Get user details
router.get('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const bookings = await Booking.find({ userId: req.params.id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
      bookings,
      totalSpent: bookings.reduce((sum, b) => sum + (b.paymentStatus === 'completed' ? b.totalAmount : 0), 0),
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

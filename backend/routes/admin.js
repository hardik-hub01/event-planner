import express from 'express';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { syncBookingToFirebase } from '../services/firebaseSync.js';

const router = express.Router();

const normalizeRole = (role) => {
  if (role === 'superadmin') return 'owner';
  if (role === 'admin' || role === 'vendor_manager' || role === 'booking_manager') return 'staff';
  return role;
};

const requireAdminRoles = (allowedRoles) => (req, res, next) => {
  if (!req.admin?.role) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!allowedRoles.includes(req.admin.role)) {
    return res.status(403).json({ error: 'Insufficient role permissions' });
  }

  next();
};

// Admin middleware - check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const admin = await AdminUser.findOne({
      email: req.user.email.toLowerCase(),
      isActive: true
    }).lean();

    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = {
      id: admin._id,
      role: normalizeRole(admin.role),
      legacyRole: admin.role,
      permissions: admin.permissions || []
    };

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ error: 'Server error during admin authorization' });
  }
};

router.get('/me', authMiddleware, isAdmin, async (req, res) => {
  res.json({
    admin: {
      id: req.admin.id,
      role: req.admin.role,
      legacyRole: req.admin.legacyRole,
      permissions: req.admin.permissions
    }
  });
});

// Dashboard stats
router.get('/stats', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
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
router.get('/users', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
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
router.get('/bookings', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
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
router.get('/bookings/:id', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
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
router.put('/bookings/:id', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff']), async (req, res) => {
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
router.delete('/bookings/:id', authMiddleware, isAdmin, requireAdminRoles(['owner']), async (req, res) => {
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
router.get('/logs', authMiddleware, isAdmin, requireAdminRoles(['owner']), async (req, res) => {
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

// Get sync failures for observability
router.get('/sync-failures', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const failures = await Booking.find({ syncStatus: 'failed' })
      .select('_id bookingRef userId status lastSyncError retryCount maxRetries isDead nextRetryAt lastSyncedAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit);

    res.json({
      failures: failures.map((booking) => ({
        bookingId: booking._id,
        bookingRef: booking.bookingRef,
        userId: booking.userId,
        status: booking.status,
        error: booking.lastSyncError,
        retryCount: booking.retryCount,
        maxRetries: booking.maxRetries,
        isDead: booking.isDead,
        nextRetryAt: booking.nextRetryAt,
        lastSyncedAt: booking.lastSyncedAt,
        updatedAt: booking.updatedAt
      })),
      total: failures.length
    });
  } catch (error) {
    console.error('Sync failures fetch error:', error);
    res.status(500).json({ error: 'Server error fetching sync failures' });
  }
});

router.get('/sync-health', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const [total, pending, failed, dead, synced, failures] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ syncStatus: 'pending' }),
      Booking.countDocuments({ syncStatus: 'failed', isDead: false }),
      Booking.countDocuments({ syncStatus: 'failed', isDead: true }),
      Booking.countDocuments({ syncStatus: 'synced' }),
      Booking.find({ syncStatus: 'failed' })
        .select('_id bookingRef userId status lastSyncError retryCount maxRetries isDead nextRetryAt lastSyncedAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit)
    ]);

    res.json({
      stats: { total, synced, pending, failed, dead },
      failures: failures.map((booking) => ({
        bookingId: booking._id,
        bookingRef: booking.bookingRef,
        userId: booking.userId,
        status: booking.status,
        error: booking.lastSyncError,
        retryCount: booking.retryCount,
        maxRetries: booking.maxRetries,
        isDead: booking.isDead,
        nextRetryAt: booking.nextRetryAt,
        lastSyncedAt: booking.lastSyncedAt,
        updatedAt: booking.updatedAt
      }))
    });
  } catch (error) {
    console.error('Sync health fetch error:', error);
    res.status(500).json({ error: 'Server error fetching sync health' });
  }
});

router.get('/sync-stats', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ syncStatus: 'pending' });
    const failed = await Booking.countDocuments({ syncStatus: 'failed', isDead: false });
    const dead = await Booking.countDocuments({ syncStatus: 'failed', isDead: true });
    const synced = await Booking.countDocuments({ syncStatus: 'synced' });

    res.json({ total, synced, pending, failed, dead });
  } catch (error) {
    console.error('Sync stats fetch error:', error);
    res.status(500).json({ error: 'Server error fetching sync stats' });
  }
});

// Manual retry for failed/dead sync booking
router.post('/retry-booking/:id', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const canManualRetry = booking.isDead || booking.retryCount >= booking.maxRetries;
    if (!canManualRetry) {
      return res.status(409).json({
        error: 'Manual retry is allowed only for dead-letter or exhausted retry bookings'
      });
    }

    booking.retryCount = 0;
    booking.isDead = false;
    booking.nextRetryAt = new Date();
    booking.syncStatus = 'pending';
    booking.lastSyncError = null;
    booking.updatedAt = new Date();
    await booking.save();

    // Non-blocking manual sync trigger
    syncBookingToFirebase(booking);

    res.json({
      message: 'Booking sync retry triggered',
      bookingId: booking._id,
      syncStatus: booking.syncStatus
    });
  } catch (error) {
    console.error('Manual retry booking sync error:', error);
    res.status(500).json({ error: 'Server error triggering booking retry' });
  }
});

// Get user details
router.get('/users/:id', authMiddleware, isAdmin, requireAdminRoles(['owner', 'staff', 'support']), async (req, res) => {
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

import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  password: String,
  role: {
    type: String,
    enum: [
      'owner',
      'staff',
      'support',
      'admin',
      'superadmin',
      'vendor_manager',
      'booking_manager'
    ],
    default: 'staff'
  },
  permissions: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AdminUser', adminUserSchema);

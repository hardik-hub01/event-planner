import express from 'express';
import jwt from 'jsonwebtoken';
import { validationResult, body } from 'express-validator';
import User from '../models/User.js';
import VerificationToken from '../models/VerificationToken.js';
import { authLimiter, passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimiter.js';
import { generateOTP, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateSignUp = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
];

const validateSignIn = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const validateVerification = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail()
];

const validateNewPassword = [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

// Sign Up - Step 1: Send OTP
router.post('/signup-start', emailVerificationLimiter, validateSignUp, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, eventInterest } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create temporary user (not verified)
    user = new User({
      name,
      email,
      password,
      eventInterest: eventInterest || 'wedding',
      isVerified: false
    });

    await user.save();

    // Store OTP token
    const token = new VerificationToken({
      userId: user._id,
      otp,
      type: 'email_verification',
      expiresAt
    });

    await token.save();

    // Send OTP email
    await sendVerificationEmail(email, otp);

    res.status(200).json({
      message: 'OTP sent to your email. Please verify within 10 minutes.',
      email,
      userId: user._id
    });
  } catch (error) {
    console.error('Sign up start error:', error);
    res.status(500).json({ error: 'Server error during sign up' });
  }
});

// Sign Up - Step 2: Verify OTP
router.post('/signup-verify', emailVerificationLimiter, validateVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Find and verify token
    const token = await VerificationToken.findOne({
      userId: user._id,
      type: 'email_verification',
      otp,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Mark token as used
    token.used = true;
    await token.save();

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Sign up verify error:', error);
    res.status(500).json({ error: 'Server error verifying email' });
  }
});

// Sign In
router.post('/signin', authLimiter, validateSignIn, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Server error during sign in' });
  }
});

// Forgot Password - Step 1: Request reset
router.post('/forgot-password', passwordResetLimiter, validatePasswordReset, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If email exists, password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store token hash
    const tokenHash = require('crypto').createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const token = new VerificationToken({
      userId: user._id,
      otp: tokenHash,
      type: 'password_reset',
      expiresAt
    });

    await token.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If email exists, password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - Step 2: Reset with token
router.post('/reset-password', validateNewPassword, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate reset tokens
    await VerificationToken.updateMany(
      { userId: user._id, type: 'password_reset' },
      { used: true }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

// Change Password (logged in)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Social login
router.post('/social-login', async (req, res) => {
  try {
    const { email, name, provider } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name required' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        password: Math.random().toString(36),
        loginMethod: provider,
        isVerified: true
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ error: 'Server error during social login' });
  }
});

export default router;

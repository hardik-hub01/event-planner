import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { firebaseAdminApp } from './config/firebaseAdmin.js';
import { startFirebaseRetryWorker } from './services/firebaseRetry.js';
import { initSentry, logger, requestLogger, errorLogger } from './services/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth-enhanced.js';
import bookingRoutes from './routes/bookings.js';
import eventRoutes from './routes/events.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

// Initialize Sentry for error tracking
initSentry();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(requestLogger);

// Rate limiting middleware
app.use('/api/', apiLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Structured error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 5000;

// Initialize server with async startup
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Database connection established');

    if (firebaseAdminApp) {
      startFirebaseRetryWorker(30000);
      console.log('✓ Firebase retry worker started');
    }

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ Firebase Admin: ${firebaseAdminApp ? 'Initialized' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

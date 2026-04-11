import Booking from '../models/Booking.js';
import { syncBookingToFirebase } from './firebaseSync.js';

let retryTimer = null;

export function startFirebaseRetryWorker(intervalMs = 30000) {
  if (retryTimer) {
    return retryTimer;
  }

  retryTimer = setInterval(async () => {
    try {
      const failedBookings = await Booking.find({
        syncStatus: 'failed',
        isDead: false,
        nextRetryAt: { $lte: new Date() }
      })
        .sort({ updatedAt: 1 })
        .limit(50);

      for (const booking of failedBookings) {
        await syncBookingToFirebase(booking);
      }
    } catch (error) {
      console.error('❌ Firebase retry worker failed:', error.message);
    }
  }, intervalMs);

  // Avoid keeping process alive only because of retry timer in non-server contexts.
  if (typeof retryTimer.unref === 'function') {
    retryTimer.unref();
  }

  console.log(`✓ Firebase retry worker started (every ${intervalMs / 1000}s)`);
  return retryTimer;
}

export function stopFirebaseRetryWorker() {
  if (!retryTimer) return;

  clearInterval(retryTimer);
  retryTimer = null;
}

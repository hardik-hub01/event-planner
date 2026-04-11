import { getFirebaseDatabase } from '../config/firebaseAdmin.js';
import Booking from '../models/Booking.js';

function toBookingProjection(booking) {
  return {
    bookingId: booking._id,
    version: typeof booking.__v === 'number' ? booking.__v : 0,
    userId: booking.userId,
    bookingRef: booking.bookingRef,
    event: {
      category: booking.eventCategory,
      packageName: booking.packageName,
      venue: booking.venue,
      guests: booking.guests,
      eventDate: booking.eventDate
    },
    amount: booking.totalAmount,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentGateway: booking.paymentGateway,
    updatedAt: Date.now(),
    syncStatus: 'synced'
  };
}

export async function syncBookingToFirebase(booking) {
  if (!booking?._id) return false;

  const bookingId = booking._id.toString();
  const currentRetryCount = Number(booking.retryCount || 0);
  const maxRetries = Number(booking.maxRetries || 10);
  const now = new Date();

  try {
    const db = getFirebaseDatabase();
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const projection = toBookingProjection(booking);

    await Booking.findByIdAndUpdate(bookingId, {
      syncStatus: 'pending',
      lastSyncError: null,
      nextRetryAt: now,
      updatedAt: now
    });

    const existingSnapshot = await bookingRef.once('value');
    const existingData = existingSnapshot.val();
    const existingVersion = typeof existingData?.version === 'number' ? existingData.version : -1;

    if (existingVersion > projection.version) {
      console.warn(`⚠️ Skipped stale Firebase sync for booking ${bookingId}`);
    } else {
      await bookingRef.set(projection);
    }

    await Booking.findByIdAndUpdate(bookingId, {
      syncStatus: 'synced',
      lastSyncError: null,
      lastSyncedAt: new Date(),
      retryCount: 0,
      isDead: false,
      nextRetryAt: new Date(),
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('❌ Firebase sync failed:', error.message);

    const nextRetryCount = currentRetryCount + 1;
    const shouldMarkDead = nextRetryCount >= maxRetries;
    const delayMs = Math.min(60000 * (2 ** currentRetryCount), 10 * 60 * 1000);
    const nextRetryAt = new Date(Date.now() + delayMs);

    await Booking.findByIdAndUpdate(bookingId, {
      syncStatus: 'failed',
      lastSyncError: error.message,
      retryCount: nextRetryCount,
      isDead: shouldMarkDead,
      nextRetryAt: shouldMarkDead ? null : nextRetryAt,
      updatedAt: new Date()
    });

    return false;
  }
}

export async function removeBookingFromFirebase(bookingId) {
  try {
    if (!bookingId) return;

    const db = getFirebaseDatabase();
    await db.ref(`bookings/${bookingId}`).remove();
  } catch (error) {
    console.error('❌ Firebase delete sync failed:', error.message);
  }
}

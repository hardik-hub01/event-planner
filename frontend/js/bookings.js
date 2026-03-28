// Bookings Module
import { apiClient } from './api.js';

class BookingManager {
  constructor() {
    this.bookings = [];
    this.currentBooking = null;
  }

  async createBooking(bookingData) {
    try {
      const result = await apiClient.createBooking(bookingData);
      this.currentBooking = result.booking;
      return result;
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  }

  async loadBookings() {
    try {
      this.bookings = await apiClient.getBookings();
      return this.bookings;
    } catch (error) {
      console.error('Failed to load bookings:', error);
      throw error;
    }
  }

  async getBooking(id) {
    try {
      return await apiClient.getBooking(id);
    } catch (error) {
      console.error('Failed to get booking:', error);
      throw error;
    }
  }

  async updateBooking(id, updates) {
    try {
      const result = await apiClient.updateBooking(id, updates);
      this.currentBooking = result.booking;
      return result;
    } catch (error) {
      console.error('Failed to update booking:', error);
      throw error;
    }
  }

  async cancelBooking(id) {
    try {
      await apiClient.cancelBooking(id);
      this.bookings = this.bookings.filter(b => b._id !== id);
      return true;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      throw error;
    }
  }

  getBookingProgress(booking) {
    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil > 14) return { percentage: 25, status: 'Booking Confirmed' };
    if (daysUntil > 7) return { percentage: 50, status: 'Vendors Confirmed' };
    if (daysUntil > 0) return { percentage: 75, status: 'Final Preparation' };
    if (daysUntil === 0) return { percentage: 90, status: 'Event in Progress' };
    return { percentage: 100, status: 'Completed' };
  }
}

export const bookingManager = new BookingManager();

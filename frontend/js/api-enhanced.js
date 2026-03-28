// Enhanced API Client with new endpoints
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000/api'
  : '/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('luminaToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('luminaToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('luminaToken');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  // ============ Auth ============
  async signUp(name, email, password, eventInterest) {
    return this.request('/auth/signup-start', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, eventInterest })
    });
  }

  async verifyOTP(email, otp) {
    const data = await this.request('/auth/signup-verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    this.setToken(data.token);
    return data;
  }

  async signIn(email, password) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async socialLogin(email, name, provider) {
    const data = await this.request('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({ email, name, provider })
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ============ Bookings ============
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async getBookings() {
    return this.request('/bookings');
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async updateBooking(id, updates) {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}`, { method: 'DELETE' });
  }

  // ============ Events ============
  async getCategories() {
    return this.request('/events/categories');
  }

  async getCategory(id) {
    return this.request(`/events/categories/${id}`);
  }

  async getPackages() {
    return this.request('/events/packages');
  }

  // ============ Payments ============
  async createPaymentIntent(bookingId, amount) {
    return this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ bookingId, amount })
    });
  }

  async confirmPayment(bookingId, paymentIntentId) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ bookingId, paymentIntentId })
    });
  }

  async getPaymentStatus(bookingId) {
    return this.request(`/payments/${bookingId}`);
  }

  // ============ Admin ============
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(page = 1, limit = 10, search = '') {
    return this.request(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
  }

  async getAdminBookings(page = 1, limit = 10, status = '', paymentStatus = '') {
    return this.request(`/admin/bookings?page=${page}&limit=${limit}&status=${status}&paymentStatus=${paymentStatus}`);
  }

  async getAdminLogs(page = 1, limit = 10) {
    return this.request(`/admin/logs?page=${page}&limit=${limit}`);
  }
}

export const apiClient = new APIClient();

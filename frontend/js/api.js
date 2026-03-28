// API Client Module
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

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

  // Auth endpoints
  async signUp(name, email, password, eventInterest) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, eventInterest })
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

  // Booking endpoints
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

  // Event endpoints
  async getCategories() {
    return this.request('/events/categories');
  }

  async getCategory(id) {
    return this.request(`/events/categories/${id}`);
  }

  async getPackages() {
    return this.request('/events/packages');
  }

  // Payment endpoints
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
}

export const apiClient = new APIClient();

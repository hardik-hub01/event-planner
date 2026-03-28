// Authentication Module
import { apiClient } from './api.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.loadUser();
  }

  loadUser() {
    const token = localStorage.getItem('luminaToken');
    const userData = localStorage.getItem('luminaUser');
    
    if (token && userData) {
      this.user = JSON.parse(userData);
      this.isAuthenticated = true;
    }
  }

  async signUp(name, email, password, eventInterest) {
    const result = await apiClient.signUp(name, email, password, eventInterest);
    this.user = result.user;
    this.isAuthenticated = true;
    localStorage.setItem('luminaUser', JSON.stringify(result.user));
    return result;
  }

  async signIn(email, password) {
    const result = await apiClient.signIn(email, password);
    this.user = result.user;
    this.isAuthenticated = true;
    localStorage.setItem('luminaUser', JSON.stringify(result.user));
    return result;
  }

  async socialLogin(email, name, provider) {
    const result = await apiClient.socialLogin(email, name, provider);
    this.user = result.user;
    this.isAuthenticated = true;
    localStorage.setItem('luminaUser', JSON.stringify(result.user));
    return result;
  }

  signOut() {
    this.user = null;
    this.isAuthenticated = false;
    apiClient.clearToken();
    localStorage.removeItem('luminaUser');
    localStorage.removeItem('luminaToken');
  }

  getCurrentUser() {
    return this.user;
  }

  isLoggedIn() {
    return this.isAuthenticated && !!localStorage.getItem('luminaToken');
  }
}

export const authManager = new AuthManager();

// Events Module
import { apiClient } from './api.js';

class EventManager {
  constructor() {
    this.categories = {};
    this.packages = [];
    this.currentCategory = null;
  }

  async loadCategories() {
    try {
      this.categories = await apiClient.getCategories();
      return this.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }

  async loadPackages() {
    try {
      this.packages = await apiClient.getPackages();
      return this.packages;
    } catch (error) {
      console.error('Failed to load packages:', error);
      throw error;
    }
  }

  getCategory(id) {
    return this.categories[id];
  }

  getCategoryPackages(categoryId) {
    return this.packages.filter(pkg => pkg.categoryId === categoryId);
  }

  getPackage(packageId) {
    return this.packages.find(pkg => pkg.id === packageId);
  }
}

export const eventManager = new EventManager();

// UI Utilities Module

export const UI = {
  showAlert(message, type = 'info') {
    // You can replace this with a better notification system
    alert(message);
  },

  showError(message) {
    this.showAlert(`Error: ${message}`, 'error');
  },

  showSuccess(message) {
    this.showAlert(`Success: ${message}`, 'success');
  },

  navigateTo(viewId) {
    document.querySelectorAll('.view-section').forEach(el => {
      el.classList.add('hidden');
    });
    const view = document.getElementById(`${viewId}-view`);
    if (view) {
      view.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
      // Remove existing error
      const existing = field.parentElement.querySelector('.form-error');
      if (existing) existing.remove();

      // Add new error
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error text-red-600 text-sm font-medium mt-2 p-2 bg-red-50 rounded';
      errorDiv.textContent = message;
      field.parentElement.appendChild(errorDiv);
    }
  },

  clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.remove());
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  },

  formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
};

export const Validators = {
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  validatePassword(password) {
    return password && password.length >= 6;
  },

  validateName(name) {
    return name && name.trim().length >= 2;
  }
};

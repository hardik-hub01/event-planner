import { loginWithGoogle } from './firebase/auth.js';
import { firebaseEnabled } from './firebase/config.js';

function attachGoogleLogin() {
  const googleButton = document.getElementById('googleBtn');

  if (!googleButton) {
    return;
  }

  if (!firebaseEnabled) {
    googleButton.disabled = true;
    googleButton.title = 'Firebase config is missing. Create frontend/.env with VITE_FIREBASE_* values.';
    googleButton.classList.add('opacity-50', 'cursor-not-allowed');
    googleButton.addEventListener('click', () => {
      alert('Firebase config is missing. Create frontend/.env from frontend/.env.example and fill the VITE_FIREBASE_* values first.');
    });
    return;
  }

  googleButton.addEventListener('click', async () => {
    try {
      const result = await loginWithGoogle();
      const displayName = result.user?.name || result.user?.email || 'Google user';
      alert(`Login successful: ${displayName}`);
      window.dispatchEvent(new Event('lumina-auth-updated'));
    } catch (error) {
      console.error(error);
      alert(error?.message || 'Login failed');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachGoogleLogin);
} else {
  attachGoogleLogin();
}
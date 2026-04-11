import { firebaseGoogleSignIn } from './firebase/auth.js';

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : '/api';

export async function signInWithGoogle() {
  const credential = await firebaseGoogleSignIn();
  const user = credential.user;
  const idToken = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Unable to complete Google sign in');
  }

  const data = await response.json();
  localStorage.setItem('luminaToken', data.token);
  localStorage.setItem('luminaUser', JSON.stringify(data.user));

  return {
    ...data,
    firebaseUser: {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Google User',
      photoURL: user.photoURL || ''
    }
  };
}

if (typeof window !== 'undefined') {
  window.luminaAuth = {
    ...(window.luminaAuth || {}),
    signInWithGoogle
  };
}
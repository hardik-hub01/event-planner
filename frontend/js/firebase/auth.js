import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { app } from './config.js';

export const firebaseAuth = app ? getAuth(app) : null;

export function ensureFirebaseAuth() {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured. Set VITE_FIREBASE_* env values.');
  }
  return firebaseAuth;
}

export function firebaseSignUp(email, password) {
  return createUserWithEmailAndPassword(ensureFirebaseAuth(), email, password);
}

export function firebaseSignIn(email, password) {
  return signInWithEmailAndPassword(ensureFirebaseAuth(), email, password);
}

export async function loginWithGoogle() {
  const auth = ensureFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  const apiBaseUrl = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : '/api';

  const response = await fetch(`${apiBaseUrl}/auth/firebase-login`, {
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

  return data;
}

export function firebaseSignOut() {
  return signOut(ensureFirebaseAuth());
}

export function onFirebaseAuthChange(callback) {
  return onAuthStateChanged(ensureFirebaseAuth(), callback);
}

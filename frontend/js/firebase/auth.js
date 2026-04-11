import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { firebaseApp } from './config.js';

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

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

export function firebaseSignOut() {
  return signOut(ensureFirebaseAuth());
}

export function onFirebaseAuthChange(callback) {
  return onAuthStateChanged(ensureFirebaseAuth(), callback);
}

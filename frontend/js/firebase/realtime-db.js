import { getDatabase, ref, set, update, get, push, remove, onValue } from 'firebase/database';
import { firebaseApp } from './config.js';

export const realtimeDb = firebaseApp ? getDatabase(firebaseApp) : null;

function ensureRealtimeDb() {
  if (!realtimeDb) {
    throw new Error('Firebase Realtime Database is not configured.');
  }
  return realtimeDb;
}

export function dbRef(path) {
  return ref(ensureRealtimeDb(), path);
}

export function dbSet(path, value) {
  return set(dbRef(path), value);
}

export function dbUpdate(path, value) {
  return update(dbRef(path), value);
}

export function dbGet(path) {
  return get(dbRef(path));
}

export function dbPush(path, value) {
  const targetRef = ref(ensureRealtimeDb(), path);
  const newRef = push(targetRef);
  return set(newRef, value).then(() => newRef.key);
}

export function dbRemove(path) {
  return remove(dbRef(path));
}

export function dbOnValue(path, callback, errorCallback) {
  return onValue(dbRef(path), callback, errorCallback);
}

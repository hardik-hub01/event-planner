import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { firebaseApp } from './config.js';

export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;

function ensureFirestore() {
  if (!firestoreDb) {
    throw new Error('Firebase Firestore is not configured.');
  }
  return firestoreDb;
}

export function fsCollection(path) {
  return collection(ensureFirestore(), path);
}

export function fsDoc(path, id) {
  return doc(ensureFirestore(), path, id);
}

export function fsSet(path, id, value, options = { merge: true }) {
  return setDoc(fsDoc(path, id), value, options);
}

export function fsAdd(path, value) {
  return addDoc(fsCollection(path), value);
}

export function fsGet(path, id) {
  return getDoc(fsDoc(path, id));
}

export function fsList(path) {
  return getDocs(fsCollection(path));
}

export function fsUpdate(path, id, value) {
  return updateDoc(fsDoc(path, id), value);
}

export function fsDelete(path, id) {
  return deleteDoc(fsDoc(path, id));
}

export function fsQuery(path, field, op, value) {
  return getDocs(query(fsCollection(path), where(field, op, value)));
}

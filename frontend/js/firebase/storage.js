import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { firebaseApp } from './config.js';

export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;

function ensureStorage() {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not configured.');
  }
  return firebaseStorage;
}

export function storageRef(path) {
  return ref(ensureStorage(), path);
}

export async function uploadFile(path, file, metadata = {}) {
  const uploadResult = await uploadBytes(storageRef(path), file, metadata);
  const downloadURL = await getDownloadURL(uploadResult.ref);
  return { uploadResult, downloadURL };
}

export function removeFile(path) {
  return deleteObject(storageRef(path));
}

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

function parseServiceAccountFromPath() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

  const resolved = path.resolve(configuredPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service account file not found at: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Invalid serviceAccount JSON file');
  }
}

function initializeFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = parseServiceAccountFromPath();

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('🔥 Firebase Admin: Initialized');

  return app;
}

export const firebaseAdminApp = initializeFirebase();

export function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    throw new Error('Firebase Admin is not configured.');
  }
  return admin;
}

export function getFirebaseAuth() {
  return getFirebaseAdmin().auth();
}

export function getFirebaseFirestore() {
  return getFirebaseAdmin().firestore();
}

export function getFirebaseDatabase() {
  return getFirebaseAdmin().database();
}

export function getFirebaseStorage() {
  return getFirebaseAdmin().storage();
}

export function getFirebaseMessaging() {
  return getFirebaseAdmin().messaging();
}

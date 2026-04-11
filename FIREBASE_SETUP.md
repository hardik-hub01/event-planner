# Firebase Setup (All Products)

This project is now scaffolded for:
- Realtime Database
- Firebase Auth
- Firestore
- Storage
- Cloud Messaging (FCM)

## 1. Frontend Setup

Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env` and fill values:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_DATABASE_URL
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID
- VITE_FIREBASE_VAPID_KEY (for FCM web push)

## 2. Backend Setup (Service Account)

Copy [backend/.env.example](backend/.env.example) to `backend/.env`.

You can provide Firebase Admin credentials in **one** of these ways:

### Option A: split env fields
Set:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

For private key formatting in `.env`, keep newlines escaped as `\\n`.

### Option B: base64 JSON
1. Download service account JSON from Firebase Console.
2. Base64 encode the whole JSON file.
3. Set `FIREBASE_SERVICE_ACCOUNT_BASE64`.

### Option C: JSON file path
1. Save JSON to a local path outside git tracking.
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH`.

## 3. Secure Ways To Share Service Account With Me

Use one of these safe methods (recommended order):

1. Paste only env key names with values redacted first, e.g. `FIREBASE_CLIENT_EMAIL=...`.
2. Create local `backend/.env` yourself and tell me "done" so I continue without seeing secrets.
3. If you must share, share temporary credentials and rotate immediately after setup.

Never commit service account JSON or private key into git.

## 4. Files Added

### Frontend Firebase
- [frontend/js/firebase/config.js](frontend/js/firebase/config.js)
- [frontend/js/firebase/auth.js](frontend/js/firebase/auth.js)
- [frontend/js/firebase/realtime-db.js](frontend/js/firebase/realtime-db.js)
- [frontend/js/firebase/firestore.js](frontend/js/firebase/firestore.js)
- [frontend/js/firebase/storage.js](frontend/js/firebase/storage.js)
- [frontend/js/firebase/messaging.js](frontend/js/firebase/messaging.js)
- [frontend/js/firebase/index.js](frontend/js/firebase/index.js)
- [frontend/firebase-messaging-sw.js](frontend/firebase-messaging-sw.js)

### Backend Firebase Admin
- [backend/config/firebaseAdmin.js](backend/config/firebaseAdmin.js)

## 5. Next Integration Steps

Once your env values are set, I can wire:
- Firebase Auth login/register flow into current UI
- Realtime booking mirrors under `/bookings/{bookingId}`
- Firestore admin analytics collections
- Storage uploads for event assets
- FCM token capture and notification sending endpoints

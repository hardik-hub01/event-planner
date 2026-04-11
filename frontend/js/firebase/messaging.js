import { getMessaging, getToken, onMessage, isSupported as messagingSupported } from 'firebase/messaging';
import { firebaseApp } from './config.js';

let messagingInstancePromise = null;

export async function getFirebaseMessaging() {
  if (!firebaseApp || typeof window === 'undefined') {
    return null;
  }

  if (!messagingInstancePromise) {
    messagingInstancePromise = (async () => {
      const supported = await messagingSupported();
      return supported ? getMessaging(firebaseApp) : null;
    })();
  }

  return messagingInstancePromise;
}

export async function getFcmToken(vapidKey) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  });
}

export async function listenForegroundMessages(callback) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, callback);
}

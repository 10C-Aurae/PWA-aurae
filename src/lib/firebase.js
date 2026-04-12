/**
 * Firebase — inicialización condicional.
 *
 * Requiere en .env:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY
 *
 * Si no están definidas, el módulo exporta null y FCM queda deshabilitado.
 */

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
  VITE_FIREBASE_VAPID_KEY: vapidKey,
} = import.meta.env

const configured = !!(apiKey && projectId && messagingSenderId && appId && vapidKey)

let messagingInstance = null

export async function getMessaging() {
  if (!configured) return null
  if (messagingInstance) return messagingInstance

  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getMessaging: _getMessaging } = await import('firebase/messaging')

  const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  messagingInstance = _getMessaging(app)
  return messagingInstance
}

export { vapidKey, configured }

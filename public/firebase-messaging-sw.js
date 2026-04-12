// Firebase Cloud Messaging service worker — requerido por FCM para
// notificaciones en segundo plano.
//
// Las variables VITE_* no están disponibles aquí (service worker no usa Vite).
// Los valores se inyectan en runtime desde el cliente al llamar
// getToken({ serviceWorkerRegistration }).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// La configuración se pasa desde el cliente mediante postMessage
let messaging = null

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    if (messaging) return
    firebase.initializeApp(event.data.config)
    messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {}
      if (!title) return
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: payload.data,
      })
    })
  }
})

import { useEffect, useRef } from 'react'
import { configured, getMessaging, vapidKey } from '../lib/firebase'
import * as usuariosApi from '../api/usuariosApi'

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Solicita permiso de notificaciones, obtiene el token FCM y lo registra
 * en el backend. Solo se ejecuta una vez por sesión de usuario.
 * Si Firebase no está configurado (VITE_FIREBASE_* no definidas) no hace nada.
 */
export function useFCM(user) {
  const registered = useRef(false)

  useEffect(() => {
    if (!user || registered.current || !configured) return
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return

    let cancelled = false

    async function register() {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted' || cancelled) return

        // Registrar el service worker de FCM manualmente para poder pasarle config
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        await navigator.serviceWorker.ready

        // Enviar config al SW (el SW no tiene acceso a import.meta.env)
        swReg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG })

        const { getToken } = await import('firebase/messaging')
        const messaging = await getMessaging()
        if (!messaging || cancelled) return

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg })
        if (!token || cancelled) return

        await usuariosApi.fcmToken(token)
        registered.current = true
      } catch {
        // FCM errors are non-fatal — never break the app
      }
    }

    register()
    return () => { cancelled = true }
  }, [user])
}

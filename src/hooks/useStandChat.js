import { useState, useEffect, useRef, useCallback } from 'react'
import * as standChatApi from '../api/standChatApi'

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ?.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'))
  ?.replace(/\/api\/v1\/?$/, '')

/**
 * Hook de chat en tiempo real entre un asistente y el staff de un stand.
 *
 * @param {string} standId       - ID del stand
 * @param {string} currentUserId - ID del usuario autenticado
 * @returns {{ messages, sendMessage, connected, error, loading }}
 */
export function useStandChat(standId, currentUserId) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const wsRef = useRef(null)

  // Historial inicial REST
  useEffect(() => {
    if (!standId) return
    setLoading(true)
    standChatApi.historial(standId)
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [standId])

  // WebSocket
  useEffect(() => {
    if (!standId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const url = `${WS_BASE}/api/v1/chat-stand/ws/${standId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages((prev) => {
          // avoid duplicates (REST + WS may deliver same message)
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      } catch { /* ignorar */ }
    }

    ws.onerror = () => setError('Error de conexión')

    ws.onclose = (e) => {
      setConnected(false)
      if (e.code === 4001) setError('No autorizado')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [standId])

  const sendMessage = useCallback((texto, paraUsuarioId = null) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Fallback REST si WS no conectó
      standChatApi.enviar(standId, texto, paraUsuarioId)
        .then((res) => {
          setMessages((prev) =>
            prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]
          )
        })
        .catch(() => setError('No se pudo enviar el mensaje'))
      return
    }
    ws.send(JSON.stringify({ texto, para_usuario_id: paraUsuarioId }))
  }, [standId])

  return { messages, sendMessage, connected, error, loading }
}

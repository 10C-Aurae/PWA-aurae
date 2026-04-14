import { useState, useEffect, useRef, useCallback } from 'react'
import * as chatApi from '../api/chatApi'

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ?.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'))
  ?.replace(/\/api\/v1\/?$/, '')  // quita el path REST, solo necesitamos el host

/**
 * Hook de chat en tiempo real para un evento.
 *
 * @param {string} eventoId  - ID del evento
 * @returns {{ messages, sendMessage, connected, error }}
 */
export function useChat(eventoId) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError]   = useState(null)
  const wsRef = useRef(null)

  // Cargar historial inicial vía REST
  useEffect(() => {
    if (!eventoId) return
    chatApi.historial(eventoId)
      .then((res) => setMessages(res.data))
      .catch(() => {})  // si falla el historial, el WS sigue funcionando
  }, [eventoId])

  // Conectar WebSocket
  useEffect(() => {
    if (!eventoId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const url = `${WS_BASE}/api/v1/chat/ws/${eventoId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages((prev) => [...prev, msg])
      } catch { /* ignorar frames malformados */ }
    }

    ws.onerror = () => setError('Error de conexión al chat')

    ws.onclose = (e) => {
      setConnected(false)
      if (e.code === 4001) setError('No autorizado para este chat')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [eventoId])

  const sendMessage = useCallback((texto) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ texto }))
  }, [])

  return { messages, sendMessage, connected, error }
}

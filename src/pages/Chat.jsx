import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { Send, Wifi, WifiOff } from 'lucide-react'

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function Bubble({ msg, isOwn }) {
  const auraColor = msg.aura_color || '#6366f1'
  const borderStyle = { borderColor: auraColor }

  return (
    <div className={`flex flex-col max-w-[78%] gap-0.5 ${isOwn ? 'ml-auto items-end' : 'items-start'}`}>
      {/* Nombre siempre visible — propio a la derecha, ajeno a la izquierda */}
      <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] font-bold text-aura-ink leading-none">{msg.nombre_usuario}</span>
        {msg.arquetipo && (
          <span className="text-[9px] text-aura-faint">{msg.arquetipo}</span>
        )}
      </div>

      {/* Burbuja con borde del color Aura */}
      <div
        className={`rounded-2xl border-2 px-3 py-2 text-sm leading-snug break-words bg-aura-surface text-aura-ink ${
          isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={borderStyle}
      >
        {msg.texto}
      </div>

      <span className="text-[9px] text-aura-faint px-1">{formatTime(msg.created_at)}</span>
    </div>
  )
}

export default function Chat() {
  const { evento_id } = useParams()
  const { user } = useAuth()
  const { messages, sendMessage, connected, error } = useChat(evento_id)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !connected) return
    sendMessage(text)
    setDraft('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // iOS: cuando el teclado baja, el viewport queda desplazado hacia arriba.
  // Forzar scroll a 0 con un pequeño delay para que el browser termine de animar.
  const handleBlur = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 100)
  }

  return (
    <div className="flex flex-col bg-aura-bg" style={{ height: '100dvh' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-aura-border bg-aura-nav shadow-nav">
        <Link to={`/eventos/${evento_id}`} className="text-aura-muted hover:text-aura-ink transition-colors">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-aura-ink text-sm leading-tight">Chat del evento</p>
          <p className="text-[10px] text-aura-faint">Sala compartida con todos los asistentes</p>
        </div>
        <div className="flex items-center gap-1.5">
          {connected
            ? <Wifi size={14} className="text-green-400" />
            : <WifiOff size={14} className="text-red-400" />}
          <span className={`text-[10px] font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'En línea' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-aura-muted text-sm">Sé el primero en escribir algo ✌️</p>
          </div>
        )}
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            isOwn={msg.usuario_id === user?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-3 border-t border-aura-border bg-aura-nav" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            // Auto-resize compatible con Safari
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
          }}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder="Escribe un mensaje…"
          maxLength={500}
          className="flex-1 resize-none rounded-2xl border border-aura-border bg-aura-surface px-4 py-2.5 text-sm text-aura-ink placeholder-aura-faint focus:border-aura-primary focus:outline-none leading-snug overflow-y-auto"
          style={{ minHeight: '40px', maxHeight: '112px' }}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !draft.trim()}
          className="flex-shrink-0 h-10 w-10 rounded-full bg-aura-primary flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-40 transition-all active:scale-95"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, Wifi, WifiOff, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useStandChat } from '../hooks/useStandChat'
import * as standsApi from '../api/standsApi'

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function Bubble({ msg, isOwn }) {
  const isStaff = msg.es_staff
  return (
    <div className={`flex flex-col max-w-[78%] gap-0.5 ${isOwn ? 'ml-auto items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] font-bold text-white leading-none">
          {isStaff ? '🧑‍🍳 Staff' : msg.nombre_usuario}
        </span>
      </div>
      <div
        className={`rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
          isOwn
            ? 'bg-aura-primary text-white rounded-br-sm'
            : isStaff
              ? 'bg-green-500/20 border border-green-500/30 text-green-300 rounded-bl-sm'
              : 'bg-aura-surface border border-aura-border text-white rounded-bl-sm'
        }`}
      >
        {msg.texto}
      </div>
      <span className="text-[9px] text-gray-600 px-1">{formatTime(msg.created_at)}</span>
    </div>
  )
}

export default function StandChat() {
  const { stand_id } = useParams()
  const { user } = useAuth()
  const { messages, sendMessage, connected, error, loading } = useStandChat(stand_id, user?.id)
  const [stand, setStand]   = useState(null)
  const [draft, setDraft]   = useState('')
  const bottomRef           = useRef(null)

  useEffect(() => {
    standsApi.obtener(stand_id).then((r) => setStand(r.data)).catch(() => {})
  }, [stand_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    sendMessage(text)
    setDraft('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBlur = () => {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 100)
  }

  return (
    <div className="flex flex-col bg-aura-bg" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-aura-border bg-aura-nav shadow-nav">
        <Link
          to={-1}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </Link>

        {stand?.imagen_url && (
          <img
            src={stand.imagen_url}
            alt={stand.nombre}
            className="h-9 w-9 rounded-lg object-cover flex-shrink-0 border border-aura-border"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">
            {stand ? `${stand.nombre}` : 'Cargando…'}
          </p>
          <p className="text-[10px] text-gray-500">Pedidos y preguntas al stand</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {connected
            ? <Wifi size={13} className="text-green-400" />
            : <WifiOff size={13} className="text-red-400" />}
          <span className={`text-[10px] font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'En línea' : 'Desconectado'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center py-12 text-gray-500 text-sm">Cargando mensajes…</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-aura-surface border border-aura-border flex items-center justify-center">
              <ShoppingBag size={22} className="text-gray-500" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Envía tu pedido</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Escribe lo que quieres ordenar y el staff te responderá.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            isOwn={!msg.es_staff && msg.usuario_id === user?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-2 px-3 py-3 border-t border-aura-border bg-aura-nav"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
          }}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder="Escribe tu pedido o pregunta…"
          maxLength={500}
          className="flex-1 resize-none rounded-2xl border border-aura-border bg-aura-surface px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-aura-primary focus:outline-none leading-snug overflow-y-auto"
          style={{ minHeight: '40px', maxHeight: '112px' }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="flex-shrink-0 h-10 w-10 rounded-full bg-aura-primary flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-40 transition-all active:scale-95"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

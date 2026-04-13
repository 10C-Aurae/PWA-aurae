import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react'
import * as auraFlowApi from '../api/auraFlowApi'

const PREGUNTAS_SUGERIDAS = [
  '¿Dónde están los baños?',
  '¿Hay acceso para personas con discapacidad?',
  '¿A qué hora inicia el evento?',
  '¿Dónde está el estacionamiento?',
  '¿Hay servicio de guardarropa?',
]

export default function ChatbotEvento({ eventoId, eventoNombre }) {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Hola, soy el asistente de "${eventoNombre}". Puedo ayudarte con información sobre el evento. ¿Qué necesitas saber?`,
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (texto) => {
    const pregunta = (texto ?? input).trim()
    if (!pregunta || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: pregunta }])
    setInput('')
    setLoading(true)

    try {
      const res = await auraFlowApi.chat(eventoId, pregunta)
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.respuesta }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Tuve un problema al procesar tu pregunta. Intenta de nuevo o consulta al staff.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-aura-primary shadow-glow hover:bg-aura-primary-dark transition-all duration-200 lg:bottom-6"
        aria-label="Abrir chatbot del evento"
      >
        {open
          ? <X size={22} strokeWidth={2} className="text-white" />
          : <MessageCircle size={22} strokeWidth={1.5} className="text-white" />}
      </button>

      {/* ── Chat panel ───────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-44 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-aura-border bg-white shadow-xl flex flex-col overflow-hidden lg:bottom-24"
          style={{ height: '420px' }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 bg-aura-primary px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">Asistente del evento</p>
              <p className="text-[11px] text-white/70 truncate">{eventoNombre}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aura-surface flex-shrink-0 mt-0.5">
                    <Bot size={13} strokeWidth={1.5} className="text-aura-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-aura-primary text-white rounded-tr-sm'
                    : 'bg-aura-surface text-aura-ink rounded-tl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aura-surface flex-shrink-0">
                  <Bot size={13} strokeWidth={1.5} className="text-aura-primary" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-aura-surface px-3 py-2.5">
                  <Loader2 size={13} strokeWidth={2} className="text-aura-muted animate-spin" />
                  <span className="text-xs text-aura-muted">Pensando…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (only at start) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {PREGUNTAS_SUGERIDAS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-aura-border bg-white px-2.5 py-1 text-[11px] text-aura-muted hover:border-aura-primary hover:text-aura-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-aura-border p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-xl border border-aura-border bg-aura-surface px-3 py-2 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-aura-primary text-white hover:bg-aura-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

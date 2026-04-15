import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, MessageSquare, Send, QrCode } from 'lucide-react'
import * as colasApi from '../api/colaApi'
import * as standsApi from '../api/standsApi'
import * as standChatApi from '../api/standChatApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// ── Mensajes panel ─────────────────────────────────────────────────────────────

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ?.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'))
  ?.replace(/\/api\/v1\/?$/, '')

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function MensajesPanel({ stand_id }) {
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState({}) // { [usuario_id]: draft }
  const [sending, setSending] = useState({})
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    standChatApi.historial(stand_id).then((r) => setMessages(r.data)).catch(() => {})
    standChatApi.marcarLeidos(stand_id).catch(() => {})
  }, [stand_id])

  // WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !stand_id) return
    const url = `${WS_BASE}/api/v1/chat-stand/ws/${stand_id}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
        standChatApi.marcarLeidos(stand_id).catch(() => {})
      } catch { /* ignore */ }
    }
    return () => ws.close()
  }, [stand_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group messages by user
  const byUser = messages.reduce((acc, m) => {
    const uid = m.es_staff ? (m.para_usuario_id ?? 'staff') : m.usuario_id
    const key = m.es_staff ? m.para_usuario_id : m.usuario_id
    if (!key) return acc
    if (!acc[key]) acc[key] = { nombre: m.es_staff ? null : m.nombre_usuario, msgs: [] }
    if (!m.es_staff && !acc[key].nombre) acc[key].nombre = m.nombre_usuario
    acc[key].msgs.push(m)
    return acc
  }, {})

  const handleReply = async (userId) => {
    const texto = (reply[userId] || '').trim()
    if (!texto) return
    setSending((s) => ({ ...s, [userId]: true }))
    try {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ texto, para_usuario_id: userId }))
      } else {
        const res = await standChatApi.enviar(stand_id, texto, userId)
        setMessages((prev) =>
          prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]
        )
      }
      setReply((r) => ({ ...r, [userId]: '' }))
    } catch { /* ignore */ }
    finally { setSending((s) => ({ ...s, [userId]: false })) }
  }

  if (Object.keys(byUser).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <MessageSquare size={28} className="text-gray-600" strokeWidth={1.5} />
        <p className="text-sm text-gray-500">Aún no hay mensajes de pedidos</p>
        <p className="text-xs text-gray-600 text-center">Cuando un asistente escriba al stand, aparecerá aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(byUser).map(([userId, conv]) => (
        <div key={userId} className="rounded-2xl border border-aura-border bg-aura-card p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">
            {conv.nombre ?? 'Asistente'}
          </p>

          {/* Conversation */}
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {conv.msgs.map((m) => (
              <div key={m.id} className={`flex ${m.es_staff ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-snug ${
                    m.es_staff
                      ? 'bg-aura-primary text-white'
                      : 'bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <p>{m.texto}</p>
                  <span className="text-[9px] opacity-60 mt-0.5 block">{formatTime(m.created_at)}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={reply[userId] ?? ''}
              onChange={(e) => setReply((r) => ({ ...r, [userId]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleReply(userId)}
              placeholder="Responder…"
              maxLength={500}
              className="flex-1 rounded-xl border border-aura-border bg-aura-bg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-aura-primary focus:outline-none"
            />
            <button
              onClick={() => handleReply(userId)}
              disabled={sending[userId] || !reply[userId]?.trim()}
              className="h-9 w-9 rounded-xl bg-aura-primary flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-40 transition-all"
            >
              <Send size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StaffQueue() {
  const { stand_id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [stand, setStand] = useState(null)
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [tab, setTab] = useState('cola') // 'cola' | 'mensajes'
  const [noLeidos, setNoLeidos] = useState(0)

  const fetchData = async () => {
    try {
      const [standRes, colaRes] = await Promise.all([
        standsApi.obtener(stand_id),
        colasApi.porStand(stand_id),
      ])
      setStand(standRes.data)
      setEstado(colaRes.data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchNoLeidos = async () => {
    try {
      const res = await standChatApi.noLeidos(stand_id)
      setNoLeidos(res.data.no_leidos)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchData()
    fetchNoLeidos()
    const interval = setInterval(() => {
      fetchData()
      fetchNoLeidos()
    }, 10000)
    return () => clearInterval(interval)
  }, [stand_id])

  // Clear badge when switching to messages tab
  useEffect(() => {
    if (tab === 'mensajes') {
      setNoLeidos(0)
      standChatApi.marcarLeidos(stand_id).catch(() => {})
    }
  }, [tab, stand_id])

  const handleLlamar = async () => {
    setActionLoading(true)
    try {
      await colasApi.llamarSiguiente(stand_id)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al llamar siguiente')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAtendido = async (colaId) => {
    setActionLoading(true)
    try {
      await colasApi.marcarAtendido(colaId, stand_id)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al marcar atendido')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col">
      {/* Staff header */}
      <header className="sticky top-0 z-40 bg-aura-nav border-b border-white/10 shadow-nav px-4">
        <div className="mx-auto max-w-md flex h-14 items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 leading-none">Panel de cola</p>
            <p className="text-sm font-bold text-white leading-snug truncate max-w-[200px]">
              {stand?.nombre ?? '…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/staff/stand/${stand_id}/scan`)}
              className="flex items-center gap-1.5 rounded-lg border border-aura-primary/40 bg-aura-primary/10 px-3 py-1.5 text-xs font-semibold text-aura-primary hover:bg-aura-primary/20 transition-all"
              title="Escanear tickets"
            >
              <QrCode size={13} strokeWidth={2} />
              Escanear
            </button>
            <button
              onClick={fetchData}
              disabled={actionLoading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-all"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-aura-border bg-aura-nav">
        <div className="mx-auto max-w-md flex">
          <button
            onClick={() => setTab('cola')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'cola' ? 'text-white border-b-2 border-aura-primary' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Fila Virtual
          </button>
          <button
            onClick={() => setTab('mensajes')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
              tab === 'mensajes' ? 'text-white border-b-2 border-aura-primary' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Mensajes
            {noLeidos > 0 && (
              <span className="absolute top-2 right-[calc(50%-24px)] h-4 min-w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1">
                {noLeidos}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(`/staff/stand/${stand_id}/scan`)}
            className="flex-1 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300"
          >
            <QrCode size={13} strokeWidth={2} />
            Tickets
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 pb-safe">
        <div className="mx-auto max-w-md space-y-4">
          {loading && !stand && <LoadingSpinner center />}
          {error && <ErrorMessage message={error} onRetry={fetchData} />}

          {tab === 'cola' && estado && (
            <>
              {/* Atención actual */}
              <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
                <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  En atención ahora
                </h2>
                {estado.en_atencion ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-aura-primary/10 border border-aura-primary/30 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-aura-primary font-bold uppercase tracking-wider mb-0.5">
                          Turno #{estado.en_atencion.posicion}
                        </p>
                        {estado.en_atencion.servicio_nombre && (
                          <p className="text-xs text-gray-400">{estado.en_atencion.servicio_nombre}</p>
                        )}
                      </div>
                      <div className="h-10 w-10 rounded-full bg-aura-primary/20 flex items-center justify-center animate-pulse">
                        <span className="text-xl">👤</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAtendido(estado.en_atencion.id)}
                      disabled={actionLoading}
                      className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Marcar como Atendido
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/5 p-5 text-center border border-white/5">
                    <p className="text-gray-500 text-sm">Nadie en atención</p>
                  </div>
                )}
              </div>

              {/* Cola */}
              <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">En fila</h2>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{estado.total_esperando}</span>
                    <span className="text-xs text-gray-500 ml-1">(~{estado.tiempo_espera_min} min)</span>
                  </div>
                </div>
                <button
                  onClick={handleLlamar}
                  disabled={actionLoading || estado.total_esperando === 0}
                  className="w-full rounded-xl bg-aura-primary py-3.5 font-bold text-white hover:bg-blue-600 focus:ring-4 focus:ring-aura-primary/30 disabled:opacity-40 disabled:bg-gray-700 transition-all mb-4"
                >
                  {actionLoading ? 'Llamando…' : '📣  Llamar Siguiente'}
                </button>
                {estado.usuarios_en_cola.length === 0 ? (
                  <p className="text-center text-sm text-gray-600 py-4">La fila está vacía</p>
                ) : (
                  <div className="space-y-2">
                    {estado.usuarios_en_cola.map((u) => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 border border-white/10">
                        <div>
                          <span className="text-sm font-semibold text-white">#{u.posicion}</span>
                          {u.servicio_nombre && (
                            <span className="ml-2 text-xs text-gray-500">{u.servicio_nombre}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">~{u.tiempo_espera_min} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lastRefresh && (
                <p className="text-center text-[10px] text-gray-700">
                  Actualizado {lastRefresh.toLocaleTimeString()} · auto cada 10s
                </p>
              )}
            </>
          )}

          {tab === 'mensajes' && (
            <MensajesPanel stand_id={stand_id} />
          )}
        </div>
      </div>
    </div>
  )
}

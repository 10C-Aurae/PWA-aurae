import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Inbox } from 'lucide-react'
import * as notifApi from '../api/notificacionesApi'

const ICONOS = {
  bienvenida:      '🎉',
  turno_llamado:   '📣',
  mensaje_stand:   '💬',
  mensaje_evento:  '🗨️',
  ticket_comprado: '🎟️',
  aura_subio:      '✨',
  generico:        '🔔',
}

function formatRelativo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return 'Ahora'
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function NotificacionesPanel({ noLeidas, onLeer }) {
  const [open, setOpen]     = useState(false)
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await notifApi.listar()
      setNotifs(res.data ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (open) cargar()
  }, [open])

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleMarcarTodas = async () => {
    await notifApi.marcarTodas()
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
    onLeer?.()
  }

  const handleMarcarUna = async (id) => {
    await notifApi.marcarUna(id)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
    onLeer?.()
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Campana */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Notificaciones"
      >
        <Bell size={18} strokeWidth={1.5} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-h-[480px] flex flex-col rounded-2xl border border-aura-border bg-aura-nav shadow-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-bold text-white">Notificaciones</p>
            <div className="flex items-center gap-2">
              {notifs.some((n) => !n.leida) && (
                <button
                  onClick={handleMarcarTodas}
                  className="flex items-center gap-1 text-[11px] text-aura-primary hover:text-blue-300 transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={13} strokeWidth={2} />
                  Leer todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-white transition-colors">
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 rounded-full border-2 border-aura-primary border-t-transparent animate-spin" />
              </div>
            )}

            {!loading && notifs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Inbox size={28} className="text-stone-600" strokeWidth={1.5} />
                <p className="text-xs text-stone-500">Sin notificaciones</p>
              </div>
            )}

            {!loading && notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.leida && handleMarcarUna(n.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-white/5 transition-colors ${
                  n.leida ? 'opacity-60' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{ICONOS[n.tipo] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-xs font-semibold leading-tight ${n.leida ? 'text-stone-400' : 'text-white'}`}>
                      {n.titulo}
                    </p>
                    {!n.leida && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-aura-primary mt-0.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug line-clamp-2">{n.cuerpo}</p>
                  <p className="text-[10px] text-stone-600 mt-1">{formatRelativo(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

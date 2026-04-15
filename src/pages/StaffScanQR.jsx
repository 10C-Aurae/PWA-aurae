import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, CheckCircle, XCircle, AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import * as ticketsApi from '../api/ticketsApi'
import * as standsApi from '../api/standsApi'

const QR_REGION_ID = 'staff-qr-reader'

export default function StaffScanQR() {
  const { stand_id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [eventoId, setEventoId] = useState(null)
  const [estado, setEstado] = useState('idle') // idle | escaneando | procesando | ok | ya_usado | error
  const [resultado, setResultado] = useState(null)
  const [camError, setCamError] = useState('')
  const [contador, setContador] = useState({ ok: 0, duplicados: 0 })
  const scannerRef = useRef(null)

  // Obtener el evento_id desde el stand del staff
  useEffect(() => {
    standsApi.miStandStaff()
      .then((r) => setEventoId(r.data?.evento_id))
      .catch(() => {})
  }, [stand_id])

  const detenerScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      scannerRef.current = null
    }
  }

  const onScanSuccess = useCallback(async (qrCode) => {
    await detenerScanner()
    setEstado('procesando')

    try {
      const res = await ticketsApi.validarQR(qrCode, eventoId)
      const data = res.data
      setResultado(data)
      if (data.ya_usado) {
        setEstado('ya_usado')
        setContador((p) => ({ ...p, duplicados: p.duplicados + 1 }))
      } else {
        setEstado('ok')
        setContador((p) => ({ ...p, ok: p.ok + 1 }))
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'QR inválido o no reconocido.'
      setCamError(msg)
      setEstado('error')
    }
  }, [eventoId])

  useEffect(() => {
    if (estado !== 'escaneando') return
    let active = true
    const scanner = new Html5Qrcode(QR_REGION_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        onScanSuccess,
        () => {}
      )
      .catch(() => {
        if (!active) return
        setCamError('No se pudo acceder a la cámara. Verifica los permisos.')
        setEstado('error')
      })

    return () => { active = false }
  }, [estado, onScanSuccess])

  useEffect(() => () => { detenerScanner() }, [])

  const reiniciar = () => {
    setEstado('escaneando')
    setResultado(null)
    setCamError('')
  }

  const volver = () => {
    detenerScanner()
    navigate(`/staff/stand/${stand_id}/queue`)
  }

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-aura-nav border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={volver}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Volver
        </button>
        <h1 className="text-sm font-bold text-white">Validar Tickets</h1>
        <button
          onClick={logout}
          className="text-xs text-stone-500 hover:text-red-400 transition-colors"
        >
          Salir
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-sm mx-auto w-full">

        {/* Contador de sesión */}
        <div className="w-full flex gap-3 mb-6">
          <div className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 py-3 text-center">
            <p className="text-2xl font-bold text-green-400">{contador.ok}</p>
            <p className="text-xs text-green-600 mt-0.5">Validados</p>
          </div>
          <div className="flex-1 rounded-xl bg-yellow-500/10 border border-yellow-500/20 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{contador.duplicados}</p>
            <p className="text-xs text-yellow-600 mt-0.5">Duplicados</p>
          </div>
        </div>

        {/* ── IDLE ── */}
        {estado === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-10 w-full">
            <div className="h-20 w-20 rounded-2xl bg-aura-card border border-aura-border flex items-center justify-center">
              <QrCode size={40} strokeWidth={1} className="text-aura-muted" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Listo para escanear</p>
              <p className="text-sm text-stone-400 mt-1">
                Activa la cámara y apunta al QR del ticket del asistente.
              </p>
            </div>
            <button
              onClick={() => setEstado('escaneando')}
              disabled={!eventoId}
              className="w-full rounded-xl bg-aura-primary py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-all"
            >
              {eventoId ? 'Activar cámara' : 'Cargando evento…'}
            </button>
          </div>
        )}

        {/* ── ESCANEANDO ── */}
        {estado === 'escaneando' && (
          <div className="flex flex-col gap-4 w-full">
            <div
              id={QR_REGION_ID}
              className="rounded-2xl overflow-hidden border border-aura-border min-h-[280px] w-full"
            />
            <p className="text-xs text-stone-500 text-center animate-pulse">
              Apunta al código QR del ticket…
            </p>
            <button
              onClick={() => { detenerScanner(); setEstado('idle') }}
              className="rounded-xl border border-aura-border py-2.5 text-sm text-stone-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── PROCESANDO ── */}
        {estado === 'procesando' && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-10 w-10 rounded-full border-2 border-aura-primary border-t-transparent animate-spin" />
            <p className="text-sm text-stone-400 animate-pulse">Validando ticket…</p>
          </div>
        )}

        {/* ── OK: ticket válido y marcado como usado ── */}
        {estado === 'ok' && resultado && (
          <div className="flex flex-col items-center gap-5 py-6 w-full text-center">
            <div className="h-20 w-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle size={44} strokeWidth={1.5} className="text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">¡Acceso permitido!</p>
              <p className="text-lg font-semibold text-white mt-1">{resultado.nombre_asistente}</p>
              <span className="inline-block mt-2 rounded-full border border-white/15 px-3 py-0.5 text-xs text-stone-300">
                Ticket {resultado.tipo}
              </span>
            </div>
            <button
              onClick={reiniciar}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-aura-primary py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
              Siguiente ticket
            </button>
          </div>
        )}

        {/* ── YA USADO ── */}
        {estado === 'ya_usado' && resultado && (
          <div className="flex flex-col items-center gap-5 py-6 w-full text-center">
            <div className="h-20 w-20 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
              <AlertTriangle size={44} strokeWidth={1.5} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-400">Ticket ya usado</p>
              <p className="text-lg font-semibold text-white mt-1">{resultado.nombre_asistente}</p>
              {resultado.fecha_uso && (
                <p className="text-xs text-stone-500 mt-1">
                  Usado el {new Date(resultado.fecha_uso).toLocaleString('es-MX', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <button
              onClick={reiniciar}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/20 transition-all"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
              Escanear otro
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {estado === 'error' && (
          <div className="flex flex-col items-center gap-5 py-6 w-full text-center">
            <div className="h-20 w-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <XCircle size={44} strokeWidth={1.5} className="text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">QR inválido</p>
              <p className="text-sm text-stone-400 mt-1">{camError}</p>
            </div>
            <button
              onClick={reiniciar}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-all"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

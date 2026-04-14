import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import * as standsApi from '../api/standsApi'
import * as interaccionesApi from '../api/interaccionesApi'
import { Camera, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

const QR_REGION_ID = 'aurae-qr-reader'

export default function ScanQR() {
  const { evento_id }     = useParams()
  const { user }          = useAuth()
  const navigate          = useNavigate()

  const [estado, setEstado]         = useState('idle')   // idle | escaneando | procesando | exito | error
  const [mensaje, setMensaje]       = useState('')
  const [standNombre, setStandNombre] = useState('')
  const [camError, setCamError]     = useState('')
  const scannerRef                  = useRef(null)

  // ───── Iniciar cámara ─────
  const iniciarScanner = async () => {
    setEstado('escaneando')
    setCamError('')
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {} // silenciar errores de frame
      )
    } catch (err) {
      setCamError('No se pudo acceder a la cámara. Verifica los permisos.')
      setEstado('error')
    }
  }

  // ───── Detener cámara ─────
  const detenerScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      scannerRef.current = null
    }
  }

  // ───── Resultado del escaneo ─────
  const onScanSuccess = async (decodedText) => {
    await detenerScanner()
    setEstado('procesando')

    try {
      // 1. Buscar stand por stand_id (QR nuevo) o beacon_uuid (legacy)
      const standsRes = await standsApi.porEvento(evento_id)
      const stands    = standsRes.data ?? []
      const stand     = stands.find(
        (s) => s.id === decodedText || s.beacon_uuid === decodedText
      )

      if (!stand) {
        setMensaje('QR no corresponde a ningún stand de este evento.')
        setEstado('error')
        return
      }

      setStandNombre(stand.nombre)

      // 2. Registrar interacción (sin duración real — fallback de BLE)
      const ahora = new Date().toISOString()
      await interaccionesApi.handshake({
        usuario_id:      user.id,
        evento_id,
        stand_id:        stand.id,
        tipo:            'stand_visit',
        timestamp_inicio: ahora,
        timestamp_fin:   ahora,
        duracion_seg:    0,
        // Nota: validada=false porque duracion_seg < 30; no otorga puntos Aura
      })

      setEstado('exito')
    } catch (err) {
      setMensaje(err.response?.data?.detail || 'Error al registrar el check-in')
      setEstado('error')
    }
  }

  // Limpiar al desmontar
  useEffect(() => {
    return () => { detenerScanner() }
  }, [])

  const reiniciar = () => {
    setEstado('idle')
    setMensaje('')
    setStandNombre('')
    setCamError('')
  }

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-sm">

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Escanear QR de Stand</h1>
        <p className="text-sm text-gray-400 mb-6">
          Fallback BLE — escanea el código QR físico del stand para registrar tu visita
        </p>

        {/* ── IDLE ── */}
        {estado === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-10">
            <Camera size={56} strokeWidth={1} className="text-aura-muted" />
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Activa la cámara para escanear el QR del stand. Asegúrate de tener permisos de cámara habilitados.
            </p>
            <button
              onClick={iniciarScanner}
              className="rounded-lg bg-aura-primary px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-all duration-200"
            >
              Activar cámara
            </button>
          </div>
        )}

        {/* ── ESCANEANDO ── */}
        {estado === 'escaneando' && (
          <div className="flex flex-col gap-4">
            <div
              id={QR_REGION_ID}
              className="rounded-xl overflow-hidden border border-aura-border"
            />
            <p className="text-xs text-gray-500 text-center animate-pulse">
              Apunta al código QR del stand…
            </p>
            <button
              onClick={() => { detenerScanner(); setEstado('idle') }}
              className="rounded-lg border border-aura-border py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── PROCESANDO ── */}
        {estado === 'procesando' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-400 animate-pulse">Registrando check-in…</p>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {estado === 'exito' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={36} strokeWidth={1.5} className="text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">¡Check-in registrado!</p>
              <p className="text-sm text-gray-400 mt-1">
                en <span className="text-white font-medium">{standNombre}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Nota: las visitas por QR no suman puntos Aura (requieren BLE activo)
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={reiniciar}
                className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Escanear otro
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg bg-aura-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {estado === 'error' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle size={36} strokeWidth={1.5} className="text-red-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">No se pudo registrar</p>
              <p className="text-sm text-red-400 mt-1">{camError || mensaje}</p>
            </div>
            <button
              onClick={reiniciar}
              className="rounded-lg bg-aura-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ID del elemento necesario aunque no sea la pantalla de escaneo */}
        {estado !== 'escaneando' && (
          <div id={QR_REGION_ID} className="hidden" />
        )}
      </div>
    </div>
  )
}

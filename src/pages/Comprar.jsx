import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as eventosApi from '../api/eventosApi'
import * as ordenesApi from '../api/ordenesApi'
import * as ticketsApi from '../api/ticketsApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Ticket, Star, Zap, CheckCircle } from 'lucide-react'

// TODO: Integrar Stripe Checkout con webhook de confirmación de pago

const TIPOS = [
  { key: 'general',    label: 'General',    precio: 150, desc: 'Acceso estándar al evento',            Icon: Ticket },
  { key: 'vip',        label: 'VIP',        precio: 400, desc: 'Acceso VIP + beneficios exclusivos',   Icon: Star   },
  { key: 'early_bird', label: 'Early Bird', precio: 80,  desc: 'Precio especial para los más rápidos', Icon: Zap    },
]

export default function Comprar() {
  const { evento_id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [tipo, setTipo] = useState('general')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    eventosApi.obtener(evento_id)
      .then((res) => setEvento(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Evento no encontrado'))
      .finally(() => setLoading(false))
  }, [evento_id])

  const sel = TIPOS.find((t) => t.key === tipo)

  const handleConfirmar = async () => {
    setProcesando(true); setError(null)
    try {
      const ordenRes = await ordenesApi.crear({
        usuario_id: user.id, evento_id: Number(evento_id),
        tipo_ticket: tipo, cantidad: 1, total: sel.precio, metodo_pago: 'simulado',
      })
      await ticketsApi.crear({ usuario_id: user.id, evento_id: Number(evento_id), orden_id: ordenRes.data.id, tipo })
      navigate('/mis-tickets', { state: { mensaje: '¡Ticket comprado exitosamente!' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la compra')
    } finally { setProcesando(false) }
  }

  if (loading) return <div className="page"><LoadingSpinner center /></div>

  return (
    <div className="page">
      <div className="mx-auto max-w-sm space-y-5">

        <div>
          <h1 className="page-title">Comprar Ticket</h1>
          {evento && <p className="page-subtitle">{evento.nombre}</p>}
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Ticket type selector */}
        <div className="card p-5 space-y-3 animate-fade-in">
          <p className="text-sm font-bold text-aura-ink">Tipo de entrada</p>
          <div className="space-y-2">
            {TIPOS.map((t) => (
              <label
                key={t.key}
                className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                  tipo === t.key
                    ? 'border-aura-primary bg-aura-primary/6 shadow-glow-sm'
                    : 'border-aura-border bg-white hover:border-aura-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio" name="tipo" value={t.key}
                    checked={tipo === t.key} onChange={() => setTipo(t.key)}
                    className="accent-aura-primary w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <t.Icon size={14} strokeWidth={1.5} className="text-aura-muted" />
                      <span className="text-sm font-bold text-aura-ink">{t.label}</span>
                    </div>
                    <p className="text-xs text-aura-muted mt-0.5">{t.desc}</p>
                  </div>
                </div>
                <span className={`text-sm font-extrabold tabular-nums ${tipo === t.key ? 'text-aura-primary' : 'text-aura-muted'}`}>
                  ${t.precio}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="card p-5 space-y-4 animate-fade-in">
          <p className="text-sm font-bold text-aura-ink">Resumen</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-aura-muted">
              <span>1 × {sel?.label}</span>
              <span className="tabular-nums">${sel?.precio} MXN</span>
            </div>
            <div className="h-px bg-aura-border" />
            <div className="flex justify-between font-extrabold text-aura-ink">
              <span>Total</span>
              <span className="text-aura-primary tabular-nums">${sel?.precio} MXN</span>
            </div>
          </div>

          <button onClick={handleConfirmar} disabled={procesando} className="btn-primary w-full py-3">
            {procesando
              ? <><LoadingSpinner size="sm" /> Procesando…</>
              : (
                <>
                  <CheckCircle size={16} strokeWidth={1.5} />
                  Confirmar y Pagar
                </>
              )}
          </button>
          <p className="text-center text-[10px] text-aura-faint">Pago simulado · Stripe próximamente</p>
        </div>
      </div>
    </div>
  )
}

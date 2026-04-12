import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import * as eventosApi from '../api/eventosApi'
import * as ordenesApi from '../api/ordenesApi'
import * as ticketsApi from '../api/ticketsApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Ticket, Star, Zap, ArrowLeft, CreditCard } from 'lucide-react'

const TIPOS = [
  { key: 'general',    label: 'General',    precio: 150, desc: 'Acceso estándar al evento',            Icon: Ticket },
  { key: 'vip',        label: 'VIP',        precio: 400, desc: 'Acceso VIP + beneficios exclusivos',   Icon: Star   },
  { key: 'early_bird', label: 'Early Bird', precio: 80,  desc: 'Precio especial para los más rápidos', Icon: Zap    },
]

// Stripe se inicializa una vez fuera del componente
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

// ─────────────────────────────────────────────────────────────
// Paso 1: Selección de ticket
// ─────────────────────────────────────────────────────────────
function PasoSeleccion({ evento, tipo, setTipo, onContinuar, procesando, error }) {
  const sel = TIPOS.find((t) => t.key === tipo)

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3 animate-fade-in">
        <p className="text-sm font-bold text-aura-ink">Tipo de entrada</p>
        <div className="space-y-2">
          {TIPOS.map((t) => (
            <label
              key={t.key}
              className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                tipo === t.key
                  ? 'border-aura-primary bg-aura-primary/10 shadow-glow-sm'
                  : 'border-aura-border bg-aura-surface hover:border-aura-primary/50'
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

        {error && <ErrorMessage message={error} />}

        <button
          onClick={onContinuar}
          disabled={procesando}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {procesando
            ? <><LoadingSpinner size="sm" /> Preparando pago…</>
            : <><CreditCard size={16} strokeWidth={1.5} /> Continuar con el pago</>
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Paso 2: Stripe Payment Element
// ─────────────────────────────────────────────────────────────
function PasoStripe({ clientSecret, monto, moneda, onExito, onVolver }) {
  const stripeRef   = useRef(null)
  const elementsRef = useRef(null)
  const mountedRef  = useRef(false)
  const [cargando, setCargando]   = useState(true)
  const [pagando, setPagando]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!clientSecret || mountedRef.current) return

    let isMounted = true

    const init = async () => {
      const stripe = await stripePromise
      if (!stripe || !isMounted) return

      stripeRef.current = stripe
      const elements = stripe.elements({ clientSecret, appearance: { theme: 'night' } })
      elementsRef.current = elements

      const paymentEl = elements.create('payment')
      paymentEl.mount('#stripe-payment-element')
      paymentEl.on('ready', () => { if (isMounted) setCargando(false) })
      mountedRef.current = true
    }

    init()
    return () => { isMounted = false }
  }, [clientSecret])

  const handlePagar = async (e) => {
    e.preventDefault()
    if (!stripeRef.current || !elementsRef.current) return
    setPagando(true)
    setError(null)

    const { error: stripeError } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: {
        return_url: `${window.location.origin}/mis-tickets?pago=exitoso`,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setPagando(false)
    } else {
      // Pago confirmado sin redirección (p.ej. tarjeta sin 3DS)
      onExito()
    }
  }

  return (
    <div className="card p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-aura-ink">Datos de pago</p>
        <span className="text-sm font-extrabold text-aura-primary tabular-nums">
          ${monto} {moneda?.toUpperCase()}
        </span>
      </div>

      <form onSubmit={handlePagar} className="space-y-4">
        {cargando && (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        )}
        <div id="stripe-payment-element" className={cargando ? 'hidden' : ''} />

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={cargando || pagando}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pagando
            ? <><LoadingSpinner size="sm" /> Procesando…</>
            : <><CreditCard size={16} strokeWidth={1.5} /> Pagar ${monto} MXN</>
          }
        </button>
      </form>

      <button
        onClick={onVolver}
        className="w-full flex items-center justify-center gap-1 text-xs text-aura-muted hover:text-aura-ink transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={2} /> Cambiar tipo de ticket
      </button>

      <p className="text-center text-[10px] text-aura-faint">
        Pago procesado de forma segura por Stripe · No almacenamos datos de tarjeta
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function Comprar() {
  const { evento_id } = useParams()
  const { user }      = useAuth()
  const navigate      = useNavigate()

  const [evento, setEvento]   = useState(null)
  const [tipo, setTipo]       = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [paso, setPaso]       = useState(1)   // 1: selección, 2: stripe

  // Datos del PaymentIntent una vez creado
  const [clientSecret, setClientSecret] = useState(null)
  const [monto, setMonto]     = useState(null)
  const [moneda, setMoneda]   = useState('mxn')
  const [procesando, setProcesando] = useState(false)

  // IDs para crear el ticket al confirmar
  const ordenIdRef = useRef(null)

  useEffect(() => {
    eventosApi.obtener(evento_id)
      .then((res) => setEvento(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Evento no encontrado'))
      .finally(() => setLoading(false))
  }, [evento_id])

  const sel = TIPOS.find((t) => t.key === tipo)

  // Si Stripe no está configurado, usar flujo simulado
  const handleContinuar = async () => {
    setProcesando(true); setError(null)

    if (!stripePromise) {
      // Flujo sin Stripe (fallback de desarrollo)
      try {
        const ordenRes = await ordenesApi.crear({
          evento_id, tipo_ticket: tipo, cantidad: 1,
          monto_total: sel.precio, moneda: 'mxn',
        })
        await ticketsApi.crear({ evento_id, orden_id: ordenRes.data.id, tipo })
        navigate('/mis-tickets', { state: { mensaje: '¡Ticket comprado exitosamente!' } })
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al procesar la compra')
      } finally {
        setProcesando(false)
      }
      return
    }

    // Flujo Stripe: crear orden → PaymentIntent
    try {
      const ordenRes = await ordenesApi.crear({
        evento_id, tipo_ticket: tipo, cantidad: 1,
        monto_total: sel.precio, moneda: 'mxn',
      })
      ordenIdRef.current = ordenRes.data.id

      const pagoRes = await ordenesApi.iniciarPago(ordenRes.data.id)
      setClientSecret(pagoRes.data.client_secret)
      setMonto(pagoRes.data.monto_total)
      setMoneda(pagoRes.data.moneda)
      setPaso(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar el pago')
    } finally {
      setProcesando(false)
    }
  }

  const handleExitoStripe = async () => {
    // El webhook actualizará la orden; aquí solo creamos el ticket y redirigimos
    try {
      if (ordenIdRef.current) {
        await ticketsApi.crear({ evento_id, orden_id: ordenIdRef.current, tipo })
      }
    } catch {
      // Si falla la creación del ticket, el webhook lo reintentará
    }
    navigate('/mis-tickets', { state: { mensaje: '¡Pago confirmado! Tu ticket está listo.' } })
  }

  if (loading) return <div className="page"><LoadingSpinner center /></div>

  return (
    <div className="page">
      <div className="mx-auto max-w-sm space-y-5">
        <div>
          <h1 className="page-title">Comprar Ticket</h1>
          {evento && <p className="page-subtitle">{evento.nombre}</p>}
        </div>

        {paso === 1 && (
          <PasoSeleccion
            evento={evento}
            tipo={tipo}
            setTipo={setTipo}
            onContinuar={handleContinuar}
            procesando={procesando}
            error={error}
          />
        )}

        {paso === 2 && clientSecret && (
          <PasoStripe
            clientSecret={clientSecret}
            monto={monto}
            moneda={moneda}
            onExito={handleExitoStripe}
            onVolver={() => setPaso(1)}
          />
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import * as eventosApi from '../api/eventosApi'
import * as ordenesApi from '../api/ordenesApi'
import * as ticketsApi from '../api/ticketsApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Ticket, ChevronLeft, CreditCard, CheckCircle2, DollarSign } from 'lucide-react'

const SERVICE_FEE = 0.10 // 10% tarifa de plataforma

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

// ─────────────────────────────────────────────────────────────
// Paso 1: Resumen del ticket
// ─────────────────────────────────────────────────────────────
function PasoResumen({ evento, onContinuar, procesando, error }) {
  const precioBase  = evento.precio ?? 0
  const tarifa      = +(precioBase * SERVICE_FEE).toFixed(2)
  const total       = +(precioBase + tarifa).toFixed(2)

  return (
    <div className="space-y-4">
      {/* Resumen del evento */}
      <div className="card p-5 space-y-4 animate-fade-in">
        {evento.imagen_url && (
          <div className="h-32 w-full overflow-hidden rounded-xl">
            <img src={evento.imagen_url} alt={evento.nombre} className="h-full w-full object-cover" />
          </div>
        )}
        <div>
          <p className="font-bold text-aura-ink leading-snug">{evento.nombre}</p>
          {evento.ubicacion?.nombre && (
            <p className="text-xs text-aura-muted mt-0.5">{evento.ubicacion.nombre}</p>
          )}
        </div>

        <div className="rounded-xl border border-aura-border bg-aura-surface p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-aura-muted">
            <div className="flex items-center gap-2">
              <Ticket size={14} strokeWidth={1.5} className="text-aura-primary" />
              <span>Entrada general × 1</span>
            </div>
            <span className="tabular-nums">${precioBase.toFixed(2)} MXN</span>
          </div>
          <div className="flex items-center justify-between text-aura-muted">
            <span>Tarifa de servicio (10%)</span>
            <span className="tabular-nums">${tarifa.toFixed(2)} MXN</span>
          </div>
          <div className="h-px bg-aura-border" />
          <div className="flex items-center justify-between font-extrabold text-aura-ink">
            <span>Total</span>
            <span className="text-aura-primary tabular-nums">${total.toFixed(2)} MXN</span>
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

      <p className="text-center text-[10px] text-aura-faint">
        Pago procesado de forma segura por Stripe · No almacenamos datos de tarjeta
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Paso 2: Stripe Payment Element
// ─────────────────────────────────────────────────────────────
function PasoStripe({ clientSecret, total, onExito, onVolver }) {
  const stripeRef   = useRef(null)
  const elementsRef = useRef(null)
  const mountedRef  = useRef(false)
  const [cargando, setCargando] = useState(true)
  const [pagando,  setPagando]  = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!clientSecret || mountedRef.current) return
    let alive = true

    const init = async () => {
      const stripe = await stripePromise
      if (!stripe || !alive) return
      stripeRef.current  = stripe
      const elements = stripe.elements({ clientSecret, appearance: { theme: 'night' } })
      elementsRef.current = elements
      const paymentEl = elements.create('payment')
      paymentEl.mount('#stripe-payment-element')
      paymentEl.on('ready', () => { if (alive) setCargando(false) })
      mountedRef.current = true
    }

    init()
    return () => { alive = false }
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
      onExito()
    }
  }

  return (
    <div className="card p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-aura-ink">Datos de pago</p>
        <span className="text-sm font-extrabold text-aura-primary tabular-nums">
          ${total.toFixed(2)} MXN
        </span>
      </div>

      <form onSubmit={handlePagar} className="space-y-4">
        {cargando && <div className="flex justify-center py-6"><LoadingSpinner /></div>}
        <div id="stripe-payment-element" className={cargando ? 'hidden' : ''} />
        {error && <ErrorMessage message={error} />}
        <button
          type="submit"
          disabled={cargando || pagando}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pagando
            ? <><LoadingSpinner size="sm" /> Procesando…</>
            : <><CreditCard size={16} strokeWidth={1.5} /> Pagar ${total.toFixed(2)} MXN</>
          }
        </button>
      </form>

      <button
        onClick={onVolver}
        className="w-full flex items-center justify-center gap-1 text-xs text-aura-muted hover:text-aura-ink transition-colors"
      >
        <ChevronLeft size={12} strokeWidth={2} /> Volver al resumen
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Paso 3: Confirmación
// ─────────────────────────────────────────────────────────────
function PasoConfirmacion({ eventoId }) {
  return (
    <div className="card p-8 flex flex-col items-center gap-4 text-center animate-fade-in">
      <CheckCircle2 size={48} strokeWidth={1.5} className="text-emerald-400" />
      <div>
        <p className="font-bold text-aura-ink text-lg">¡Pago confirmado!</p>
        <p className="text-sm text-aura-muted mt-1">Tu ticket está listo en Mis Tickets</p>
      </div>
      <div className="flex gap-3 mt-2">
        <Link to="/mis-tickets" className="btn-primary px-5 py-2.5 text-sm">Ver mis tickets</Link>
        <Link to={`/eventos/${eventoId}`} className="btn-secondary px-5 py-2.5 text-sm">Ver evento</Link>
      </div>
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

  const [evento,    setEvento]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [paso,      setPaso]      = useState(1)   // 1 resumen | 2 stripe | 3 ok
  const [procesando, setProcesando] = useState(false)

  const clientSecretRef = useRef(null)
  const ordenIdRef      = useRef(null)
  const totalRef        = useRef(0)

  useEffect(() => {
    eventosApi.obtener(evento_id)
      .then((res) => setEvento(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Evento no encontrado'))
      .finally(() => setLoading(false))
  }, [evento_id])

  // Redirigir si el usuario es el organizador
  useEffect(() => {
    if (evento && user && String(user.id) === String(evento.organizador_id)) {
      navigate(`/eventos/${evento_id}`, { replace: true })
    }
  }, [evento, user, evento_id, navigate])

  const handleContinuar = async () => {
    setProcesando(true)
    setError(null)

    const precioBase = evento.precio ?? 0
    const total      = +(precioBase * (1 + SERVICE_FEE)).toFixed(2)
    totalRef.current = total

    // Evento gratuito — crear ticket sin Stripe
    if (evento.es_gratuito || precioBase === 0) {
      try {
        const ordenRes = await ordenesApi.crear({
          usuario_id:  user?.id ?? '',
          evento_id,
          monto_total: 0,
          moneda:      'MXN',
          items: [{ tipo: 'general', precio_unitario: 0, cantidad: 1 }],
        })
        const ticketRes = await ticketsApi.crear({
          usuario_id: user?.id ?? '',
          evento_id,
          orden_id: ordenRes.data.id,
          tipo:     'general',
          precio:   0,
        })
        navigate(`/mis-tickets?nuevo=${ticketRes.data.id}`, { replace: true })
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al registrar el ticket')
      } finally {
        setProcesando(false)
      }
      return
    }

    // Evento de pago — flujo Stripe
    if (!stripePromise) {
      setError('La pasarela de pago no está configurada.')
      setProcesando(false)
      return
    }

    try {
      const ordenRes = await ordenesApi.crear({
        usuario_id:  user?.id ?? '',
        evento_id,
        monto_total: total,
        moneda:      'MXN',
        items: [{ tipo: 'general', precio_unitario: precioBase, cantidad: 1 }],
      })
      ordenIdRef.current = ordenRes.data.id

      const pagoRes = await ordenesApi.iniciarPago(ordenRes.data.id)
      clientSecretRef.current = pagoRes.data.client_secret
      totalRef.current        = pagoRes.data.monto_total
      setPaso(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar el pago')
    } finally {
      setProcesando(false)
    }
  }

  const handleExitoStripe = async () => {
    try {
      const ticketRes = await ticketsApi.crear({
        usuario_id: user?.id ?? '',
        evento_id,
        orden_id: ordenIdRef.current,
        tipo:     'general',
        precio:   evento?.precio ?? 0,
      })
      navigate(`/mis-tickets?nuevo=${ticketRes.data.id}`, { replace: true })
    } catch {
      // Si falla la creación de ticket, redirigir igual
      navigate('/mis-tickets', { replace: true })
    }
  }

  if (loading) return <div className="page"><LoadingSpinner center /></div>
  if (error && !evento) return <div className="page"><div className="mx-auto max-w-sm"><ErrorMessage message={error} /></div></div>

  return (
    <div className="page">
      <div className="mx-auto max-w-sm space-y-4">

        <div className="flex items-center gap-2">
          <Link
            to={`/eventos/${evento_id}`}
            className="inline-flex items-center gap-1 text-sm text-aura-muted hover:text-aura-ink transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Volver
          </Link>
        </div>

        <div>
          <h1 className="page-title">Comprar Ticket</h1>
        </div>

        {paso === 1 && evento && (
          <PasoResumen
            evento={evento}
            onContinuar={handleContinuar}
            procesando={procesando}
            error={error}
          />
        )}

        {paso === 2 && clientSecretRef.current && (
          <PasoStripe
            clientSecret={clientSecretRef.current}
            total={totalRef.current}
            onExito={handleExitoStripe}
            onVolver={() => setPaso(1)}
          />
        )}

        {paso === 3 && (
          <div className="card p-8 flex flex-col items-center gap-3 text-center animate-fade-in">
            <LoadingSpinner />
            <p className="text-sm text-aura-muted">Redirigiendo a tus tickets…</p>
          </div>
        )}

      </div>
    </div>
  )
}

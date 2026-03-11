import { useState } from 'react'
import { Star, X, PartyPopper } from 'lucide-react'

export default function FeedbackModal({ stand, onSubmit, onClose }) {
  const [rating, setRating]     = useState(0)
  const [hovered, setHovered]   = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito]       = useState(false)
  const [puntosFly, setPuntosFly] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setEnviando(true)
    try {
      // TODO: el backend no tiene campo calificacion aún.
      // PATCH /stands/:id debería aceptar { calificacion: rating, comentario }
      await new Promise((r) => setTimeout(r, 600))
      setPuntosFly(true)
      setTimeout(() => {
        setExito(true)
        if (onSubmit) onSubmit({ rating, comentario })
      }, 900)
    } finally {
      setEnviando(false)
    }
  }

  const nombreStand = stand?.nombre ?? 'este stand'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-aura-border bg-aura-card p-6 shadow-2xl">

        {/* Puntos flotantes */}
        {puntosFly && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="animate-bounce font-bold text-amber-400 drop-shadow-lg flex items-center gap-1 text-2xl">
              +5 <Star size={20} strokeWidth={1.5} fill="currentColor" />
            </span>
          </div>
        )}

        {exito ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <PartyPopper size={48} strokeWidth={1.5} className="text-aura-secondary" />
            <p className="text-lg font-semibold text-aura-ink">¡Gracias por tu opinión!</p>
            <p className="text-sm text-aura-muted">Ganaste +5 puntos de Aura</p>
            <button
              onClick={onClose}
              className="mt-2 btn-primary px-6 py-2.5 text-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-aura-ink">¿Qué te pareció?</h2>
                <p className="text-xs text-aura-muted mt-0.5">{nombreStand}</p>
              </div>
              <button
                onClick={onClose}
                className="text-aura-faint hover:text-aura-muted transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Estrellas */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hovered || rating)
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform duration-100 hover:scale-110 focus:outline-none"
                    aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={28}
                      strokeWidth={1.5}
                      fill={filled ? '#F88903' : 'transparent'}
                      className={filled ? 'text-amber-400' : 'text-aura-border'}
                    />
                  </button>
                )
              })}
            </div>

            {/* Textarea */}
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos más (opcional)"
              rows={3}
              className="input resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 btn-ghost py-2.5 text-sm"
              >
                Ahora no
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || enviando}
                className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando…' : 'Enviar +5 Aura'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { MapPin, Users, Ticket, ChevronRight, Lock, DollarSign } from 'lucide-react'

const SERVICE_FEE = 0.10 // 10% tarifa de plataforma

const CATEGORY_STYLES = {
  tecnologia:      'bg-blue-500/20 text-blue-300',
  musica:          'bg-pink-500/20 text-pink-300',
  arte:            'bg-purple-500/20 text-purple-300',
  gaming:          'bg-green-500/20 text-green-300',
  negocios:        'bg-yellow-500/20 text-yellow-300',
  gastronomia:     'bg-orange-500/20 text-orange-300',
  deportes:        'bg-red-500/20 text-red-300',
  networking:      'bg-cyan-500/20 text-cyan-300',
  innovacion:      'bg-indigo-500/20 text-indigo-300',
  sustentabilidad: 'bg-emerald-500/20 text-emerald-300',
}

function getEventStatus(fechaInicio, fechaFin) {
  if (!fechaInicio) return null
  const now   = new Date()
  const start = new Date(fechaInicio)
  const end   = fechaFin ? new Date(fechaFin) : null

  if (end && now > end)  return { label: 'Finalizado', cls: 'bg-white/10 text-aura-muted' }
  if (now >= start && (!end || now <= end)) return { label: 'En curso', cls: 'bg-emerald-500/20 text-emerald-300' }

  const diffMs   = start - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return { label: 'Hoy',            cls: 'bg-aura-primary/10 text-aura-primary font-semibold' }
  if (diffDays === 1) return { label: 'Mañana',         cls: 'bg-aura-primary/10 text-aura-primary' }
  if (diffDays <= 7)  return { label: `En ${diffDays} días`, cls: 'bg-amber-500/20 text-amber-300' }
  return null
}

function DateBadge({ fechaInicio }) {
  if (!fechaInicio) return null
  const d = new Date(fechaInicio)
  const day = d.toLocaleDateString('es-MX', { day: '2-digit' })
  const mon = d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-aura-border bg-aura-surface w-11 h-12 flex-shrink-0 shadow-sm">
      <span className="text-[10px] font-bold text-aura-primary leading-none">{mon}</span>
      <span className="text-lg font-extrabold text-aura-ink leading-tight tabular-nums">{day}</span>
    </div>
  )
}

export default function EventoCard({ evento }) {
  const categorias = evento.categorias ?? []
  const status     = getEventStatus(evento.fecha_inicio, evento.fecha_fin)
  const isPast     = status?.label === 'Finalizado'
  const ubicTxt    = evento.ubicacion
    ? (evento.ubicacion.nombre || evento.ubicacion.direccion)
    : null

  return (
    <Link
      to={`/eventos/${evento.id}`}
      className={`card-hover group flex flex-col gap-0 overflow-hidden animate-fade-in ${isPast ? 'opacity-60' : ''}`}
    >
      {/* Cover image or accent bar */}
      {evento.imagen_url
        ? (
          <div className="h-32 w-full overflow-hidden">
            <img src={evento.imagen_url} alt={evento.nombre} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )
        : <div className="h-1 w-full bg-aura-user opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
      }

      <div className="p-4 flex flex-col gap-3">
        {/* Header row: date badge + title + arrow */}
        <div className="flex items-start gap-3">
          <DateBadge fechaInicio={evento.fecha_inicio} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-aura-ink leading-snug line-clamp-2 group-hover:text-aura-primary transition-colors duration-200 text-sm">
                {evento.nombre}
              </h3>
              <ChevronRight size={15} strokeWidth={2} className="text-aura-faint group-hover:text-aura-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-0.5" />
            </div>

            {status && (
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${status.cls}`}>
                {status.label}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {evento.descripcion && (
          <p className="text-xs text-aura-muted line-clamp-2 leading-relaxed">
            {evento.descripcion}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1">
          {ubicTxt && (
            <div className="flex items-center gap-1.5 text-xs text-aura-muted">
              <MapPin size={11} strokeWidth={1.5} className="text-aura-primary flex-shrink-0" />
              <span className="truncate">{ubicTxt}</span>
            </div>
          )}
          {evento.capacidad_max > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-aura-muted">
              <Users size={11} strokeWidth={1.5} className="text-aura-primary flex-shrink-0" />
              <span>{evento.capacidad_max} lugares</span>
            </div>
          )}
        </div>

        {/* Categories + CTA */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap gap-1">
            {categorias.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                  CATEGORY_STYLES[cat] ?? 'bg-white/10 text-aura-muted'
                }`}
              >
                {cat}
              </span>
            ))}
            {categorias.length > 2 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] bg-white/10 text-aura-muted">
                +{categorias.length - 2}
              </span>
            )}
            {evento.tiene_password && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] bg-white/10 text-aura-muted">
                <Lock size={9} strokeWidth={2} /> Código
              </span>
            )}
          </div>

          {!isPast && (
            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold flex-shrink-0 transition-all duration-200" style={{ background: 'linear-gradient(135deg, rgba(255,92,92,0.15), color-mix(in srgb, var(--user-aura, #9B5DE5) 30%, transparent))', color: 'var(--user-aura, #FF5C5C)' }}>
              {!evento.es_gratuito && evento.precio > 0
                ? <><DollarSign size={9} strokeWidth={2} />${(evento.precio * (1 + SERVICE_FEE)).toFixed(0)}</>
                : <><Ticket size={10} strokeWidth={2} />Gratis</>}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

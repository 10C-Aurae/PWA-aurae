import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Clock, MessageSquare } from 'lucide-react'

function formatHora(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  } catch { return null }
}

export default function StandCard({ stand, onUnirCola, colaJoin = {}, colaError = {}, rating }) {
  const navigate = useNavigate()
  const uuid = stand.beacon_uuid ?? ''
  const uuidShort = uuid.length > 12 ? `${uuid.slice(0, 8)}…${uuid.slice(-4)}` : uuid

  const serviciosActivos = (stand.servicios ?? []).filter((s) => s.activo)
  const multiServicio    = serviciosActivos.length > 1

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Cover image */}
      {stand.imagen_url && (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={stand.imagen_url}
            alt={stand.nombre}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
          {/* Gradient overlay so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Stand name on top of image */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
            <h3 className="font-bold text-white leading-snug drop-shadow">{stand.nombre}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {rating != null && (
                <span className="inline-flex items-center gap-0.5 text-amber-300 text-xs font-semibold drop-shadow">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {Number(rating).toFixed(1)}
                </span>
              )}
              <span className={`badge text-[10px] ${stand.is_active ? 'badge-green' : 'badge-gray'}`}>
                {stand.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header (only when no image) */}
        {!stand.imagen_url && (
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-aura-ink leading-snug">{stand.nombre}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {rating != null && (
                <span className="inline-flex items-center gap-0.5 text-amber-400 text-xs font-semibold">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {Number(rating).toFixed(1)}
                </span>
              )}
              <span className={`badge text-[10px] ${stand.is_active ? 'badge-green' : 'badge-gray'}`}>
                {stand.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        )}

        {stand.descripcion && (
          <p className="text-xs text-aura-muted leading-relaxed">{stand.descripcion}</p>
        )}

        {(stand.categoria || uuid) && (
          <div className="space-y-0.5">
            {stand.categoria && (
              <p className="text-xs text-aura-muted capitalize">
                <span className="text-aura-faint">Categoría · </span>{stand.categoria}
              </p>
            )}
            {uuid && (
              <p className="font-mono text-[10px] text-aura-faint">BLE: {uuidShort}</p>
            )}
          </div>
        )}

        {/* Cola virtual */}
        {stand.tiene_cola && onUnirCola && stand.is_active && (
          <div className="pt-1 space-y-2">
            {serviciosActivos.length === 0 ? (
              <BotonesUnirse
                standId={stand.id}
                servicioId={null}
                label="Unirse a la cola"
                joinState={colaJoin[stand.id]}
                error={colaError[stand.id]}
                onUnirCola={onUnirCola}
              />
            ) : multiServicio ? (
              serviciosActivos.map((svc) => (
                <BotonesUnirse
                  key={svc.id}
                  standId={stand.id}
                  servicioId={svc.id}
                  label={svc.nombre}
                  duracion={svc.duracion_min}
                  joinState={colaJoin[`${stand.id}__${svc.id}`]}
                  error={colaError[`${stand.id}__${svc.id}`]}
                  onUnirCola={onUnirCola}
                />
              ))
            ) : (
              <BotonesUnirse
                standId={stand.id}
                servicioId={serviciosActivos[0].id}
                label={serviciosActivos[0].nombre}
                duracion={serviciosActivos[0].duracion_min}
                joinState={colaJoin[`${stand.id}__${serviciosActivos[0].id}`]}
                error={colaError[`${stand.id}__${serviciosActivos[0].id}`]}
                onUnirCola={onUnirCola}
              />
            )}
          </div>
        )}

        {/* Chat de pedidos — siempre visible si el stand está activo */}
        {stand.is_active && (
          <button
            onClick={() => navigate(`/stands/${stand.id}/chat`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-aura-border py-2 text-xs font-medium text-gray-400 hover:text-white hover:border-aura-primary/50 transition-all"
          >
            <MessageSquare size={13} strokeWidth={1.5} />
            Preguntas y pedidos al stand
          </button>
        )}
      </div>
    </div>
  )
}

function BotonesUnirse({ standId, servicioId, label, duracion, joinState, error, onUnirCola }) {
  const joined  = joinState?.status === 'joined'
  const loading = joinState?.status === 'loading'
  const hora    = joinState?.hora_estimada ? formatHora(joinState.hora_estimada) : null

  return (
    <div>
      <button
        onClick={() => onUnirCola(standId, servicioId)}
        disabled={joined || loading}
        className={`w-full rounded-xl py-2 px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-2 ${
          joined
            ? 'border border-emerald-300/40 bg-emerald-500/10 text-emerald-400 cursor-default'
            : loading
              ? 'btn-primary opacity-60 cursor-wait'
              : 'btn-primary'
        }`}
      >
        <span>{joined ? `✓ En cola · ${label}` : loading ? 'Uniéndose…' : label}</span>
        {duracion && !joined && (
          <span className="flex items-center gap-0.5 opacity-70 text-[10px] font-normal">
            <Clock size={10} strokeWidth={2} />
            ~{duracion} min
          </span>
        )}
        {joined && hora && (
          <span className="text-[10px] font-normal opacity-80">aprox. {hora}</span>
        )}
      </button>
      {error && <p className="text-[10px] text-red-400 text-center mt-1">{error}</p>}
    </div>
  )
}

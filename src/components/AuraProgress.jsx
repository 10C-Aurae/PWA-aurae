import { getAuraInfo, getPorcentajeNivel } from '../utils/auraColors'

/**
 * darkMode — set true when rendered inside a dark card (aura hero sections)
 */
export default function AuraProgress({ puntos = 0, intereses = [], darkMode = false }) {
  const { current, siguiente } = getAuraInfo(puntos, intereses)
  const porcentaje = getPorcentajeNivel(puntos)

  const textMuted   = darkMode ? 'text-stone-400' : 'text-aura-muted'
  const textFaint   = darkMode ? 'text-stone-600' : 'text-aura-faint'
  const trackColor  = darkMode ? 'bg-white/10'    : 'bg-aura-border'

  return (
    <div className="w-full space-y-2">
      {/* Labels */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${textMuted}`}>
          {siguiente
            ? `${(siguiente.min - puntos).toLocaleString()} pts para ${siguiente.nombre}`
            : '✦ Nivel máximo'}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: current.color }}
        >
          {porcentaje}%
        </span>
      </div>

      {/* Track */}
      <div className={`relative h-2 w-full overflow-hidden rounded-full ${trackColor}`}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${porcentaje}%`,
            background: `linear-gradient(to right, ${current.color}BB, ${current.color})`,
            boxShadow: `0 0 8px ${current.color}80`,
          }}
        />
        {porcentaje > 5 && porcentaje < 95 && (
          <div
            className="absolute top-0 h-full w-12 animate-shimmer rounded-full"
            style={{
              left: `${Math.max(0, porcentaje - 10)}%`,
              background: `linear-gradient(to right, transparent, ${current.color}55, transparent)`,
            }}
          />
        )}
      </div>

      {/* Min / Max */}
      <div className="flex justify-between">
        <span className={`text-[10px] tabular-nums ${textFaint}`}>{puntos.toLocaleString()} pts</span>
        {siguiente && (
          <span className={`text-[10px] tabular-nums ${textFaint}`}>{siguiente.min.toLocaleString()} pts</span>
        )}
      </div>
    </div>
  )
}

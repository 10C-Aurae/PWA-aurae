import { getAuraInfo } from '../utils/auraColors'

const SIZES = {
  sm: { wrap: 'w-8 h-8', text: 'text-[9px]', pts: false, ring: 2 },
  md: { wrap: 'w-16 h-16', text: 'text-xs', pts: false, ring: 2 },
  lg: { wrap: 'w-24 h-24', text: 'text-sm', pts: false, ring: 3 },
  xl: { wrap: 'w-40 h-40', text: 'text-base', pts: true, ring: 3 },
}

/**
 * darkMode prop — when true, uses dark card background behind the badge.
 * avatarUrl prop — when provided on size lg/xl, shows the photo inside the ring.
 */
export default function AuraBadge({ puntos = 0, intereses = [], size = 'md', pulso = false, darkMode = false, avatarUrl = null, inline = false }) {
  const { current } = getAuraInfo(puntos, intereses)
  const cfg = SIZES[size] || SIZES.md
  const showPhoto = avatarUrl && (size === 'lg' || size === 'xl')

  return (
    <div className={`flex items-center ${inline ? 'flex-row gap-2' : 'flex-col gap-1.5'}`}>
      <div
        className={`
          ${cfg.wrap} relative rounded-full flex flex-col items-center justify-center
          ${pulso ? 'animate-glow-pulse' : ''}
          ${size === 'xl' ? 'animate-float' : ''}
          transition-all duration-300 overflow-hidden
        `}
        style={{
          backgroundColor: showPhoto ? 'transparent' : current.color + '1A',
          border: `${cfg.ring}px solid ${current.color}`,
          boxShadow: `${current.glow}, inset 0 0 20px ${current.color}0A`,
        }}
      >
        {showPhoto ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
          />
        ) : size === 'sm' ? (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: current.color, boxShadow: current.glow }}
          />
        ) : (
          <>
            <span
              className={`${cfg.text} font-bold leading-tight tracking-wide`}
              style={{ color: current.color }}
            >
              {current.nombre}
            </span>
            {cfg.pts && (
              <span
                className="text-xs mt-0.5 tabular-nums"
                style={{ color: current.color + 'CC' }}
              >
                {puntos.toLocaleString()} pts
              </span>
            )}
          </>
        )}

        {/* Outer glow halo — xl only */}
        {size === 'xl' && (
          <div
            className="absolute inset-[-8px] rounded-full opacity-15 blur-lg pointer-events-none"
            style={{ backgroundColor: current.color }}
          />
        )}
      </div>

      {/* Label below for sm */}
      {size === 'sm' && (
        <span className="text-[9px] font-semibold leading-none text-aura-muted">
          {current.nombre}
        </span>
      )}
    </div>
  )
}

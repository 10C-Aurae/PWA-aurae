import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../utils/formatDate'
import QRDisplay from './QRDisplay'

const STATUS_MAP = {
  activo:    { label: 'Activo',    cls: 'badge-green' },
  usado:     { label: 'Usado',     cls: 'badge-gray' },
  cancelado: { label: 'Cancelado', cls: 'badge-red' },
  expirado:  { label: 'Expirado',  cls: 'badge-yellow' },
}

const TIPO_MAP = {
  general:    { label: 'General',    cls: 'bg-blue-100 text-blue-700' },
  vip:        { label: 'VIP',        cls: 'bg-purple-100 text-purple-700' },
  early_bird: { label: 'Early Bird', cls: 'bg-amber-100 text-amber-700' },
}

export default function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false)

  const status = STATUS_MAP[ticket.status_uso] ?? STATUS_MAP.activo
  const tipo   = TIPO_MAP[ticket.tipo]         ?? { label: ticket.tipo ?? 'General', cls: 'bg-stone-100 text-stone-600' }
  const isActive = ticket.status_uso === 'activo'

  return (
    <div className={`card overflow-hidden animate-fade-in ${isActive ? 'border-aura-primary/30' : ''}`}>
      {/* Accent top bar for active tickets */}
      {isActive && (
        <div className="h-0.5 w-full bg-aura-gradient" />
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/eventos/${ticket.evento_id}`}
              className="font-semibold text-aura-ink leading-snug line-clamp-1 hover:text-aura-primary transition-colors duration-150"
            >
              {ticket.evento_nombre ?? `Ticket #${String(ticket.id).slice(-6)}`}
            </Link>
            {ticket.fecha_uso && (
              <p className="text-xs text-aura-muted mt-0.5">
                Usado el {formatDateTime(ticket.fecha_uso)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`badge text-[10px] ${tipo.cls}`}>{tipo.label}</span>
            <span className={`badge text-[10px] ${status.cls}`}>{status.label}</span>
          </div>
        </div>

        {/* QR toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1.5 text-xs font-semibold text-aura-primary hover:text-aura-primary-dark transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showQR
              ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            } />
          </svg>
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>

        {showQR && (
          <div className="border-t border-aura-border pt-3 animate-fade-in">
            <QRDisplay qrCode={ticket.qr_code} />
          </div>
        )}
      </div>
    </div>
  )
}

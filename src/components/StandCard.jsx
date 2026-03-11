export default function StandCard({ stand, onUnirCola, colaJoined }) {
  const uuid = stand.beacon_uuid ?? ''
  const uuidShort = uuid.length > 12 ? `${uuid.slice(0, 8)}…${uuid.slice(-4)}` : uuid

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-aura-ink leading-snug">{stand.nombre}</h3>
        <span className={`badge text-[10px] ${
          stand.activo ? 'badge-green' : 'badge-gray'
        }`}>
          {stand.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {(stand.categoria || uuid) && (
        <div className="space-y-1">
          {stand.categoria && (
            <p className="text-xs text-aura-muted capitalize">
              <span className="text-aura-faint">Categoría · </span>
              {stand.categoria}
            </p>
          )}
          {uuid && (
            <p className="font-mono text-[10px] text-aura-faint">
              BLE: {uuidShort}
            </p>
          )}
        </div>
      )}

      {onUnirCola && (
        <button
          onClick={() => onUnirCola(stand.id)}
          disabled={colaJoined || !stand.activo}
          className={`w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
            colaJoined
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default'
              : stand.activo
                ? 'btn-primary'
                : 'border border-aura-border bg-stone-50 text-aura-faint cursor-not-allowed opacity-50'
          }`}
        >
          {colaJoined ? '✓ En cola' : 'Unirse a la cola'}
        </button>
      )}
    </div>
  )
}

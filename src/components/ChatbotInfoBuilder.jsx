/**
 * ChatbotInfoBuilder — constructor dinámico de la info del chatbot del evento.
 *
 * El organizador activa tópicos predefinidos o agrega temas personalizados.
 * Serializa todo a una cadena de texto que el backend pasa a Gemini.
 */
import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

// ── Tópicos predefinidos ───────────────────────────────────────────────────────
const TOPICOS_DEFAULT = [
  { id: 'horario',        emoji: '🕐', label: 'Horario',             placeholder: 'Ej. El evento inicia a las 10:00 AM y termina a las 8:00 PM. El registro abre a las 9:00 AM.' },
  { id: 'banos',          emoji: '🚻', label: 'Baños',               placeholder: 'Ej. Están en el ala norte del Pabellón A y B, y en el nivel 2 del área principal.' },
  { id: 'accesibilidad',  emoji: '♿', label: 'Accesibilidad',        placeholder: 'Ej. Hay rampas para sillas de ruedas y sanitarios adaptados en todos los pabellones.' },
  { id: 'estacionamiento',emoji: '🅿️', label: 'Estacionamiento',     placeholder: 'Ej. Disponible en niveles -1 y -2. Costo $50/hora, se acepta tarjeta.' },
  { id: 'speakers',       emoji: '🎤', label: 'Ponentes / Speakers',  placeholder: 'Ej.\n• Dr. Juan López — 10:30 AM, Auditorio Principal\n• Lic. María García — 2:00 PM, Sala B' },
  { id: 'staff',          emoji: '👕', label: 'Staff y voluntarios',  placeholder: 'Ej. Identificados con camiseta azul con el logo de Aurae. Están en todos los accesos.' },
  { id: 'comida',         emoji: '🍴', label: 'Comida y bebida',      placeholder: 'Ej. Food trucks en la explanada exterior. Opciones veganas disponibles.' },
  { id: 'transporte',     emoji: '🚌', label: 'Cómo llegar',         placeholder: 'Ej. Metro línea 3, estación Expo. Shuttle gratuito cada 30 min desde el metro.' },
  { id: 'wifi',           emoji: '📶', label: 'WiFi',                 placeholder: 'Ej. Red: Aurae_Evento | Contraseña: aurae2025' },
  { id: 'reglas',         emoji: '📋', label: 'Reglas del evento',    placeholder: 'Ej. No se permiten mascotas ni alimentos externos. Prohibido fumar en interiores.' },
]

// ── Serialización ─────────────────────────────────────────────────────────────
function serialize(items) {
  return items
    .filter((it) => it.value.trim())
    .map((it) => `[${it.label.toUpperCase()}]\n${it.value.trim()}`)
    .join('\n\n')
}

function deserialize(str) {
  if (!str?.trim()) return []
  const blocks = str.split(/\n\n(?=\[)/)
  return blocks.map((block, i) => {
    const match = block.match(/^\[([^\]]+)\]\n?([\s\S]*)/)
    if (match) {
      const label = match[1]
      const value = match[2].trim()
      const preset = TOPICOS_DEFAULT.find(
        (t) => t.label.toUpperCase() === label || t.id.toUpperCase() === label
      )
      return {
        id:          preset?.id    ?? `custom_${i}`,
        emoji:       preset?.emoji ?? '📝',
        label:       preset ? preset.label : label.charAt(0) + label.slice(1).toLowerCase(),
        placeholder: preset?.placeholder ?? '',
        value,
        custom:      !preset,
      }
    }
    return { id: `raw_${i}`, emoji: '📝', label: 'Información general', placeholder: '', value: block.trim(), custom: true }
  })
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function ChatbotInfoBuilder({ value, onChange }) {
  const [items, setItems]       = useState(() => deserialize(value))
  const [expanded, setExpanded] = useState({})   // { id: bool }
  const [newLabel, setNewLabel] = useState('')
  const [showAdd, setShowAdd]   = useState(false)

  // Sync to parent whenever items change
  useEffect(() => {
    onChange(serialize(items))
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeIds = new Set(items.map((it) => it.id))

  const activatePreset = (topico) => {
    if (activeIds.has(topico.id)) return
    const newItem = { ...topico, value: '', custom: false }
    setItems((prev) => [...prev, newItem])
    setExpanded((prev) => ({ ...prev, [topico.id]: true }))
  }

  const addCustom = () => {
    const label = newLabel.trim()
    if (!label) return
    const id = `custom_${Date.now()}`
    setItems((prev) => [...prev, { id, emoji: '📝', label, placeholder: '', value: '', custom: true }])
    setExpanded((prev) => ({ ...prev, [id]: true }))
    setNewLabel('')
    setShowAdd(false)
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setExpanded((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  const updateValue = (id, val) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, value: val } : it)))

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  // Inactive presets (not yet added)
  const inactivePresets = TOPICOS_DEFAULT.filter((t) => !activeIds.has(t.id))

  return (
    <div className="space-y-3">

      {/* ── Active topic cards ──────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-aura-border bg-white shadow-card overflow-hidden"
            >
              {/* Card header */}
              <div
                className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-aura-surface transition-colors select-none"
                onClick={() => toggleExpand(item.id)}
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span className="flex-1 text-sm font-medium text-aura-ink">{item.label}</span>
                {item.value.trim() && (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                    Listo
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                  className="text-aura-faint hover:text-red-400 transition-colors ml-1"
                  aria-label="Eliminar"
                >
                  <X size={13} strokeWidth={2} />
                </button>
                {expanded[item.id]
                  ? <ChevronUp size={14} strokeWidth={1.5} className="text-aura-muted flex-shrink-0" />
                  : <ChevronDown size={14} strokeWidth={1.5} className="text-aura-muted flex-shrink-0" />}
              </div>

              {/* Textarea */}
              {expanded[item.id] && (
                <div className="px-4 pb-4">
                  <textarea
                    value={item.value}
                    onChange={(e) => updateValue(item.id, e.target.value)}
                    placeholder={item.placeholder}
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-aura-border bg-aura-surface px-3 py-2.5 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Preset picker ───────────────────────────────────────────────── */}
      {inactivePresets.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-aura-muted uppercase tracking-wider mb-2">
            Agregar información sobre…
          </p>
          <div className="flex flex-wrap gap-2">
            {inactivePresets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => activatePreset(t)}
                className="inline-flex items-center gap-1.5 rounded-full border border-aura-border bg-white px-3 py-1.5 text-xs text-aura-muted hover:border-aura-primary hover:text-aura-primary hover:bg-aura-primary/5 transition-all duration-150"
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom topic ─────────────────────────────────────────────────── */}
      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-aura-border px-3 py-1.5 text-xs text-aura-muted hover:border-aura-primary hover:text-aura-primary transition-all duration-150"
        >
          <Plus size={12} strokeWidth={2} />
          Otro tema personalizado
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            placeholder="Nombre del tema (ej. Guardarropa)"
            autoFocus
            className="flex-1 rounded-xl border border-aura-border bg-white px-3 py-2 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors shadow-card"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!newLabel.trim()}
            className="rounded-xl bg-aura-primary px-3 py-2 text-sm text-white hover:bg-aura-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => { setShowAdd(false); setNewLabel('') }}
            className="text-aura-muted hover:text-aura-ink transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Preview counter */}
      {items.filter((it) => it.value.trim()).length > 0 && (
        <p className="text-[11px] text-aura-muted">
          {items.filter((it) => it.value.trim()).length} tema(s) configurado(s) — el chatbot podrá responder sobre ellos
        </p>
      )}
    </div>
  )
}

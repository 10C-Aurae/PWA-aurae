import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as eventosApi from '../api/eventosApi'
import EventoCard from '../components/EventoCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDateTime } from '../utils/formatDate'
import {
  Search, CalendarX, MapPin, Users, Ticket, X, SlidersHorizontal,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────
const CATEGORIAS = [
  'tecnologia', 'musica', 'arte', 'gaming', 'negocios',
  'gastronomia', 'deportes', 'networking', 'innovacion', 'sustentabilidad',
]

const TIME_TABS = [
  { key: 'proximos', label: 'Próximos' },
  { key: 'todos',    label: 'Todos'    },
  { key: 'pasados',  label: 'Pasados'  },
]

// ─── Hero card for the featured upcoming event ─────────────────
function HeroEvento({ evento }) {
  return (
    <Link
      to={`/eventos/${evento.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-aura-border bg-aura-card shadow-card hover:shadow-card-md hover:border-aura-border-dark transition-all duration-200 animate-fade-in"
    >
      {/* Gradient accent top */}
      <div className="h-1.5 w-full bg-aura-user" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <span className="inline-block rounded-full bg-aura-primary/10 px-3 py-1 text-xs font-semibold text-aura-primary mb-3">
              Próximo evento
            </span>

            <h2 className="text-xl sm:text-2xl font-extrabold text-aura-ink leading-tight group-hover:text-aura-primary transition-colors duration-200">
              {evento.nombre}
            </h2>

            {evento.descripcion && (
              <p className="mt-2 text-sm text-aura-muted leading-relaxed line-clamp-2 max-w-xl">
                {evento.descripcion}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {evento.fecha_inicio && (
                <span className="flex items-center gap-1.5 text-sm text-aura-muted">
                  <MapPin size={13} strokeWidth={1.5} className="text-aura-primary" />
                  {evento.ubicacion?.nombre || evento.ubicacion?.direccion || 'Ver detalles'}
                </span>
              )}
              {evento.fecha_inicio && (
                <span className="flex items-center gap-1.5 text-sm text-aura-muted">
                  <Users size={13} strokeWidth={1.5} className="text-aura-primary" />
                  {formatDateTime(evento.fecha_inicio)}
                </span>
              )}
              {evento.capacidad && (
                <span className="flex items-center gap-1.5 text-sm text-aura-muted">
                  <Users size={13} strokeWidth={1.5} className="text-aura-primary" />
                  {evento.capacidad} lugares
                </span>
              )}
            </div>

            {(evento.categorias ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {evento.categorias.map((cat) => (
                  <span key={cat} className="rounded-full bg-aura-surface border border-aura-border px-2.5 py-0.5 text-[11px] font-medium text-aura-muted capitalize">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex sm:flex-col gap-2 sm:gap-2 sm:items-end sm:justify-between sm:min-w-[140px]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-aura-user px-5 py-2.5 text-sm font-semibold text-white shadow-glow-sm group-hover:scale-[1.03] transition-all duration-200 self-start">
              <Ticket size={14} strokeWidth={1.5} />
              Comprar ticket
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main feed ─────────────────────────────────────────────────
export default function Eventos() {
  const [todos, setTodos]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [query,       setQuery]       = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')
  const [catFiltro,   setCatFiltro]   = useState(null)     // null = all
  const [timeTab,     setTimeTab]     = useState('proximos')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch once — filter client-side
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventosApi.listar(0, 100)
      setTodos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [query])

  // ── Filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date()

    return todos.filter((ev) => {
      // active only
      if (ev.is_active === false) return false

      // time tab
      const start = ev.fecha_inicio ? new Date(ev.fecha_inicio) : null
      const end   = ev.fecha_fin    ? new Date(ev.fecha_fin)    : null

      if (timeTab === 'proximos') {
        if (!start) return false
        const isPast = end ? now > end : (start && now > start)
        if (isPast) return false
      } else if (timeTab === 'pasados') {
        if (!start) return false
        const isPast = end ? now > end : now > start
        if (!isPast) return false
      }

      // category
      if (catFiltro && !(ev.categorias ?? []).includes(catFiltro)) return false

      // search
      if (debouncedQ) {
        const inName = (ev.nombre ?? '').toLowerCase().includes(debouncedQ)
        const inDesc = (ev.descripcion ?? '').toLowerCase().includes(debouncedQ)
        const inLoc  = (ev.ubicacion?.nombre ?? ev.ubicacion?.direccion ?? '').toLowerCase().includes(debouncedQ)
        if (!inName && !inDesc && !inLoc) return false
      }

      return true
    })
  }, [todos, timeTab, catFiltro, debouncedQ])

  // Hero = first upcoming active event (only shown in "Próximos" with no active filter)
  const showHero = timeTab === 'proximos' && !catFiltro && !debouncedQ
  const hero     = showHero ? filtered[0] : null
  const rest     = showHero ? filtered.slice(1) : filtered

  // Active filter count for badge
  const activeFilters = (catFiltro ? 1 : 0) + (debouncedQ ? 1 : 0)

  return (
    <div className="page">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Explorar eventos</h1>
            <p className="page-subtitle">Encuentra tu próxima experiencia</p>
          </div>
          {!loading && todos.length > 0 && (
            <span className="text-xs text-aura-muted tabular-nums hidden sm:block">
              {filtered.length} de {todos.filter(e => e.activo !== false).length} eventos
            </span>
          )}
        </div>

        {/* ── Search + filter toggle ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-faint pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, descripción o lugar…"
              className="w-full rounded-xl border border-aura-border bg-white pl-9 pr-9 py-2.5 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors shadow-card"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-faint hover:text-aura-ink transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 shadow-card ${
              showFilters || activeFilters > 0
                ? 'border-aura-primary bg-aura-primary text-white'
                : 'border-aura-border bg-white text-aura-muted hover:border-aura-primary hover:text-aura-primary'
            }`}
          >
            <SlidersHorizontal size={13} strokeWidth={2} />
            Filtros
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-aura-secondary text-[9px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* ── Filters panel ── */}
        {showFilters && (
          <div className="rounded-2xl border border-aura-border bg-white p-4 shadow-card space-y-3 animate-fade-in">

            {/* Time tabs */}
            <div>
              <p className="text-[10px] font-bold text-aura-muted uppercase tracking-wider mb-2">Cuándo</p>
              <div className="flex gap-1.5">
                {TIME_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTimeTab(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      timeTab === tab.key
                        ? 'bg-aura-primary text-white'
                        : 'border border-aura-border text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category chips */}
            <div>
              <p className="text-[10px] font-bold text-aura-muted uppercase tracking-wider mb-2">Categoría</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCatFiltro(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    !catFiltro
                      ? 'bg-aura-ink text-white'
                      : 'border border-aura-border text-aura-muted hover:border-aura-ink hover:text-aura-ink'
                  }`}
                >
                  Todas
                </button>
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFiltro(catFiltro === cat ? null : cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-200 ${
                      catFiltro === cat
                        ? 'bg-aura-primary text-white'
                        : 'border border-aura-border text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {(catFiltro || debouncedQ) && (
              <button
                onClick={() => { setCatFiltro(null); setQuery('') }}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* ── Time tabs (inline, always visible) ── */}
        {!showFilters && (
          <div className="flex gap-1.5">
            {TIME_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTimeTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  timeTab === tab.key
                    ? 'bg-aura-primary text-white shadow-glow-sm'
                    : 'border border-aura-border bg-white text-aura-muted hover:border-aura-primary hover:text-aura-primary shadow-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── States ── */}
        {loading && <LoadingSpinner center />}
        {error   && <ErrorMessage message={error} onRetry={fetchAll} />}

        {/* ── Hero ── */}
        {!loading && !error && hero && <HeroEvento evento={hero} />}

        {/* ── Grid ── */}
        {!loading && !error && rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {rest.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-aura-card border border-aura-border shadow-card">
              <CalendarX size={28} strokeWidth={1.5} className="text-aura-faint" />
            </div>
            <p className="font-bold text-aura-ink">
              {debouncedQ || catFiltro
                ? 'Sin resultados para tu búsqueda'
                : timeTab === 'proximos'
                  ? 'No hay eventos próximos'
                  : timeTab === 'pasados'
                    ? 'No hay eventos pasados'
                    : 'Sin eventos por ahora'}
            </p>
            <p className="mt-1 text-sm text-aura-muted max-w-xs">
              {debouncedQ || catFiltro
                ? 'Prueba con otros términos o limpia los filtros'
                : 'Vuelve pronto para descubrir nuevas experiencias'}
            </p>
            {(debouncedQ || catFiltro) && (
              <button
                onClick={() => { setCatFiltro(null); setQuery('') }}
                className="mt-4 text-sm font-medium text-aura-primary hover:text-aura-primary-dark transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

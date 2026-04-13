// ── Niveles y umbrales de puntos ─────────────────────────────────────
export const NIVELES = [
  { nivel: 1, min: 0,    nombre: 'Neutro',     color: '#FFFFFF' },
  { nivel: 2, min: 50,   nombre: 'Despertar',  color: null },
  { nivel: 3, min: 150,  nombre: 'Explorador', color: null },
  { nivel: 4, min: 400,  nombre: 'Influyente', color: null },
  { nivel: 5, min: 800,  nombre: 'Visionario', color: null },
  { nivel: 6, min: 1500, nombre: 'Legendario', color: null },
]

// ── Interés → matiz (hue 0-360) ──────────────────────────────────────
const INTERES_A_HUE = {
  tecnologia: 210, innovacion: 210, tech: 210, digital: 210,
  ciencia: 195, educacion: 195,
  gastronomia: 25, comida: 25, food: 25, culinaria: 25,
  networking: 142, negocios: 142, emprendimiento: 142, finanzas: 142,
  arte: 320, musica: 320, creatividad: 320, diseno: 320, diseño: 320,
  gaming: 270, juegos: 270, videojuegos: 270, esports: 270,
  sustentabilidad: 85, eco: 85, ambiente: 85, naturaleza: 85,
  deporte: 5, fitness: 5, salud: 5, actividad: 5,
  moda: 340, fashion: 340, belleza: 340,
}
const DEFAULT_HUE = 240

// Nivel → [saturación%, luminosidad%]
const NIVEL_A_SL = {
  1: [0,   100],
  2: [45,  78],
  3: [65,  62],
  4: [75,  50],
  5: [85,  55],
  6: [92,  48],
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)]
    .map((x) => Math.round(x * 255).toString(16).padStart(2, '0'))
    .join('')
}

function promedioHueCircular(hues) {
  if (!hues.length) return DEFAULT_HUE
  const sinSum = hues.reduce((s, h) => s + Math.sin((h * Math.PI) / 180), 0)
  const cosSum = hues.reduce((s, h) => s + Math.cos((h * Math.PI) / 180), 0)
  const avg = (Math.atan2(sinSum, cosSum) * 180) / Math.PI
  return ((avg % 360) + 360) % 360
}

/**
 * Calcula el color del aura combinando:
 * - Matiz: promedio de los intereses del usuario
 * - Saturación/Luminosidad: según el nivel de puntos
 *
 * Nivel 1 siempre es blanco (#FFFFFF).
 */
export function calcularColorAura(intereses = [], nivel = 1) {
  if (nivel <= 1) return '#FFFFFF'
  const hues = (intereses || [])
    .map((i) => INTERES_A_HUE[i.toLowerCase().trim()])
    .filter(Boolean)
  const hue = promedioHueCircular(hues)
  const [s, l] = NIVEL_A_SL[nivel] ?? [75, 50]
  return hslToHex(hue, s, l)
}

// ── Helpers de nivel ─────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function nivelGlow(color, nivel) {
  const radius = [20, 20, 20, 25, 30, 35][nivel - 1] ?? 20
  const alpha  = [0.5, 0.7, 0.8, 0.8, 0.9, 1.0][nivel - 1] ?? 0.7
  return `0 0 ${radius}px ${hexToRgba(color, alpha)}`
}

function enriquecer(base, intereses) {
  const color = calcularColorAura(intereses, base.nivel)
  return { ...base, color, glow: nivelGlow(color, base.nivel) }
}

export const getAuraInfo = (puntos, intereses = []) => {
  const sorted = [...NIVELES].sort((a, b) => b.min - a.min)
  const base = sorted.find((n) => puntos >= n.min) || NIVELES[0]
  const current = enriquecer(base, intereses)
  const currentIndex = NIVELES.findIndex((n) => n.nivel === base.nivel)
  const nextBase = NIVELES[currentIndex + 1] || null
  const siguiente = nextBase ? enriquecer(nextBase, intereses) : null
  return { current, siguiente }
}

export const getAuraColor = (nivel, intereses = []) => calcularColorAura(intereses, nivel)

/** Devuelve NIVELES con color y glow calculados según los intereses del usuario. */
export const getNivelesConColor = (intereses = []) =>
  NIVELES.map((n) => {
    const color = calcularColorAura(intereses, n.nivel)
    return { ...n, color, glow: nivelGlow(color, n.nivel) }
  })

export const getPorcentajeNivel = (puntos) => {
  const { current, siguiente } = getAuraInfo(puntos)
  if (!siguiente) return 100
  const rango = siguiente.min - current.min
  const progreso = puntos - current.min
  return Math.min(100, Math.floor((progreso / rango) * 100))
}

// ─────────────────────────────────────────────────────────────
// Sistema de Arquetipos
// iconName references a lucide-react component name
// ─────────────────────────────────────────────────────────────
export const ARQUETIPOS = [
  {
    id: 'techie',
    nombre: 'Explorador Tecnológico',
    categorias: ['tecnologia', 'innovacion'],
    iconName: 'FlaskConical',
  },
  {
    id: 'foodie',
    nombre: 'Maestro Gastronómico',
    categorias: ['gastronomia'],
    iconName: 'ChefHat',
  },
  {
    id: 'networker',
    nombre: 'Networking Master',
    categorias: ['negocios', 'networking'],
    iconName: 'Handshake',
  },
  {
    id: 'artista',
    nombre: 'Alma Creativa',
    categorias: ['arte', 'musica'],
    iconName: 'Palette',
  },
  {
    id: 'gamer',
    nombre: 'Espíritu Gamer',
    categorias: ['gaming'],
    iconName: 'Gamepad2',
  },
  {
    id: 'eco',
    nombre: 'Guardián Verde',
    categorias: ['sustentabilidad'],
    iconName: 'Leaf',
  },
]

/**
 * Infiere el arquetipo del usuario comparando su vector_intereses
 * con las categorías de cada arquetipo.
 * Retorna el arquetipo con más matches, o null si no hay intereses.
 */
export const inferirArquetipo = (vector_intereses = []) => {
  if (!vector_intereses || vector_intereses.length === 0) return null

  const interesesNorm = vector_intereses.map((i) => i.toLowerCase().trim())

  let mejorArquetipo = null
  let mejorScore = 0

  for (const arquetipo of ARQUETIPOS) {
    const score = arquetipo.categorias.filter((cat) =>
      interesesNorm.includes(cat.toLowerCase())
    ).length

    if (score > mejorScore) {
      mejorScore = score
      mejorArquetipo = arquetipo
    }
  }

  return mejorArquetipo
}

export const NIVELES = [
  { nivel: 1, min: 0,    color: '#FFFFFF', nombre: 'Neutro',      glow: '0 0 20px rgba(255,255,255,0.5)' },
  { nivel: 2, min: 50,   color: '#87CEEB', nombre: 'Despertar',   glow: '0 0 20px rgba(135,206,235,0.7)' },
  { nivel: 3, min: 150,  color: '#4169E1', nombre: 'Explorador',  glow: '0 0 20px rgba(65,105,225,0.8)'  },
  { nivel: 4, min: 400,  color: '#9B59B6', nombre: 'Influyente',  glow: '0 0 25px rgba(155,89,182,0.8)'  },
  { nivel: 5, min: 800,  color: '#F39C12', nombre: 'Visionario',  glow: '0 0 30px rgba(243,156,18,0.9)'  },
  { nivel: 6, min: 1500, color: '#E74C3C', nombre: 'Legendario',  glow: '0 0 35px rgba(231,76,60,1.0)'   },
]

export const getAuraInfo = (puntos) => {
  const sorted = [...NIVELES].sort((a, b) => b.min - a.min)
  const current = sorted.find((n) => puntos >= n.min) || NIVELES[0]
  const currentIndex = NIVELES.findIndex((n) => n.nivel === current.nivel)
  const siguiente = NIVELES[currentIndex + 1] || null
  return { current, siguiente }
}

export const getAuraColor = (nivel) => {
  const found = NIVELES.find((n) => n.nivel === nivel)
  return found ? found.color : '#FFFFFF'
}

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

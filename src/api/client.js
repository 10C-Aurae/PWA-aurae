import axios from 'axios'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token')
}

/** Decodifica el payload del JWT sin verificar firma (verificación real es del servidor). */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // token malformado → tratar como expirado
  }
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user') // limpieza defensiva de clave fantasma
}

// ── Axios instance ────────────────────────────────────────────────────────────

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000, // 15 s — evita requests colgados indefinidamente
})

// ── Request interceptor ───────────────────────────────────────────────────────

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    if (isTokenExpired(token)) {
      clearSession()
      window.location.replace('/login')
      return Promise.reject(new Error('Sesión expirada'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ──────────────────────────────────────────────────────

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      window.location.replace('/login')
    }
    return Promise.reject(error)
  }
)

export default client

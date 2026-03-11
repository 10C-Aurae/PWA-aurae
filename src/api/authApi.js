import client from './client'

export const login = (email, password) => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)
  return client.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// Usa /usuarios/me (devuelve UsuarioResponse completo con vector_intereses, avatar_url, etc.)
export const me = () => client.get('/usuarios/me')

export const registro = ({ nombre, email, password, intereses = [] }) =>
  client.post('/usuarios/', { nombre, email, password, vector_intereses: intereses })

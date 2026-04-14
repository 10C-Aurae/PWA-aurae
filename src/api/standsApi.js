import client from './client'

// Endpoint público — solo stands activos (para usuarios)
export const porEvento = (eid, skip = 0, limit = 50) =>
  client.get(`/stands/evento/${eid}`, { params: { skip, limit } })

// Endpoint admin — todos los stands, activos e inactivos (requiere JWT + organizador)
export const porEventoAdmin = (eid, skip = 0, limit = 100) =>
  client.get(`/stands/admin/evento/${eid}`, { params: { skip, limit } })

export const obtener = (id) => client.get(`/stands/${id}`)

export const crear = (data) => client.post('/stands/', data)

export const actualizar = (id, data) => client.patch(`/stands/${id}`, data)

export const eliminar = (id) => client.delete(`/stands/${id}`)

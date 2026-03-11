import client from './client'

export const listar = (skip = 0, limit = 20) =>
  client.get('/eventos/', { params: { skip, limit } })

export const obtener = (id) => client.get(`/eventos/${id}`)

export const crear = (data) => client.post('/eventos/', data)

export const actualizar = (id, data) => client.patch(`/eventos/${id}`, data)

export const eliminar = (id) => client.delete(`/eventos/${id}`)

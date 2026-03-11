import client from './client'

export const porEvento = (eid, skip = 0, limit = 50) =>
  client.get(`/stands/evento/${eid}`, { params: { skip, limit } })

export const obtener = (id) => client.get(`/stands/${id}`)

export const crear = (data) => client.post('/stands/', data)

export const actualizar = (id, data) => client.patch(`/stands/${id}`, data)

export const eliminar = (id) => client.delete(`/stands/${id}`)

import client from './client'

export const porUsuario = (uid, skip = 0, limit = 50) =>
  client.get(`/tickets/usuario/${uid}`, { params: { skip, limit } })

export const porEvento = (eid, skip = 0, limit = 50) =>
  client.get(`/tickets/evento/${eid}`, { params: { skip, limit } })

export const crear = (data) => client.post('/tickets/', data)

export const marcarUsado = (id) => client.post(`/tickets/${id}/usar`)

export const cancelar = (id) => client.post(`/tickets/${id}/cancelar`)

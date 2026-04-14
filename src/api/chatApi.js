import client from './client'

export const historial = (eventoId, limit = 50) =>
  client.get(`/chat/${eventoId}/historial`, { params: { limit } })

import client from './client'

export const recomendar = (eventoId) =>
  client.post('/aura-flow/recomendar', { evento_id: eventoId })

export const chat = (eventoId, pregunta) =>
  client.post('/aura-flow/chat', { evento_id: eventoId, pregunta })

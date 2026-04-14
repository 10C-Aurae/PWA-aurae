import client from './client'

export const historial = (standId, limit = 80) =>
  client.get(`/chat-stand/${standId}/mensajes`, { params: { limit } })

export const enviar = (standId, texto, paraUsuarioId = null) =>
  client.post(`/chat-stand/${standId}/mensajes`, {
    texto,
    para_usuario_id: paraUsuarioId,
  })

export const noLeidos = (standId) =>
  client.get(`/chat-stand/${standId}/no-leidos`)

export const marcarLeidos = (standId) =>
  client.post(`/chat-stand/${standId}/marcar-leidos`)

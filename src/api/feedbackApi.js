import client from './client'

/**
 * Envía la calificación de un stand tras una visita.
 * Payload: { stand_id, evento_id, calificacion (1-5), comentario?, interaccion_id? }
 */
export const crear = (data) =>
  client.post('/feedback/', data)

/** Estadísticas de feedback de un stand (promedio, distribución, últimos comentarios) */
export const resumenStand = (standId) =>
  client.get(`/feedback/stand/${standId}`)

/** Lista de feedbacks del usuario en un evento */
export const misFeedbacks = (eventoId) =>
  client.get(`/feedback/mis-feedbacks/${eventoId}`)

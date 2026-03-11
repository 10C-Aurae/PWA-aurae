import client from './client'

// TODO: endpoint pendiente en backend — /colas/
// Todos los endpoints de esta sección son placeholders para el Sprint 2.
// El backend deberá implementar el router /colas con soporte de WebSockets.

/** Obtiene todos los turnos activos del usuario autenticado */
// TODO: endpoint pendiente en backend — /colas/usuario/:uid
export const misТurnos = (uid) =>
  client.get(`/colas/usuario/${uid}`)

/** Obtiene la cola completa de un stand (para admin) */
// TODO: endpoint pendiente en backend — /colas/stand/:stand_id
export const porStand = (standId) =>
  client.get(`/colas/stand/${standId}`)

/** Obtiene las colas de todos los stands de un evento (para admin) */
// TODO: endpoint pendiente en backend — /colas/evento/:evento_id
export const porEvento = (eventoId) =>
  client.get(`/colas/evento/${eventoId}`)

/** Registra al usuario en la cola de un stand */
// TODO: endpoint pendiente en backend — POST /colas/unirse
export const unirse = (data) =>
  client.post('/colas/unirse', data)
// Payload esperado: { usuario_id, stand_id, evento_id }

/** Cancela el turno del usuario en un stand */
// TODO: endpoint pendiente en backend — DELETE /colas/:turno_id
export const cancelarTurno = (turnoId) =>
  client.delete(`/colas/${turnoId}`)

/** Admin: llama al siguiente usuario en cola de un stand (REGISTRADO → NOTIFICADO) */
// TODO: endpoint pendiente en backend — POST /colas/stand/:stand_id/llamar-siguiente
export const llamarSiguiente = (standId) =>
  client.post(`/colas/stand/${standId}/llamar-siguiente`)

/** Admin: marca un turno como ATENDIDO */
// TODO: endpoint pendiente en backend — POST /colas/:turno_id/atender
export const marcarAtendido = (turnoId) =>
  client.post(`/colas/${turnoId}/atender`)

/** Obtiene la posición actual del turno y espera estimada */
// TODO: endpoint pendiente en backend — GET /colas/:turno_id/posicion
export const posicion = (turnoId) =>
  client.get(`/colas/${turnoId}/posicion`)

// ─────────────────────────────────────────────────────────────
// ESTADOS DE TURNO (diagrama de estados)
//   REGISTRADO → EN_COLA → NOTIFICADO → ATENDIDO
//                                     → EXPIRADO
// ─────────────────────────────────────────────────────────────
export const ESTADO_COLA = {
  REGISTRADO: 'REGISTRADO',
  EN_COLA:    'EN_COLA',
  NOTIFICADO: 'NOTIFICADO',
  ATENDIDO:   'ATENDIDO',
  EXPIRADO:   'EXPIRADO',
}

import client from './client'

// ─────────────────────────────────────────────────────────────
// Estados del ciclo de vida de un turno (alineados con backend)
// ESPERANDO → ACTIVO (llamado) → ATENDIDO
//                              → CANCELADO
// ─────────────────────────────────────────────────────────────
export const ESTADO_COLA = {
  ESPERANDO: 'esperando',
  ACTIVO:    'activo',
  ATENDIDO:  'atendido',
  CANCELADO: 'cancelado',
}

/** Lista todos los turnos activos del usuario autenticado */
export const misTurnos = () =>
  client.get('/colas/mis-turnos')

/** Estado de la cola de un stand (para staff/admin) */
export const porStand = (standId) =>
  client.get(`/colas/stand/${standId}`)

/** El usuario se une a la cola de un stand */
export const unirse = (standId, eventoId) =>
  client.post('/colas/unirse', { stand_id: standId, evento_id: eventoId })

/** Cancela el turno del usuario */
export const cancelarTurno = (colaId) =>
  client.post(`/colas/${colaId}/cancelar`)

/** Staff: llama al siguiente usuario en la cola */
export const llamarSiguiente = (standId) =>
  client.post(`/colas/stand/${standId}/llamar`)

/** Staff: marca un turno como atendido */
export const marcarAtendido = (colaId, standId) =>
  client.post(`/colas/${colaId}/atendido`, null, { params: { stand_id: standId } })

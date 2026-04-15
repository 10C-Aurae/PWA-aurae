import client from './client'

export const listar    = ()         => client.get('/notificaciones/')
export const noLeidas  = ()         => client.get('/notificaciones/no-leidas')
export const marcarTodas = ()       => client.post('/notificaciones/marcar-leidas')
export const marcarUna   = (id)     => client.patch(`/notificaciones/${id}/leer`)

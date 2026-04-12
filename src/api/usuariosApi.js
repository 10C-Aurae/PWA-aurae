import client from './client'

export const bleToken    = ()        => client.get('/usuarios/me/ble-token')
export const rotarBle    = ()        => client.post('/usuarios/me/ble-token/rotar')
export const fcmToken    = (token)   => client.post('/usuarios/me/fcm-token', { fcm_token: token })
export const eliminar    = (id)      => client.delete(`/usuarios/${id}`)
export const obtener     = (id)      => client.get(`/usuarios/${id}`)

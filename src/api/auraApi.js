import client from './client'

export const obtener = (uid) => client.get(`/aura/${uid}`)

export const snapshot = (data) => client.post('/aura/snapshot', data)

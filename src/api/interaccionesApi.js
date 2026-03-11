import client from './client'

export const porUsuarioEvento = (uid, eid) =>
  client.get(`/interacciones/${uid}/${eid}`)

export const handshake = (data) => client.post('/interacciones/handshake', data)

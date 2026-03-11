import client from './client'

export const crear = (data) => client.post('/ordenes/', data)

export const obtener = (id) => client.get(`/ordenes/${id}`)

export const porUsuario = (uid) => client.get(`/ordenes/usuario/${uid}`)

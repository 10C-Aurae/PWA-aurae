import client from './client'

export const organizador = () => client.get('/metricas/organizador')

export const evento = (eventoId) => client.get(`/metricas/evento/${eventoId}`)

export const stand = (standId) => client.get(`/metricas/stand/${standId}`)

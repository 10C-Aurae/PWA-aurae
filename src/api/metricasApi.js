import client from './client'

export const evento = (eventoId) => client.get(`/metricas/evento/${eventoId}`)

export const stand = (standId) => client.get(`/metricas/stand/${standId}`)

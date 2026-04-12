import client from './client'

export const crear = (data) => client.post('/ordenes/', data)

export const obtener = (id) => client.get(`/ordenes/${id}`)

export const porUsuario = (uid) => client.get(`/ordenes/usuario/${uid}`)

/**
 * Crea un Stripe PaymentIntent para una orden pendiente.
 * Devuelve { orden_id, client_secret, stripe_pi_id, monto_total, moneda }
 */
export const iniciarPago = (ordenId) =>
  client.post(`/ordenes/${ordenId}/pagar`)

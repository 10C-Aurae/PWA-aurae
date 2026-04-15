import { useState, useEffect } from 'react'
import * as auraApi from '../api/auraApi'
import { getAuraInfo, getPorcentajeNivel } from '../utils/auraColors'

export const useAura = (uid) => {
  const [aura, setAura] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAura = async () => {
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      const res = await auraApi.obtener(uid)
      setAura(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el aura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAura()
  }, [uid])

  const generarSnapshot = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await auraApi.snapshot(data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar snapshot')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const info = aura ? getAuraInfo(aura.aura_puntos ?? 0, []) : null
  const porcentaje = aura ? getPorcentajeNivel(aura.aura_puntos ?? 0) : 0

  return { aura, loading, error, info, porcentaje, fetchAura, generarSnapshot }
}

import { useState, useEffect } from 'react'
import * as eventosApi from '../api/eventosApi'

export const useEventos = (skip = 0, limit = 20) => {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEventos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventosApi.listar(skip, limit)
      setEventos(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventos()
  }, [skip, limit])

  return { eventos, loading, error, refetch: fetchEventos }
}

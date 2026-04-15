import { createContext, useState, useEffect, useCallback } from 'react'
import * as authApi from '../api/authApi'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const rehidrate = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await authApi.me()
        setUser(res.data)
        setToken(storedToken)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    rehidrate()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    const meRes = await authApi.me()
    setUser(meRes.data)
    return meRes.data
  }, [])

  const logout = useCallback((currentUser) => {
    const isStaff = (currentUser ?? user)?.role === 'staff_stand'
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    window.location.href = isStaff ? '/staff/login' : '/login'
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

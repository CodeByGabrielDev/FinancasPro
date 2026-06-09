import { createContext, useContext, useState, useEffect } from 'react'
import { setAuthToken } from '../services/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fp_token'))
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('fp_user')) } catch { return null }
  })

  // restaura token no axios ao montar
  useEffect(() => {
    if (token) setAuthToken(token)
  }, [])

  function login(newToken, userData) {
    localStorage.setItem('fp_token', newToken)
    localStorage.setItem('fp_user',  JSON.stringify(userData))
    setAuthToken(newToken)
    setToken(newToken)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('fp_token')
    localStorage.removeItem('fp_user')
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

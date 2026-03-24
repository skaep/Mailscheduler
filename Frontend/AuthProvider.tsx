import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setToken(savedToken)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {  // <-- Prepend `/api`
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) return false
      const data = await res.json()
      if (data.token) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

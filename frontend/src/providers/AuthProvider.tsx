import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Token } from '@/types'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  full_name: string
  password: string
  role?: string
  preferred_language?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('stadiumos_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('stadiumos_token'),
  )
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!user && !!token

  // Persist auth state
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('stadiumos_token', token)
      localStorage.setItem('stadiumos_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('stadiumos_token')
      localStorage.removeItem('stadiumos_user')
    }
  }, [token, user])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await api.post<Token>('/auth/login', { email, password })
      setToken(data.access_token)
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const { data: res } = await api.post<Token>('/auth/register', {
        ...data,
        role: data.role ?? 'fan',
        preferred_language: data.preferred_language ?? 'en',
      })
      setToken(res.access_token)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: User) => {
    setUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

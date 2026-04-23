import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AuthState } from '../types'
import api from '../lib/api'

interface AuthCtx {
  auth: AuthState | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const t = localStorage.getItem('token')
    if (!t) return null
    return {
      token:    t,
      username: localStorage.getItem('username') ?? '',
      fullName: localStorage.getItem('fullName') ?? '',
      expiresAt: localStorage.getItem('expiresAt') ?? ''
    }
  })

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password })
    const s: AuthState = data
    localStorage.setItem('token',    s.token)
    localStorage.setItem('username', s.username)
    localStorage.setItem('fullName', s.fullName)
    localStorage.setItem('expiresAt', s.expiresAt)
    setAuth(s)
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setAuth(null)
  }, [])

  return <Ctx.Provider value={{ auth, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

import React, {
  createContext, useContext, useState, useEffect, useCallback
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthState } from '../types'
import api from '../lib/api'

interface AuthCtxType {
  auth: AuthState | null
  loading: boolean
  login: (memberId: string, name: string, token: string, baseLimit: number) => Promise<void>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthCtxType>(null!)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth]     = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const token     = await AsyncStorage.getItem('token')
        const memberId  = await AsyncStorage.getItem('memberId')
        const name      = await AsyncStorage.getItem('memberName')
        const baseLimit = await AsyncStorage.getItem('baseLimit')
        if (token && memberId && name) {
          setAuth({ token, memberId, name, baseLimit: Number(baseLimit ?? 0) })
        }
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (memberId: string, name: string, token: string, baseLimit: number) => {
    await AsyncStorage.multiSet([
      ['token',      token],
      ['memberId',   memberId],
      ['memberName', name],
      ['baseLimit',  String(baseLimit)],
    ])
    setAuth({ token, memberId, name, baseLimit })
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'memberId', 'memberName', 'baseLimit'])
    setAuth(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ auth, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

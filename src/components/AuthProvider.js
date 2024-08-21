'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getUserSession } from '@/lib/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserFromSession() {
      const session = await getUserSession()
      if (session) {
        setUser(session.user)
      }
      setLoading(false)
    }
    loadUserFromSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
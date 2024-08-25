'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getUserSession, checkUserCompletion, supabase } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const [token, setToken] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUserFromSession() {
      const session = await getUserSession()
      if (session) {
        setUser(session.user)
        setToken(session.access_token)
        const isComplete = await checkUserCompletion(session.user.id)
        setIsProfileComplete(isComplete)
        if (!isComplete && !window.location.pathname.startsWith('/onboarding')) {
          router.push('/onboarding/begin')
        }
      } else {
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    }
    loadUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user)
        setToken(session.access_token)
        const isComplete = await checkUserCompletion(session.user.id)
        setIsProfileComplete(isComplete)
        if (!isComplete) {
          router.push('/onboarding/begin')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setToken(null)
        setIsProfileComplete(true)
      }
    })

    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe()
      }
    }
  }, [router])

  const getToken = async () => {
    if (token) return token

    const session = await getUserSession()
    if (session) {
      setToken(session.access_token)
      return session.access_token
    }

    return null
  }

  const refreshToken = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing token:', error)
      return null
    }
    if (data.session) {
      setToken(data.session.access_token)
      return data.session.access_token
    }
    return null
  }

  const value = {
    user,
    setUser,
    loading,
    isProfileComplete,
    setIsProfileComplete,
    getToken,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
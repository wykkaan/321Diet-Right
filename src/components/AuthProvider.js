'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { getUserSession, checkUserCompletion, supabase } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isProfileComplete: true,
    loading: true
  })
  const router = useRouter()

  const loadUserFromSession = useCallback(async () => {
    const session = await getUserSession()
    if (session) {
      const isComplete = await checkUserCompletion(session.user.id)
      setAuthState({
        user: session.user,
        token: session.access_token,
        isProfileComplete: isComplete,
        loading: false
      })
      if (!isComplete && !window.location.pathname.startsWith('/onboarding')) {
        router.push('/onboarding/begin')
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isProfileComplete: true,
        loading: false
      })
    }
  }, [router])

  useEffect(() => {
    loadUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const isComplete = await checkUserCompletion(session.user.id)
        setAuthState({
          user: session.user,
          token: session.access_token,
          isProfileComplete: isComplete,
          loading: false
        })
        if (!isComplete) {
          router.push('/onboarding/begin')
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          token: null,
          isProfileComplete: true,
          loading: false
        })
      }
    })

    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe()
      }
    }
  }, [router, loadUserFromSession])

  const getToken = useCallback(async () => {
    if (authState.token) return authState.token

    const session = await getUserSession()
    if (session) {
      setAuthState(prev => ({ ...prev, token: session.access_token }))
      return session.access_token
    }

    return null
  }, [authState.token])

  const refreshToken = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing token:', error)
      return null
    }
    if (data.session) {
      setAuthState(prev => ({ ...prev, token: data.session.access_token }))
      return data.session.access_token
    }
    return null
  }, [])

  const setUser = useCallback((user) => {
    setAuthState(prev => ({ ...prev, user }))
  }, [])

  const setIsProfileComplete = useCallback((isComplete) => {
    setAuthState(prev => ({ ...prev, isProfileComplete: isComplete }))
  }, [])

  const value = useMemo(() => ({
    user: authState.user,
    setUser,
    loading: authState.loading,
    isProfileComplete: authState.isProfileComplete,
    setIsProfileComplete,
    getToken,
    refreshToken
  }), [authState, setUser, setIsProfileComplete, getToken, refreshToken])

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
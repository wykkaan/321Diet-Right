// components/AuthProvider.js
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
    isAdmin: false,
    loading: true
  })
  const router = useRouter()

  const checkAdminStatus = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false;
    }
  }, [])

  const loadUserFromSession = useCallback(async () => {
    const session = await getUserSession()
    if (session) {
      const isComplete = await checkUserCompletion(session.user.id)
      const isAdmin = await checkAdminStatus(session.user.id)
      setAuthState({
        user: session.user,
        token: session.access_token,
        isProfileComplete: isComplete,
        isAdmin: isAdmin,
        loading: false
      })
      if (!isComplete && !window.location.pathname.startsWith('/onboarding')) {
        router.push('/onboarding/begin')
      } else if (isAdmin && !window.location.pathname.startsWith('/admin')) {
        router.push('/admin/dashboard')
      } else if (!isAdmin && window.location.pathname.startsWith('/admin')) {
        router.push('/dashboard')
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isProfileComplete: true,
        isAdmin: false,
        loading: false
      })
      if (!window.location.pathname.startsWith('/login')) {
        router.push('/login')
      }
    }
  }, [router, checkAdminStatus])

  useEffect(() => {
    loadUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const isComplete = await checkUserCompletion(session.user.id)
        const isAdmin = await checkAdminStatus(session.user.id)
        setAuthState({
          user: session.user,
          token: session.access_token,
          isProfileComplete: isComplete,
          isAdmin: isAdmin,
          loading: false
        })
        if (!isComplete) {
          router.push('/onboarding/begin')
        } else if (isAdmin) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          token: null,
          isProfileComplete: true,
          isAdmin: false,
          loading: false
        })
        router.push('/login')
      }
    })

    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe()
      }
    }
  }, [router, loadUserFromSession, checkAdminStatus])

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

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const isAdmin = await checkAdminStatus(data.user.id)
      setAuthState(prev => ({ 
        ...prev, 
        user: data.user, 
        token: data.session.access_token, 
        isAdmin, 
        loading: false 
      }))

      if (isAdmin) {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }

      return { user: data.user, isAdmin }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }, [checkAdminStatus, router])

  const value = useMemo(() => ({
    user: authState.user,
    setUser,
    loading: authState.loading,
    isProfileComplete: authState.isProfileComplete,
    isAdmin: authState.isAdmin,
    setIsProfileComplete,
    getToken,
    refreshToken,
    signIn
  }), [authState, setUser, setIsProfileComplete, getToken, refreshToken, signIn])

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
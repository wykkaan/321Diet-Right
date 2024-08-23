'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getUserSession, checkUserCompletion, supabase } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUserFromSession() {
      const session = await getUserSession()
      if (session) {
        setUser(session.user)
        const isComplete = await checkUserCompletion(session.user.id)
        setIsProfileComplete(isComplete)
        if (!isComplete && !window.location.pathname.startsWith('/onboarding')) {
          router.push('/onboarding/begin')
        }
      }
      setLoading(false)
    }
    loadUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
        const isComplete = await checkUserCompletion(session.user.id)
        setIsProfileComplete(isComplete)
        if (!isComplete) {
          router.push('/onboarding/begin')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsProfileComplete(true)
      }
    })

    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe()
      }
    }
  }, [router])

  const value = {
    user,
    setUser,
    loading,
    isProfileComplete,
    setIsProfileComplete
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
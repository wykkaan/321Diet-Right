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
    isSeller: false,
    loading: true
  })
  const router = useRouter()

  const checkUserRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return {
        isAdmin: data.role === 'admin',
        isSeller: data.role === 'seller'
      };
    } catch (error) {
      console.error('Error checking user role:', error)
      return { isAdmin: false, isSeller: false };
    }
  }, [])

  const loadUserFromSession = useCallback(async () => {
    const session = await getUserSession()
    if (session) {
      const { isAdmin, isSeller } = await checkUserRole(session.user.id)
      let isComplete = true
      
      // Only check profile completion for regular users
      if (!isAdmin && !isSeller) {
        isComplete = await checkUserCompletion(session.user.id)
      }

      setAuthState({
        user: session.user,
        token: session.access_token,
        isProfileComplete: isComplete,
        isAdmin,
        isSeller,
        loading: false
      })
      
      const currentPath = window.location.pathname
      if (!isAdmin && !isSeller && !isComplete && !currentPath.startsWith('/onboarding')) {
        router.push('/onboarding/begin')
      } else if (isAdmin && !currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        router.push('/admin/dashboard')
      } else if (isSeller && !currentPath.startsWith('/seller') && currentPath !== '/seller/login') {
        router.push('/seller/dashboard')
      } else if (!isAdmin && !isSeller && isComplete && currentPath.startsWith('/admin')) {
        router.push('/dashboard')
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isProfileComplete: true,
        isAdmin: false,
        isSeller: false,
        loading: false
      })
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/admin/login') && !currentPath.startsWith('/seller/login')) {
        router.push('/login')
      }
    }
  }, [router, checkUserRole])

  useEffect(() => {
    loadUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { isAdmin, isSeller } = await checkUserRole(session.user.id)
        let isComplete = true
        
        // Only check profile completion for regular users
        if (!isAdmin && !isSeller) {
          isComplete = await checkUserCompletion(session.user.id)
        }

        setAuthState({
          user: session.user,
          token: session.access_token,
          isProfileComplete: isComplete,
          isAdmin,
          isSeller,
          loading: false
        })
        
        const currentPath = window.location.pathname
        if (!isAdmin && !isSeller && !isComplete && !currentPath.startsWith('/onboarding')) {
          router.push('/onboarding/begin')
        } else if (isAdmin && !currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
          router.push('/admin/dashboard')
        } else if (isSeller && !currentPath.startsWith('/seller') && currentPath !== '/seller/login') {
          router.push('/seller/dashboard')
        } else if (!isAdmin && !isSeller && isComplete && !currentPath.startsWith('/dashboard')) {
          router.push('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          token: null,
          isProfileComplete: true,
          isAdmin: false,
          isSeller: false,
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
  }, [router, loadUserFromSession, checkUserRole])

  const getToken = useCallback(async () => {
    if (authState.token) return authState.token

    const session = await getUserSession()
    if (session) {
      setAuthState(prev => ({ ...prev, token: session.access_token }))
      return session.access_token
    }

    return null
  }, [authState.token])

  const value = useMemo(() => ({
    user: authState.user,
    loading: authState.loading,
    isProfileComplete: authState.isProfileComplete,
    isAdmin: authState.isAdmin,
    isSeller: authState.isSeller,
    getToken,
    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    
        const { user } = data;
    
        if (!user.email_confirmed_at) {
          router.push('/email-confirmation-pending');
        } else {
          const { isAdmin, isSeller } = await checkUserRole(user.id);
          let isComplete = true;
          
          // Only check profile completion for regular users
          if (!isAdmin && !isSeller) {
            isComplete = await checkUserCompletion(user.id);
          }

          setAuthState(prev => ({ 
            ...prev, 
            user: user, 
            token: data.session.access_token, 
            isAdmin, 
            isSeller,
            isProfileComplete: isComplete,
            loading: false 
          }));
    
          const currentPath = window.location.pathname
          if (isAdmin && currentPath !== '/admin/login') {
            router.push('/admin/dashboard');
          } else if (isSeller && currentPath !== '/seller/login') {
            router.push('/seller/dashboard');
          } else if (!isAdmin && !isSeller) {
            if (!isComplete) {
              router.push('/onboarding/begin');
            } else if (currentPath !== '/admin/login' && currentPath !== '/seller/login') {
              router.push('/dashboard');
            }
          }
        }
    
        return { user, isAdmin, isSeller };
      } catch (error) {
        console.error('Sign in error:', error);
        return { error };
      }
    },
  }), [authState, getToken, router, checkUserRole])

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
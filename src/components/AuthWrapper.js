'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const publicPaths = ['/', '/login', '/signup', '/email-confirmation-pending']

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return children
}
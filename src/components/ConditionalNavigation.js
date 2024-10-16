'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import BottomTabNavigation from './BottomTabNavigation'
import { usePathname } from 'next/navigation'

export default function ConditionalNavigation() {
  const { user, loading } = useAuth()
  const [showNavigation, setShowNavigation] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      setShowNavigation(!!user && !['/', '/login', '/signup'].includes(pathname))
    }
  }, [user, loading, pathname])

  if (loading || !showNavigation) return null

  return <BottomTabNavigation />
}
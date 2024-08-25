'use client'

import { useMemo } from 'react'
import { useAuth } from './AuthProvider'
import BottomTabNavigation from './BottomTabNavigation'

export default function ConditionalNavigation() {
  const { user, loading } = useAuth()

  const navigation = useMemo(() => {
    if (loading) return null
    return user ? <BottomTabNavigation /> : null
  }, [user, loading])

  return navigation
}
'use client'

import { useAuth } from './AuthProvider'
import BottomTabNavigation from './BottomTabNavigation'

export default function ConditionalNavigation() {
  const { user, loading } = useAuth()

  if (loading) return null

  return user ? <BottomTabNavigation /> : null
}
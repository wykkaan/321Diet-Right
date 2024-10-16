'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { signOut } from '@/lib/auth'

const BottomTabNavigation = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser } = useAuth()

  useEffect(() => {
    const path = pathname.split('/')[1]
    if (['dashboard', 'shop', 'more'].includes(path)) {
      setActiveTab(path)
    }
  }, [pathname])

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab)
    router.push(`/${tab}`)
  }, [router])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      setUser(null)
      localStorage.clear()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      alert('There was an error signing out. Please try again.')
    }
  }, [router, setUser])

  const tabIcons = useMemo(() => ({
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    shop: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    more: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    logout: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    )
  }), [])

  const renderTab = useCallback((tabName, label) => (
    <button
      onClick={() => handleTabClick(tabName)}
      className={`flex flex-col items-center ${activeTab === tabName ? 'text-[#F5E9D4]' : 'text-[#A0A0A0]'}`}
    >
      {tabIcons[tabName]}
      <span className="text-xs">{label}</span>
    </button>
  ), [activeTab, handleTabClick, tabIcons])

  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#3C4E2A] text-[#F5E9D4] flex justify-around items-center h-16">
      {renderTab('dashboard', 'Home')}
      {renderTab('shop', 'Shop')}
      {renderTab('more', 'More')}
      <button onClick={handleSignOut} className="flex flex-col items-center text-[#A0A0A0]">
        {tabIcons.logout}
        <span className="text-xs">Logout</span>
      </button>
    </div>
  )
}

export default BottomTabNavigation
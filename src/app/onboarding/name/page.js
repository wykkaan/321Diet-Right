// src\app\onboarding\name\page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NameInput() {
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      localStorage.setItem('userName', name.trim())
      router.push('/onboarding/goal')
    }
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Here is to a new beginning!</h1>
      <h2 className="text-xl mb-4 text-teal">Tell us your name</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-4 border border-olive rounded bg-white text-olive"
          placeholder="Your name"
          required
        />
        <button 
          type="submit"
          className="w-full bg-olive text-beige px-6 py-2 rounded-full hover:bg-olive-dark transition-colors"
        >
          Next
        </button>
      </form>
    </div>
  )
}
// src\app\onboarding\height\page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeightInput() {
  const [height, setHeight] = useState('')
  const [unit, setUnit] = useState('cm')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (height && parseFloat(height) > 0) {
      localStorage.setItem('userHeight', height)
      localStorage.setItem('userHeightUnit', unit)
      router.push('/onboarding/weight')
    } else {
      alert('Please enter a valid height')
    }
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your height is</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex mb-4">
          <input 
            type="number" 
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full p-2 mb-4 border border-olive rounded bg-white text-olive"
            placeholder="Height"
            required
            step="0.1"
            min="0"
          />
          <select 
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="p-2 border border-input rounded-r bg-background text-foreground"
          >
            <option value="cm">cm</option>
            <option value="ft">ft</option>
          </select>
        </div>
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
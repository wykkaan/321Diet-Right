// src\app\onboarding\calories\page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CalorieInput() {
  const [calories, setCalories] = useState('')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (calories && parseInt(calories) >= 500 && parseInt(calories) <= 5000) {
      localStorage.setItem('userDailyCalories', calories)
      router.push('/onboarding/loading')
    } else {
      alert('Please enter a valid daily calorie goal between 500 and 5000')
    }
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your target daily calories</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full p-2 mb-4 border border-olive rounded bg-white text-olive"
            placeholder="Daily calories"
            required
            step="1"
            min="500"
            max="5000"
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
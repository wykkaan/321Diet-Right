'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WeightInput() {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('kg')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (weight && parseFloat(weight) > 0) {
      localStorage.setItem('userWeight', weight)
      localStorage.setItem('userWeightUnit', unit)
      router.push('/onboarding/calories')
    } else {
      alert('Please enter a valid weight')
    }
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your weight is</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex mb-4">
          <input 
            type="number" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-2 mb-4 border border-olive rounded bg-white text-olive"
            placeholder="Weight"
            required
            step="0.1"
            min="0"
          />
          <select 
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="p-2 border border-input rounded-r bg-background text-foreground"
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
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
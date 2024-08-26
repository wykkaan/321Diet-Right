// src\app\onboarding\age\page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AgeInput() {
    const [age, setAge] = useState('')
    const router = useRouter()
  
    const handleSubmit = (e) => {
      e.preventDefault()
      if (age && parseInt(age) > 0 && parseInt(age) < 120) {
        localStorage.setItem('userAge', age)
        router.push('/onboarding/height')
      } else {
        alert('Please enter a valid age between 1 and 120')
      }
    }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your age is</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input 
          type="text" 
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full p-2 mb-4 border border-olive rounded bg-white text-olive"
          placeholder="Your age"
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
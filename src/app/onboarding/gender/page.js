// src\app\onboarding\gender\page.js
'use client'

import { useRouter } from 'next/navigation'

export default function GenderSelection() {
  const router = useRouter()

  const handleGenderSelect = (gender) => {
    localStorage.setItem('userGender', gender)
    router.push('/onboarding/age')
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your gender is</h1>
      <div className="space-y-4 w-full max-w-md">
        {[
          { text: 'Male', color: 'bg-teal' },
          { text: 'Female', color: 'bg-coral' },
          { text: 'Other', color: 'bg-yellow' }
        ].map((gender) => (
          <button
            key={gender.text}
            onClick={() => handleGenderSelect(gender.text)}
            className={`w-full ${gender.color} text-beige px-6 py-3 rounded-lg hover:opacity-90 transition-opacity`}
          >
            {gender.text}
          </button>
        ))}
      </div>
    </div>
  )
}
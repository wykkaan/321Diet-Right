// File: src/app/onboarding/loading/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoadingScreen() {
  const router = useRouter()
  const [error, setError] = useState(null)

  useEffect(() => {
    const submitUserData = async () => {
      try {
        const response = await fetch('/api/submit-user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail'), // Assuming you collected this during sign up
            goal: localStorage.getItem('userGoal'),
            gender: localStorage.getItem('userGender'),
            age: parseInt(localStorage.getItem('userAge')),
            height: parseFloat(localStorage.getItem('userHeight')),
            weight: parseFloat(localStorage.getItem('userWeight')),
            target_calories: parseInt(localStorage.getItem('userDailyCalories'))
          })
        })

        if (!response.ok) {
          throw new Error('Failed to submit user data')
        }

        const result = await response.json()
        console.log('User data submitted successfully:', result)

        // Clear localStorage after successful submission
        localStorage.clear()

        // Redirect to the dashboard
        router.push('/dashboard')
      } catch (error) {
        console.error('Error submitting user data:', error)
        setError('An error occurred while setting up your account. Please try again.')
      }
    }

    submitUserData()
  }, [router])

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Setting the building blocks for your journey</h1>
      {!error ? (
        <>
          <div className="w-16 h-16 border-t-4 border-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-olive">Please wait while we personalize your experience...</p>
        </>
      ) : (
        <div className="text-center">
          <p className="text-coral mb-4">{error}</p>
          <button 
            onClick={() => router.push('/onboarding/begin')}
            className="bg-olive text-beige px-6 py-2 rounded-full hover:bg-olive-dark transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
}
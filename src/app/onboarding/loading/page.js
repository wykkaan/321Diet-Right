'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/auth'

export default function LoadingScreen() {
  const router = useRouter()
  const [status, setStatus] = useState('loading') // 'loading', 'success', or 'error'

  useEffect(() => {
    const submitUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          setStatus('error');
          return;
        }

        const response = await fetch('/api/submit-user-data', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            username: localStorage.getItem('userName'),
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

        // Set status to success
        setStatus('success')

        // Redirect to the dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500) // 1.5 second delay
      } catch (error) {
        console.error('Error submitting user data:', error)
        setStatus('error')
      }
    }

    submitUserData()
  }, [router])

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Setting the building blocks for your journey</h1>
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 border-t-4 border-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-olive">Please wait while we personalize your experience...</p>
        </>
      )}
      {status === 'success' && (
        <div className="text-center">
          <p className="text-teal mb-4">Success! Redirecting to your dashboard...</p>
          <div className="w-16 h-16 border-4 border-teal border-solid rounded-full flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-coral mb-4">An error occurred while setting up your account. Please try again.</p>
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
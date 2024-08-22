'use client'

import { useRouter } from 'next/navigation'

export default function GoalSelection() {
  const router = useRouter()

  const handleGoalSelect = (goal) => {
    localStorage.setItem('userGoal', goal)
    router.push('/onboarding/gender')
  }

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 text-olive-dark">Your goal is to</h1>
      <div className="space-y-4 w-full max-w-md">
        {[
          { text: 'Lose Weight', color: 'bg-teal' },
          { text: 'Maintain Weight', color: 'bg-yellow' },
          { text: 'Gain Weight', color: 'bg-coral' }
        ].map((goal) => (
          <button
            key={goal.text}
            onClick={() => handleGoalSelect(goal.text)}
            className={`w-full ${goal.color} text-beige px-6 py-3 rounded-lg hover:opacity-90 transition-opacity`}
          >
            {goal.text}
          </button>
        ))}
      </div>
    </div>
  )
}
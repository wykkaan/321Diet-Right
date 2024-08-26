// src\app\onboarding\begin\page.js
'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image';

export default function BeginJourney() {
  const router = useRouter()

  const journeyItems = [
    { text: 'LOSE WEIGHT', color: 'text-teal' },
    { text: 'KEEP FIT', color: 'text-coral' },
    { text: 'EAT HEALTHY', color: 'text-yellow' },
    { text: 'MEAL PREP', color: 'text-teal' },
  ]

  return (
    <div className="min-h-screen bg-beige text-olive flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-olive-dark">DIETRIGHT HELPS YOU</h1>
      <div className="bg-white text-olive p-6 rounded-lg mb-8 shadow-md">
        <ul className="space-y-4">
          {journeyItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <Image
                alt="checkmark"
                src="/checkmark.svg"
                className="mr-2"
                width={24}
                height={24}
              />
              <span className={item.color}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <button 
        onClick={() => router.push('/onboarding/name')}
        className="bg-olive text-beige px-6 py-3 rounded-full font-semibold hover:bg-olive-dark transition-colors"
      >
        BEGIN MY JOURNEY
      </button>
    </div>
  )
}
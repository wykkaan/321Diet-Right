// src/components/MealAssistantWrapper.js
'use client'

import dynamic from 'next/dynamic'

const MealAssistant = dynamic(() => import('./MealAssistant'), { ssr: false })

export default function MealAssistantWrapper() {
  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Meal Assistant</h1>
        <MealAssistant />
      </div>
    </div>
  );
}
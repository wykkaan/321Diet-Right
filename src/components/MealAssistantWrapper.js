// src/components/MealAssistantWrapper.js
'use client'

import dynamic from 'next/dynamic'

const MealAssistant = dynamic(() => import('./MealAssistant'), { ssr: false })

export default function MealAssistantWrapper() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4"></h1>
      <MealAssistant />
    </div>
  );
}
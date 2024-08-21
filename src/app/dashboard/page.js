'use client'

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('logbook');
  const { user } = useAuth();

  return (
    <div className="font-sans bg-[#F5E9D4] text-[#3C4E2A] min-h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#3C4E2A]">DIET RIGHT</h1>
          <p className="text-[#3C4E2A] mt-2">
            <span className="text-[#3C4E2A] mr-2">&lt;</span>
            Today
            <span className="text-[#3C4E2A] ml-2">&gt;</span>
          </p>
        </div>

        {/* Calories */}
        <div className="bg-[#3C4E2A] rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center text-[#F5E9D4]">
            <span className="text-lg">Calories</span>
            <span className="text-2xl font-bold">2000 kcal</span>
          </div>
          <p className="text-right text-sm text-[#F5E9D4]">Remaining</p>
          <div className="mt-2 w-full bg-[#F5E9D4] rounded-full h-2">
            <div className="bg-[#4CAF50] h-2 rounded-full" style={{width: '0%'}}></div>
          </div>
        </div>

        {/* Macros */}
        <div className="bg-[#F5E9D4] rounded-lg p-4 mb-4 border border-[#3C4E2A]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg">Macros</h2>
            <span className="text-sm">Remaining</span>
          </div>
          <div className="flex justify-between">
            <MacroCircle label="Carbs" value={264} color="border-blue-500" />
            <MacroCircle label="Protein" value={80} color="border-red-500" />
            <MacroCircle label="Fats" value={66} color="[#FFDB58]" />
          </div>
        </div>

        {/* Premium Button */}
        <button className="w-full bg-[#008080] text-white py-3 rounded-lg font-semibold mb-4">
          GO PREMIUM
        </button>

        {/* Meal Sections */}
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
          <div key={meal} className="bg-[#F5E9D4] border border-[#3C4E2A] rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">{meal}</h3>
            <button className="text-[#008080]">
              Add food +
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Tabs */}
    </div>
  );
};

const MacroCircle = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${color}`}>
      <span className="font-bold">{value}g</span>
    </div>
    <p className="mt-2 text-sm">{label}</p>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    className={`flex-1 py-4 text-center font-semibold ${
      active ? 'text-[#008080] border-t-2 border-[#008080]' : 'text-[#3C4E2A]'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

export default Dashboard;
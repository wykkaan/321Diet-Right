// src\app\goals\page.js
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const GoalPage = () => {
  const [startingWeight, setStartingWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchGoalData();
  }, []);

  const fetchGoalData = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-goal', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goal data');
      }

      const data = await response.json();
      setStartingWeight(data.startingWeight || '');
      setCurrentWeight(data.currentWeight || '');
      setTargetWeight(data.targetWeight || '');
    } catch (err) {
      console.error('Error fetching goal data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch('/api/user-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startingWeight: parseFloat(startingWeight),
          currentWeight: parseFloat(currentWeight),
          targetWeight: parseFloat(targetWeight)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      router.push('/profile');
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">MY CURRENT GOAL</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="startingWeight" className="block mb-2">Starting Weight</label>
          <input
            type="number"
            id="startingWeight"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="currentWeight" className="block mb-2">Current Weight</label>
          <input
            type="number"
            id="currentWeight"
            value={currentWeight}
            onChange={(e) => setCurrentWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="targetWeight" className="block mb-2">Target Weight</label>
          <input
            type="number"
            id="targetWeight"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold"
        >
          Update Goal
        </button>
      </form>
    </div>
  );
};

export default GoalPage;
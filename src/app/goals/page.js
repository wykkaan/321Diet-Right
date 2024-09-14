// src\app\goals\page.js
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

const GoalPage = () => {
  const [startingWeight, setStartingWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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
      setError('Failed to load goal data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMessage('');

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

      setSuccessMessage('Goal updated successfully!');
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update goal. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <Link href="/dashboard" className="inline-block mb-4 text-[#3C4E2A] hover:underline">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-4">MY CURRENT GOAL</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="startingWeight" className="block mb-2">Starting Weight (kg)</label>
          <input
            type="number"
            id="startingWeight"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
            step="0.1"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="currentWeight" className="block mb-2">Current Weight (kg)</label>
          <input
            type="number"
            id="currentWeight"
            value={currentWeight}
            onChange={(e) => setCurrentWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
            step="0.1"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="targetWeight" className="block mb-2">Target Weight (kg)</label>
          <input
            type="number"
            id="targetWeight"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full p-2 bg-[#E5D9C4] rounded"
            required
            step="0.1"
          />
        </div>
        <button 
          type="submit"
          className={`w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2A3E1A]'}`}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Goal'}
        </button>
      </form>
    </div>
  );
};

export default GoalPage;
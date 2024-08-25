'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [foodLog, setFoodLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(null);
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserData();
      fetchFoodLog();
    }
  }, [user, authLoading]);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      setUserData(data);
      setCurrentWeight(data.weight); // Set the current weight from user data
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    }
  };

  const fetchFoodLog = async () => {
    try {
      const token = await getToken();
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/user-food-log?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch food log');
      const data = await response.json();
      setFoodLog(data);
    } catch (err) {
      console.error('Error fetching food log:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (mealType) => {
    router.push(`/add-food/${mealType}`);
  };

  const calculateTotalNutrition = (foodLog) => {
    return foodLog.reduce((total, entry) => {
      total.calories += entry.calories;
      total.protein += entry.protein;
      total.fat += entry.fat;
      total.carbs += entry.carbohydrates;
      return total;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const updateWeight = async (newWeight) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/update-weight', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight: newWeight }),
      });

      if (!response.ok) throw new Error('Failed to update weight');
      setCurrentWeight(newWeight);
    } catch (err) {
      console.error('Error updating weight:', err);
      setError(err.message);
    }
  };

  if (authLoading || loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No user data available</div>;

  const totalNutrition = calculateTotalNutrition(foodLog);
  const remainingCalories = userData.target_calories - totalNutrition.calories;

  return (
    <div className="font-sans bg-[#F5E9D4] text-[#3C4E2A] min-h-screen flex flex-col p-4">
      <h1 className="text-2xl font-bold text-center mb-2">DIET RIGHT</h1>
      <p className="text-center mb-4">&lt; Today &gt;</p>


      {/* Calories */}
      <div className="bg-[#3C4E2A] text-[#F5E9D4] p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span>Calories</span>
          <span className="font-bold">{remainingCalories} kcal</span>
        </div>
        <p className="text-right text-sm">Remaining</p>
        <div className="w-full bg-[#F5E9D4] h-2 rounded-full mt-2">
          <div 
            className="bg-[#4CAF50] h-2 rounded-full" 
            style={{width: `${(totalNutrition.calories / userData.target_calories) * 100}%`}}
          ></div>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-[#F5E9D4] border border-[#3C4E2A] p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <span>Macros</span>
          <span>Consumed</span>
        </div>
        <div className="flex justify-between">
          <MacroCircle label="Carbs" value={Math.round(totalNutrition.carbs)} color="border-[#00BCD4]" />
          <MacroCircle label="Protein" value={Math.round(totalNutrition.protein)} color="border-[#F44336]" />
          <MacroCircle label="Fats" value={Math.round(totalNutrition.fat)} color="border-[#FFC107]" />
        </div>
      </div>

      {/* Premium Button */}
      <button className="w-full bg-[#008080] text-white py-3 rounded-lg font-semibold mb-4">
        GO PREMIUM
      </button>

      {/* Meal Sections */}
      {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
        <div key={meal} className="bg-[#F5E9D4] border border-[#3C4E2A] rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2 capitalize">{meal}</h3>
          {foodLog.filter(entry => entry.meal_type === meal).map((entry) => (
            <div key={entry.id} className="mb-2">
              <p>{entry.food_menu.title}</p>
              <p className="text-sm">{entry.calories} kcal</p>
            </div>
          ))}
          <button 
            className="text-[#008080]"
            onClick={() => handleAddFood(meal)}
          >
            Add food +
          </button>
        </div>
      ))}
      
      {/* Weight Section */}
      <WeightUpdate currentWeight={currentWeight} updateWeight={updateWeight} />

    </div>
  );
  
};

const MacroCircle = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${color}`}>
      <span className="font-bold">{value}g</span>
    </div>
    <p className="mt-1 text-sm">{label}</p>
  </div>
);

const WeightUpdate = ({ currentWeight, updateWeight }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newWeight, setNewWeight] = useState(currentWeight);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateWeight(newWeight);
    setIsEditing(false);
  };

  return (
    <div className="bg-[#F5E9D4] border border-[#3C4E2A] p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Current Weight</h3>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="border rounded p-1 mr-2"
            step="0.1"
          />
          <button type="submit" className="bg-[#008080] text-white px-2 py-1 rounded">
            Save
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <span>{currentWeight} kg</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[#008080]"
          >
            Update
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
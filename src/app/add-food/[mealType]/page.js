'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const AddFoodPage = ({ params }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFood, setSelectedFood] = useState(null);
    const [servingSize, setServingSize] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { mealType } = params;
    const { user, getToken } = useAuth();
  
    useEffect(() => {
      if (searchQuery.length > 2) {
        searchFood();
      } else {
        setSearchResults([]);
      }
    }, [searchQuery]);
  
    const searchFood = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/food-search?query=${searchQuery}`);
        if (!response.ok) throw new Error('Failed to fetch food suggestions');
        const data = await response.json();
        setSearchResults(data.results);
      } catch (error) {
        console.error('Error searching food:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchFoodDetails = async (id) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/food-details/${id}`);
        if (!response.ok) throw new Error('Failed to fetch food details');
        const data = await response.json();
        setSelectedFood(data);
      } catch (error) {
        console.error('Error fetching food details:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleFoodSelect = (food) => {
      fetchFoodDetails(food.id);
    };
  
    const handleBack = () => {
      if (selectedFood) {
        setSelectedFood(null);
      } else {
        router.back();
      }
    };
  
    const handleAddFood = async () => {
      if (!user || !selectedFood) return;
  
      try {
        let token;
        if (getToken) {
          token = await getToken();
        } else {
          console.error('getToken function is not available');
          return;
        }
  
        const response = await fetch('/api/add-food-entry', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            food_menu_id: selectedFood.id,
            meal_type: mealType,
            serving_size: servingSize,
            calories: selectedFood.calories,
            protein: selectedFood.protein,
            fat: selectedFood.fat,
            carbohydrates: selectedFood.carbohydrates,
          })
        });
  
        if (!response.ok) throw new Error('Failed to add food entry');
  
        const data = await response.json();
        console.log('Food entry added:', data);
  
        router.back();
      } catch (error) {
        console.error('Error adding food entry:', error);
        // Handle error (e.g., show error message to user)
      }
    };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <div className="flex items-center mb-4">
        <button onClick={handleBack} className="mr-4">&times;</button>
        <h1 className="text-xl font-bold capitalize">{mealType}</h1>
      </div>
      
      {!selectedFood && (
        <>
          <input
            type="text"
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-4 bg-[#E5D9C4] rounded"
          />

          <div className="flex mb-4">
            <button className="mr-2 px-4 py-2 bg-[#E5D9C4] rounded">Food</button>
            <button className="px-4 py-2 bg-[#E5D9C4] rounded">Recipes</button>
          </div>

          {loading && <p>Loading...</p>}

          {searchResults.length === 0 && !loading && (
            <div className="text-center mt-8">
              <p className="font-bold mb-2">Oops... there is nothing saved here...</p>
              <p>Start logging your food for the day!</p>
            </div>
          )}

          {searchResults.map((item) => (
            <div 
              key={item.id} 
              className="mb-2 p-2 bg-white rounded cursor-pointer"
              onClick={() => handleFoodSelect(item)}
            >
              {item.title}
            </div>
          ))}
        </>
      )}

      {selectedFood && (
        <div className="bg-white p-4 rounded">
          <h2 className="text-xl font-bold mb-2">{selectedFood.title}</h2>
          <p className="mb-2">{selectedFood.restaurant_chain}</p>
          <div className="mb-4">
            <p>Calories: {Math.round(selectedFood.calories * servingSize)}</p>
            <p>Protein: {(selectedFood.protein * servingSize).toFixed(2)}g</p>
            <p>Fat: {(selectedFood.fat * servingSize).toFixed(2)}g</p>
            <p>Carbs: {(selectedFood.carbohydrates * servingSize).toFixed(2)}g</p>
          </div>
          <div className="mb-4">
            <label htmlFor="serving-size" className="block mb-2">Serving Size:</label>
            <input
              type="number"
              id="serving-size"
              value={servingSize}
              onChange={(e) => setServingSize(Math.max(0.25, parseFloat(e.target.value)))}
              min="0.25"
              step="0.25"
              className="w-full p-2 bg-[#E5D9C4] rounded"
            />
          </div>
          <button 
            onClick={handleAddFood}
            className="w-full bg-[#008080] text-white py-2 rounded"
          >
            Add to {mealType}
          </button>
        </div>
      )}
    </div>
  );
};

export default AddFoodPage;
// src/app/add-food/[mealType]/page.js
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const AddFoodPage = ({ params }) => {
    const [activeTab, setActiveTab] = useState('food');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFood, setSelectedFood] = useState(null);
    const [servingSize, setServingSize] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userRecipes, setUserRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const router = useRouter();
    const { mealType } = params;
    const { user, getToken } = useAuth();
  
    useEffect(() => {
      if (activeTab === 'food' && searchQuery.length > 2) {
        searchFood();
      } else if (activeTab === 'recipes') {
        fetchUserRecipes();
      }
    }, [searchQuery, activeTab]);
  
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
  
    const fetchUserRecipes = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch('/api/recipes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch recipes');
        const data = await response.json();
        setUserRecipes(data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
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
  
    const handleRecipeSelect = (recipe) => {
      setSelectedRecipe(recipe);
    };
  
    const handleBack = () => {
      if (selectedFood) {
        setSelectedFood(null);
      } else if (selectedRecipe) {
        setSelectedRecipe(null);
      } else {
        router.back();
      }
    };

    const handleAddFood = async () => {
      if (!user || !selectedFood) return;
  
      try {
        const token = await getToken();
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
      }
    };

    const calculateTotalNutrition = (recipe) => {
      return recipe.ingredients.reduce((total, ingredient) => {
        total.calories += ingredient.calories;
        total.protein += ingredient.protein;
        total.fat += ingredient.fat;
        total.carbohydrates += ingredient.carbohydrates;
        return total;
      }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    };

    const handleAddRecipe = async () => {
      if (!user || !selectedRecipe) return;
  
      const totalNutrition = calculateTotalNutrition(selectedRecipe);
  
      try {
        const token = await getToken();
        const response = await fetch('/api/add-food-entry', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            recipe_id: selectedRecipe.id,
            meal_type: mealType,
            serving_size: servingSize,
            calories: totalNutrition.calories * servingSize,
            protein: totalNutrition.protein * servingSize,
            fat: totalNutrition.fat * servingSize,
            carbohydrates: totalNutrition.carbohydrates * servingSize,
          })
        });
  
        if (!response.ok) throw new Error('Failed to add recipe as food entry');
  
        const data = await response.json();
        console.log('Recipe added as food entry:', data);
  
        router.back();
      } catch (error) {
        console.error('Error adding recipe as food entry:', error);
      }
    };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <div className="flex items-center mb-4">
        <button onClick={handleBack} className="mr-4">&times;</button>
        <h1 className="text-xl font-bold capitalize">{mealType}</h1>
      </div>
      
      <div className="flex mb-4">
        <button 
          className={`mr-2 px-4 py-2 ${activeTab === 'food' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
          onClick={() => setActiveTab('food')}
        >
          Food
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'recipes' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
          onClick={() => setActiveTab('recipes')}
        >
          My Recipes
        </button>
      </div>

      <input
        type="text"
        placeholder={`Search for ${activeTab === 'food' ? 'food' : 'recipes'}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 mb-4 bg-[#E5D9C4] rounded"
      />

      {loading && <p>Loading...</p>}

      {activeTab === 'food' && (
        <>
          {searchResults.length === 0 && !loading && (
            <div className="text-center mt-8">
              <p className="font-bold mb-2">No results found</p>
              <p>Try a different search term</p>
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

          {selectedFood && (
            <div className="bg-white p-4 rounded mt-4">
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
        </>
      )}

     {activeTab === 'recipes' && (
        <>
          {userRecipes.length === 0 && !loading && (
            <div className="text-center mt-8">
              <p className="font-bold mb-2">No recipes found</p>
              <p>Add some recipes in the My Recipes section</p>
            </div>
          )}

          {userRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((recipe) => {
            const totalNutrition = calculateTotalNutrition(recipe);
            return (
              <div 
                key={recipe.id} 
                className="mb-2 p-2 bg-white rounded cursor-pointer"
                onClick={() => handleRecipeSelect(recipe)}
              >
                <h3 className="font-bold">{recipe.name}</h3>
                <p>
                  Calories: {Math.round(totalNutrition.calories)} | 
                  Protein: {totalNutrition.protein.toFixed(1)}g | 
                  Fat: {totalNutrition.fat.toFixed(1)}g | 
                  Carbs: {totalNutrition.carbohydrates.toFixed(1)}g
                </p>
              </div>
            );
          })}

            {selectedRecipe && (
              <div className="bg-white p-4 rounded mt-4">
                <h2 className="text-xl font-bold mb-2">{selectedRecipe.name}</h2>
                <div className="mb-4">
                  <h3 className="font-bold">Ingredients:</h3>
                  <ul className="list-disc list-inside">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.name} - {ingredient.weight}g 
                        (Calories: {ingredient.calories}, Protein: {ingredient.protein}g, 
                        Fat: {ingredient.fat}g, Carbs: {ingredient.carbohydrates}g)
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h3 className="font-bold">Instructions:</h3>
                  <p>{selectedRecipe.instructions}</p>
                </div>
                {(() => {
                const totalNutrition = calculateTotalNutrition(selectedRecipe);
                return (
                  <div className="mb-4">
                    <p>Total Calories: {Math.round(totalNutrition.calories * servingSize)}</p>
                    <p>Total Protein: {(totalNutrition.protein * servingSize).toFixed(1)}g</p>
                    <p>Total Fat: {(totalNutrition.fat * servingSize).toFixed(1)}g</p>
                    <p>Total Carbs: {(totalNutrition.carbohydrates * servingSize).toFixed(1)}g</p>
                  </div>
                );
              })()}
                <div className="mb-4">
                  <label htmlFor="recipe-serving-size" className="block mb-2">Serving Size:</label>
                  <input
                    type="number"
                    id="recipe-serving-size"
                    value={servingSize}
                    onChange={(e) => setServingSize(Math.max(0.25, parseFloat(e.target.value)))}
                    min="0.25"
                    step="0.25"
                    className="w-full p-2 bg-[#E5D9C4] rounded"
                  />
                </div>
                <button 
                  onClick={handleAddRecipe}
                  className="w-full bg-[#008080] text-white py-2 rounded"
                >
                  Add to {mealType}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
};

export default AddFoodPage;
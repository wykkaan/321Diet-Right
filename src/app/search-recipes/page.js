// src\app\search-recipes\page.js
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const dietaryPreferences = [
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'ketogenic', label: 'Ketogenic' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'lacto_vegetarian', label: 'Lacto-Vegetarian' },
  { id: 'ovo_vegetarian', label: 'Ovo-Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescetarian', label: 'Pescetarian' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'primal', label: 'Primal' },
  { id: 'low_fodmap', label: 'Low FODMAP' },
  { id: 'whole30', label: 'Whole30' },
  { id: 'halal', label: 'Halal' },
];

const SearchForRecipes = () => {
  const [ingredients, setIngredients] = useState('');
  const [query, setQuery] = useState('');
  const [selectedDiets, setSelectedDiets] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');
  const [searchType, setSearchType] = useState('ingredients'); // 'ingredients' or 'query'
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchUserPreferences();
    fetchFavorites();
  }, []);


  const toggleFavorite = async (recipe) => {
    try {
      const token = await getToken();
      const isFavorite = favorites.some(fav => fav.recipe_id === recipe.id);
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch('/api/favorites', {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipe_id: recipe.id,
          recipe_title: recipe.title,
          recipe_image: recipe.image,
          ready_in_minutes: recipe.readyInMinutes,
          servings: recipe.servings,
          calories: recipe.nutrition?.nutrients.find(n => n.name === "Calories")?.amount || 0,
          protein: recipe.nutrition?.nutrients.find(n => n.name === "Protein")?.amount || 0,
          fat: recipe.nutrition?.nutrients.find(n => n.name === "Fat")?.amount || 0,
          carbs: recipe.nutrition?.nutrients.find(n => n.name === "Carbohydrates")?.amount || 0
        })
      });
      if (response.ok) {
        if (isFavorite) {
          setFavorites(favorites.filter(fav => fav.recipe_id !== recipe.id));
        } else {
          const newFavorite = await response.json();
          setFavorites([...favorites, newFavorite]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedDiets(data.dietary_preferences || {});
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleDietChange = (dietId) => {
    setSelectedDiets(prev => ({
      ...prev,
      [dietId]: !prev[dietId]
    }));
  };

  const handleSavePreferences = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dietary_preferences: selectedDiets })
      });
      if (response.ok) {
        console.log('Preferences saved successfully');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/recipe-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchType,
          ingredients: searchType === 'ingredients' ? ingredients.split(',').map(i => i.trim()) : [],
          query: searchType === 'query' ? query : '',
          dietaryPreferences: selectedDiets
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecipeList = (recipes) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map(recipe => (
        <div key={recipe.id || recipe.recipe_id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={recipe.image || recipe.recipe_image} 
            alt={recipe.title || recipe.recipe_title} 
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 truncate">{recipe.title || recipe.recipe_title}</h3>
            <div className="text-sm text-gray-600 mb-2">
              <p>Ready in: {recipe.readyInMinutes || recipe.ready_in_minutes} minutes</p>
              <p>Servings: {recipe.servings}</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Nutrition (per serving):</p>
              <p>Calories: {Math.round(recipe.calories || (recipe.nutrition?.nutrients.find(n => n.name === "Calories")?.amount || 0))}</p>
              <p>Protein: {Math.round(recipe.protein || (recipe.nutrition?.nutrients.find(n => n.name === "Protein")?.amount || 0))}g</p>
              <p>Fat: {Math.round(recipe.fat || (recipe.nutrition?.nutrients.find(n => n.name === "Fat")?.amount || 0))}g</p>
              <p>Carbs: {Math.round(recipe.carbs || (recipe.nutrition?.nutrients.find(n => n.name === "Carbohydrates")?.amount || 0))}g</p>
            </div>
            <button 
              onClick={() => toggleFavorite(recipe)} 
              className="mt-2 text-yellow-500 hover:text-yellow-600"
            >
              {favorites.some(fav => fav.recipe_id === (recipe.id || recipe.recipe_id)) ? '★' : '☆'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button onClick={() => router.back()} className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Search For Recipes</h1>
        </div>

        <div className="flex mb-4">
          <button
            className={`mr-2 px-4 py-2 ${activeTab === 'recipes' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
            onClick={() => setActiveTab('recipes')}
          >
            Recipes
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'favorites' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </button>
        </div>

        {activeTab === 'recipes' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by:
              </label>
              <div className="flex">
                <button
                  className={`mr-2 px-4 py-2 ${searchType === 'ingredients' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
                  onClick={() => setSearchType('ingredients')}
                >
                  Ingredients
                </button>
                <button
                  className={`px-4 py-2 ${searchType === 'query' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#E5D9C4]'} rounded`}
                  onClick={() => setSearchType('query')}
                >
                  Recipe Name
                </button>
              </div>
            </div>

            {searchType === 'ingredients' && (
              <div className="mb-4">
                <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter ingredients (comma-separated):
                </label>
                <input
                  type="text"
                  id="ingredients"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. apples, flour, sugar"
                />
              </div>
            )}

            {searchType === 'query' && (
              <div className="mb-4">
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter recipe name or description:
                </label>
                <input
                  type="text"
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. vegetarian pasta"
                />
              </div>
            )}

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Dietary Preferences</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {dietaryPreferences.map((diet) => (
                  <label key={diet.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDiets[diet.id] || false}
                      onChange={() => handleDietChange(diet.id)}
                      className="mr-2"
                    />
                    {diet.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold mb-4"
            >
              Save Preferences
            </button>

            <button
              onClick={handleSearch}
              className="w-full bg-[#008080] text-[#F5E9D4] py-2 rounded-lg font-semibold mb-4"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search Recipes'}
            </button>

            {searchResults.length > 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Search Results</h2>
                {renderRecipeList(searchResults)}
              </div>
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Favorites</h2>
            {renderRecipeList(favorites)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForRecipes;
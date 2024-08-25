'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import IngredientAutocomplete from '@/components/IngredientAutocomplete';
import { useAuth } from '@/components/AuthProvider';

const MyRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ name: '', ingredients: [], instructions: '' });
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();
  
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientSelect = (ingredient) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient]
    }));
  };

  const handleCreateRecipe = async () => {
    try {
      const token = await getToken(); 
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }
  
      const data = await response.json();
  
      setRecipes(prev => [data, ...prev]);
      setIsCreatingRecipe(false);
      setNewRecipe({ name: '', ingredients: [], instructions: '' });
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError(err.message);
    }
  };

  const calculateTotalNutrition = () => {
    return newRecipe.ingredients.reduce((total, ingredient) => {
      const factor = ingredient.weight / 100; // Calculate based on actual weight
      total.protein += ingredient.protein * factor;
      total.fat += ingredient.fat * factor;
      total.carbohydrates += ingredient.carbohydrates * factor;
      total.calories += ingredient.calories * factor;
      return total;
    }, { protein: 0, fat: 0, carbohydrates: 0, calories: 0 });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] flex flex-col">
      <div className="flex-grow p-4">
        <h1 className="text-2xl font-bold mb-4">MY RECIPES</h1>
        
        {recipes.length === 0 ? (
          <div className="text-center mb-4">
            <p className="font-bold">Oops... there is nothing saved here...</p>
            <p>Start saving your recipes to keep track of the ingredients you use!</p>
          </div>
        ) : (
          <ul className="mb-4">
            {recipes.map(recipe => (
              <li key={recipe.id} className="mb-2">{recipe.name}</li>
            ))}
          </ul>
        )}

        <button 
          onClick={() => setIsCreatingRecipe(true)} 
          className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded mb-4"
        >
          + Create New Recipe
        </button>

        {isCreatingRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-[#F5E9D4] p-4 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">Create New Recipe</h2>
              <input
                type="text"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Recipe Name"
                className="w-full p-2 mb-2 border border-[#3C4E2A] rounded"
              />
              <IngredientAutocomplete onIngredientSelect={handleIngredientSelect} />
              {newRecipe.ingredients.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold mb-2">Selected Ingredients</h3>
                  <ul>
                    {newRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="mb-1">
                        {ingredient.name} ({ingredient.weight}g) - 
                        Protein: {ingredient.protein.toFixed(2)}g, 
                        Fat: {ingredient.fat.toFixed(2)}g, 
                        Carbs: {ingredient.carbohydrates.toFixed(2)}g, 
                        Calories: {ingredient.calories.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-bold mt-4 mb-2">Total Nutrition</h3>
                  <p>
                    Protein: {calculateTotalNutrition().protein.toFixed(2)}g, 
                    Fat: {calculateTotalNutrition().fat.toFixed(2)}g, 
                    Carbs: {calculateTotalNutrition().carbohydrates.toFixed(2)}g, 
                    Calories: {calculateTotalNutrition().calories.toFixed(2)}
                  </p>
                </div>
              )}
              <textarea
                value={newRecipe.instructions}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions"
                className="w-full p-2 mb-2 border border-[#3C4E2A] rounded"
                rows="4"
              />
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsCreatingRecipe(false)} 
                  className="bg-[#FF7F50] text-[#F5E9D4] px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateRecipe} 
                  className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRecipesPage;
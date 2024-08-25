// app/api/recipe-search/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    const { searchType, ingredients, query, dietaryPreferences } = await request.json();

    let searchResults = [];

    if (searchType === 'ingredients' && ingredients.length > 0) {
      const ingredientSearchUrl = new URL('https://api.spoonacular.com/recipes/findByIngredients');
      ingredientSearchUrl.searchParams.append('apiKey', spoonacularApiKey);
      ingredientSearchUrl.searchParams.append('ingredients', ingredients.join(','));
      ingredientSearchUrl.searchParams.append('number', '10');
      ingredientSearchUrl.searchParams.append('ranking', '1');

      const ingredientSearchResponse = await fetch(ingredientSearchUrl.toString());
      searchResults = await ingredientSearchResponse.json();
    } else if (searchType === 'query' && query) {
      const complexSearchUrl = new URL('https://api.spoonacular.com/recipes/complexSearch');
      complexSearchUrl.searchParams.append('apiKey', spoonacularApiKey);
      complexSearchUrl.searchParams.append('query', query);
      complexSearchUrl.searchParams.append('number', '10');
      complexSearchUrl.searchParams.append('addRecipeNutrition', 'true');
      
      // Add dietary preferences to the query
      if (dietaryPreferences) {
        if (dietaryPreferences.gluten_free) complexSearchUrl.searchParams.append('intolerances', 'gluten');
        if (dietaryPreferences.vegetarian) complexSearchUrl.searchParams.append('diet', 'vegetarian');
        if (dietaryPreferences.vegan) complexSearchUrl.searchParams.append('diet', 'vegan');
        // Add more dietary preferences as needed
      }

      const complexSearchResponse = await fetch(complexSearchUrl.toString());
      const complexSearchResults = await complexSearchResponse.json();
      searchResults = complexSearchResults.results;
    }

    // Fetch additional details for ingredient-based search results
    if (searchType === 'ingredients' && searchResults.length > 0) {
      const recipeIds = searchResults.map(recipe => recipe.id).join(',');
      const bulkInfoUrl = new URL('https://api.spoonacular.com/recipes/informationBulk');
      bulkInfoUrl.searchParams.append('apiKey', spoonacularApiKey);
      bulkInfoUrl.searchParams.append('ids', recipeIds);
      bulkInfoUrl.searchParams.append('includeNutrition', 'true');

      const bulkInfoResponse = await fetch(bulkInfoUrl.toString());
      const bulkInfoResults = await bulkInfoResponse.json();

      searchResults = bulkInfoResults;
    }

    // Apply additional filtering for dietary preferences
    if (dietaryPreferences) {
      searchResults = searchResults.filter(recipe => {
        if (dietaryPreferences.halal) {
          const nonHalalIngredients = ['pork', 'alcohol', 'wine', 'beer', 'lard'];
          if (recipe.extendedIngredients.some(ingredient => 
            nonHalalIngredients.some(nonHalal => 
              ingredient.name.toLowerCase().includes(nonHalal)
            )
          )) return false;
        }
        // Add more dietary preference filters as needed
        return true;
      });
    }

    return NextResponse.json({ results: searchResults });
  } catch (error) {
    console.error('Error searching recipes:', error);
    return NextResponse.json({ error: 'Failed to search recipes' }, { status: 500 });
  }
}
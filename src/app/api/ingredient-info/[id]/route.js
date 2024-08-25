// app/api/ingredient-info/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.SPOONACULAR_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const weight = parseFloat(searchParams.get('weight')) || 100; // Default to 100g if not provided

  if (!id) {
    return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) throw error;

    // Make request to Spoonacular API
    const response = await fetch(
      `https://api.spoonacular.com/food/ingredients/${id}/information?apiKey=${API_KEY}&amount=${weight}&unit=grams`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch ingredient information');
    }

    const data = await response.json();

    // Extract and calculate nutritional information based on weight
    const ingredientInfo = {
      id: data.id,
      name: data.name,
      weight: weight,
      protein: data.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
      fat: data.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0,
      carbohydrates: data.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
      calories: data.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0
    };

    // Store in database (we're storing the per 100g values)
    const dbIngredientInfo = {
      ...ingredientInfo,
      protein: (ingredientInfo.protein * 100) / weight,
      fat: (ingredientInfo.fat * 100) / weight,
      carbohydrates: (ingredientInfo.carbohydrates * 100) / weight,
      calories: (ingredientInfo.calories * 100) / weight,
    };

    const { data: storedData, error: dbError } = await supabase
      .from('ingredients')
      .upsert(dbIngredientInfo, { onConflict: 'id' })
      .select();

    if (dbError) throw dbError;

    return NextResponse.json(ingredientInfo);
  } catch (error) {
    console.error('Error in ingredient info:', error);
    return NextResponse.json({ error: 'Failed to fetch and store ingredient information' }, { status: 500 });
  }
}
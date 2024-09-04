// src/app/api/add-food-entry/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { food_menu_id, recipe_id, meal_type, serving_size, calories, protein, fat, carbohydrates } = await req.json();

    let foodEntry;
    if (food_menu_id) {
      // Regular food item
      foodEntry = {
        user_id: user.id,
        food_menu_id: food_menu_id,
        meal_type: meal_type,
        serving_size: serving_size,
        calories: calories,
        protein: protein,
        fat: fat,
        carbohydrates: carbohydrates,
      };
    } else if (recipe_id) {
      // Recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipe_id)
        .single();

      if (recipeError) throw recipeError;

      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }

      const totalNutrition = recipe.ingredients.reduce((total, ingredient) => {
        total.calories += ingredient.calories;
        total.protein += ingredient.protein;
        total.fat += ingredient.fat;
        total.carbohydrates += ingredient.carbohydrates;
        return total;
      }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });

      foodEntry = {
        user_id: user.id,
        recipe_id: recipe_id,
        meal_type: meal_type,
        serving_size: serving_size,
        calories: totalNutrition.calories * serving_size,
        protein: totalNutrition.protein * serving_size,
        fat: totalNutrition.fat * serving_size,
        carbohydrates: totalNutrition.carbohydrates * serving_size,
      };
    } else {
      return NextResponse.json({ error: 'Invalid food entry data' }, { status: 400 });
    }

    // Insert the food entry
    const { data, error } = await supabase
      .from('user_food_entries')
      .insert(foodEntry)
      .select();

    if (error) throw error;

    return NextResponse.json({ message: 'Food entry added successfully', data });
  } catch (error) {
    console.error('Error adding food entry:', error);
    return NextResponse.json({ error: 'Failed to add food entry' }, { status: 500 });
  }
}
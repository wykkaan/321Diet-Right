import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.SPOONACULAR_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Food item ID is required' }, { status: 400 });
  }

  try {
    // Check if the food item already exists in our database
    let { data: foodItem, error: dbError } = await supabase
      .from('food_menu')
      .select('*')
      .eq('spoonacular_id', id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      throw dbError;
    }

    if (!foodItem) {
      // If not in our database, fetch from Spoonacular API
      const response = await fetch(
        `https://api.spoonacular.com/food/menuItems/${id}?apiKey=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch food item details');
      }

      const data = await response.json();

      // Insert the new food item into our database
      const { data: newFoodItem, error: insertError } = await supabase
        .from('food_menu')
        .insert({
          spoonacular_id: data.id,
          title: data.title,
          restaurant_chain: data.restaurantChain,
          calories: data.nutrition.calories,
          protein: data.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
          fat: data.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0,
          carbohydrates: data.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
          image_url: data.image
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      foodItem = newFoodItem;
    }

    return NextResponse.json(foodItem);
  } catch (error) {
    console.error('Error fetching or saving food item details:', error);
    return NextResponse.json({ error: 'Failed to fetch or save food item details' }, { status: 500 });
  }
}
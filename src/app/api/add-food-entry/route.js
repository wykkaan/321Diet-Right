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

    const { food_menu_id, meal_type, serving_size, calories, protein, fat, carbohydrates } = await req.json();

    // Insert the food entry
    const { data, error } = await supabase
      .from('user_food_entries')
      .insert({
        user_id: user.id,
        food_menu_id: food_menu_id,
        meal_type: meal_type,
        serving_size: serving_size,
        calories: calories,
        protein: protein,
        fat: fat,
        carbohydrates: carbohydrates,
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ message: 'Food entry added successfully', data });
  } catch (error) {
    console.error('Error adding food entry:', error);
    return NextResponse.json({ error: 'Failed to add food entry' }, { status: 500 });
  }
}
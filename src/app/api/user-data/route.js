import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req) {
  // Get the user's session from the request
  const { user } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch user data from the database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate macro goals based on target calories (this is a simple example, adjust as needed)
    const carbs_goal = Math.round((data.target_calories * 0.5) / 4); // 50% of calories from carbs
    const protein_goal = Math.round((data.target_calories * 0.3) / 4); // 30% of calories from protein
    const fats_goal = Math.round((data.target_calories * 0.2) / 9); // 20% of calories from fat

    // Add calculated macro goals to the user data
    const userData = {
      ...data,
      carbs_goal,
      protein_goal,
      fats_goal
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
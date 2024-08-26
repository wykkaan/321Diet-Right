// src\app\api\user-progress\route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
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

    // Fetch user's target calories and height
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('target_calories, height')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Fetch calorie data
    const { data: calorieData, error: calorieError } = await supabase
      .from('user_food_entries')
      .select('date, calories, protein, fat, carbohydrates')
      .eq('user_id', user.id)
      .gte('date', formattedDate)
      .order('date', { ascending: true });

    if (calorieError) throw calorieError;

    // Fetch weight data
    const { data: weightData, error: weightError } = await supabase
      .from('user_weight_entries')
      .select('date, weight')
      .eq('user_id', user.id)
      .gte('date', formattedDate)
      .order('date', { ascending: true });

    if (weightError) throw weightError;

    // Process calorie data
    const processedCalorieData = processDataForChart(calorieData, ['calories', 'protein', 'fat', 'carbohydrates']);

    // Process weight data
    const processedWeightData = processDataForChart(weightData, ['weight']);

    return NextResponse.json({
      calorieData: processedCalorieData,
      weightData: processedWeightData,
      targetCalories: userData.target_calories,
      height: userData.height
    });
  } catch (error) {
    console.error('Error fetching user progress data:', error);
    return NextResponse.json({ error: 'Failed to fetch user progress data' }, { status: 403 });
  }
}


function processDataForChart(data, keys) {
  const today = new Date();
  const result = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const formattedDate = date.toISOString().split('T')[0];

    const entry = data.find(item => item.date === formattedDate);
    const dataPoint = { date: formattedDate };
    keys.forEach(key => {
      dataPoint[key] = entry ? entry[key] : null;
    });
    result.push(dataPoint);
  }

  return result;
}
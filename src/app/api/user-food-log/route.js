// src\app\api\user-food-log\route.js
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const { data, error: logError } = await supabase
      .from('user_food_entries')
      .select(`
        *,
        food_menu (
          title,
          restaurant_chain
        )
      `)
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (logError) throw logError;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching food log:', error);
    return NextResponse.json({ error: 'Failed to fetch food log' }, { status: 403 });
  }
}
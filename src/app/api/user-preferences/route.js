// src\app\api\user-preferences\route.js
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

    // Fetch dietary preferences
    const { data, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('dietary_preferences')
      .eq('user_id', user.id)
      .single();

    // If no preferences found, return an empty object
    if (preferencesError && preferencesError.code === 'PGRST116') {
      return NextResponse.json({ dietary_preferences: {} });
    }

    // If there's any other error, throw it
    if (preferencesError) throw preferencesError;

    // Return the preferences, or an empty object if data is null
    return NextResponse.json({ dietary_preferences: data?.dietary_preferences || {} });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences', details: error.message }, { status: 500 });
  }
}

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

    const { dietary_preferences } = await request.json();

    // Use upsert to either update existing preferences or create new ones
    const { data, error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({ 
        user_id: user.id, 
        dietary_preferences: dietary_preferences || {}  // Ensure we always have an object
      }, 
      { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ message: 'Preferences saved successfully' });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json({ error: 'Failed to save user preferences', details: error.message }, { status: 500 });
  }
}
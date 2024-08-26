// src\app\api\ingredient-autocomplete\route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.SPOONACULAR_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
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
      `https://api.spoonacular.com/food/ingredients/autocomplete?apiKey=${API_KEY}&query=${query}&number=5&metaInformation=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch ingredient suggestions');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in ingredient autocomplete:', error);
    return NextResponse.json({ error: 'Failed to fetch ingredient suggestions' }, { status: 500 });
  }
}
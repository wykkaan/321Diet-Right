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

    const { data, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id);

    if (favoritesError) throw favoritesError;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
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

    const { 
      recipe_id, 
      recipe_title, 
      recipe_image, 
      ready_in_minutes, 
      servings, 
      calories, 
      protein, 
      fat, 
      carbs 
    } = await request.json();

    const { data, error: insertError } = await supabase
      .from('user_favorites')
      .insert({ 
        user_id: user.id,
        recipe_id,
        recipe_title,
        recipe_image,
        ready_in_minutes,
        servings,
        calories,
        protein,
        fat,
        carbs
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request) {
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

    const { recipe_id } = await request.json();

    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipe_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
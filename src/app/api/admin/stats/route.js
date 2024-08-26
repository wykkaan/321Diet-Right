import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverCheckAdminStatus } from '@/utils/serverCheckAdmin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const isAdmin = await serverCheckAdminStatus(token);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    // Fetch stats
    const { data: totalUsers, error: userError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gt('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: totalRecipes, error: recipeError } = await supabase
      .from('recipes')
      .select('id', { count: 'exact' });

    const { data: totalFoodEntries, error: foodError } = await supabase
      .from('user_food_entries')
      .select('id', { count: 'exact' });

    if (userError || activeError || recipeError || foodError) {
      throw new Error('Error fetching stats');
    }

    return NextResponse.json({
      totalUsers: totalUsers.length,
      activeUsers: activeUsers.length,
      totalRecipes: totalRecipes.length,
      totalFoodEntries: totalFoodEntries.length
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
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

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('starting_weight, target_weight')
      .eq('id', user.id)
      .single();
    if (userError) throw userError;

    // Fetch latest weight entry
    const { data: latestWeight, error: weightError } = await supabase
      .from('user_weight_entries')
      .select('weight')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    if (weightError && weightError.code !== 'PGRST116') throw weightError;

    return NextResponse.json({
      startingWeight: userData.starting_weight,
      currentWeight: latestWeight ? latestWeight.weight : null,
      targetWeight: userData.target_weight
    });
  } catch (error) {
    console.error('Error fetching user goal data:', error);
    return NextResponse.json({ error: 'Failed to fetch user goal data' }, { status: 403 });
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

    const { startingWeight, currentWeight, targetWeight } = await request.json();

    // Update user data
    const { error: updateError } = await supabase
      .from('users')
      .update({ starting_weight: startingWeight, target_weight: targetWeight })
      .eq('id', user.id);
    if (updateError) throw updateError;

    // Add new weight entry
    if (currentWeight) {
      const { error: weightError } = await supabase
        .from('user_weight_entries')
        .insert({ user_id: user.id, weight: currentWeight, date: new Date().toISOString().split('T')[0] });
      if (weightError) throw weightError;
    }

    return NextResponse.json({ message: 'Goal updated successfully' });
  } catch (error) {
    console.error('Error updating user goal data:', error);
    return NextResponse.json({ error: 'Failed to update user goal data' }, { status: 403 });
  }
}
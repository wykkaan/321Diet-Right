// src/app/api/check-subscription/route.js
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    // Fetch the user's most recent subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') throw subscriptionError;

    // Check if the subscription is active and not expired
    const isActive = subscription && 
                     subscription.status === 'active' && 
                     new Date(subscription.current_period_end) > new Date();

    return NextResponse.json({ isActive });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 });
  }
}
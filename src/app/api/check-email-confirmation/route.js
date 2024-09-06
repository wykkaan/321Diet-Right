import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ message: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (user.email_confirmed_at) {
      // Check if user has completed onboarding
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (userDataError) throw userDataError;

      return NextResponse.json({ 
        message: 'Email confirmed', 
        onboardingCompleted: userData.onboarding_completed 
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Email not confirmed' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error checking email confirmation:', error);
    return NextResponse.json({ message: 'Failed to check email confirmation' }, { status: 500 });
  }
}
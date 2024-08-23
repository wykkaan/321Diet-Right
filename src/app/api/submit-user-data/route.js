import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userData = await req.json();

    // Insert or update the data in the users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        ...userData
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ message: 'User data submitted successfully', data });
  } catch (error) {
    console.error('Error submitting user data:', error);
    return NextResponse.json({ error: 'Failed to submit user data' }, { status: 500 });
  }
}
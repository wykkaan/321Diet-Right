// app/api/seller/auth/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request) {
  const { email, password } = await request.json();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check if the user is a seller
    const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .select('role')
        .eq('role', 'seller');
        
    if (sellerError) throw new Error('Not authorized as a seller');

    return NextResponse.json({ user: data.user, seller: sellerData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
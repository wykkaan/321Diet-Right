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
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, is_admin');

    if (error) throw error;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
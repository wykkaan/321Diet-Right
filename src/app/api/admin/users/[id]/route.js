import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverCheckAdminStatus } from '@/utils/serverCheckAdmin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function handleRequest(request, params, method) {
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

  const { id } = params;

  try {
    let result;
    switch (method) {
      case 'GET':
        result = await supabase.from('users').select('*').eq('id', id).single();
        break;
      case 'PUT':
        const userData = await request.json();
        result = await supabase.from('users').update(userData).eq('id', id);
        break;
      case 'DELETE':
        result = await supabase.from('users').delete().eq('id', id);
        break;
    }

    if (result.error) throw result.error;

    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`Error ${method} user:`, error);
    return NextResponse.json({ error: `Failed to ${method.toLowerCase()} user` }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  return handleRequest(request, params, 'GET');
}

export async function PUT(request, { params }) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(request, { params }) {
  return handleRequest(request, params, 'DELETE');
}
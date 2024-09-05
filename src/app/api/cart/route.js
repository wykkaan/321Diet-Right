import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createSupabaseClient(token);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cart')
      .select('*, products(*)')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request) {
    const { productId, quantity } = await request.json();
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
  
    const token = authHeader.split(' ')[1];
    const supabase = createSupabaseClient(token);
  
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
  
      // First, check if the item already exists in the cart
      const { data: existingItem, error: fetchError } = await supabase
        .from('cart')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
      let result;
      if (existingItem) {
        // If the item exists, update the quantity
        const newQuantity = existingItem.quantity + quantity;
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .select();
        
        if (error) throw error;
        result = data[0];
      } else {
        // If the item doesn't exist, insert a new row
        const { data, error } = await supabase
          .from('cart')
          .insert({ user_id: user.id, product_id: productId, quantity })
          .select();
        
        if (error) throw error;
        result = data[0];
      }
  
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error adding to cart:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  
export async function PUT(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createSupabaseClient(token);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { productId, quantity } = await request.json();

    const { data, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createSupabaseClient(token);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { productId } = await request.json();

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}
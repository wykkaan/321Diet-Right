// app/api/seller/orders/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');

  if (!sellerId) {
    return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
  }

  try {
    // First, get all product IDs for the seller
    const { data: sellerProducts, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);

    if (productError) throw productError;

    const sellerProductIds = sellerProducts.map(product => product.id);

    // Then, fetch orders that contain these products
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(
          *,
          products!inner(*)
        )
      `)
      .in('order_items.product_id', sellerProductIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const { orderId, newStatus } = await request.json();

  const validStatuses = ['shipped', 'cancelled', 'preparing', 'transferred to delivery partner', 'delivering', 'delivered'];

  if (!orderId || !newStatus) {
    return NextResponse.json({ error: 'Order ID and new status are required' }, { status: 400 });
  }

  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
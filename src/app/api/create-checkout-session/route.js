// app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

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
    const { data: { user } } = await supabase.auth.getUser();
    const { items } = await request.json();

    // Fetch full product details for each item in the cart
    const cartItemsWithDetails = await Promise.all(items.map(async (item) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (error) throw error;
      return { ...item, product: data };
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItemsWithDetails.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
          },
          unit_amount: Math.round(item.product.price * 100), // Convert to cents and ensure it's an integer
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${BASE_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/shop/cart`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        cart_items: JSON.stringify(cartItemsWithDetails.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price
        })))
      }
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session', details: error.message }, { status: 500 });
  }
}
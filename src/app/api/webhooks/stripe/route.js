// src/app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      
        case 'checkout.session.completed':
          const session = event.data.object;
          
          // Parse the cart items from the metadata
          const cartItems = JSON.parse(session.metadata.cart_items || '[]');
          
          // Create order in database
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: session.metadata.user_id,
              status: 'paid',
              total_price: session.amount_total / 100, // Convert from cents to dollars
              stripe_session_id: session.id,
            })
            .select()
            .single();
  
          if (orderError) throw orderError;
  
          // Create order items and update inventory
          if (cartItems.length > 0) {
            for (const item of cartItems) {
              // Insert order item
              const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                  order_id: order.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: item.price,
                });
  
              if (itemError) throw itemError;
  
              // Update product inventory
              const { error: inventoryError } = await supabase.rpc('update_product_inventory', {
                p_id: item.product_id,
                quantity_sold: item.quantity
              });
  
              if (inventoryError) throw inventoryError;
            }
          }
  
          // Clear the user's cart
          await supabase
            .from('cart')
            .delete()
            .eq('user_id', session.metadata.user_id);
  
          console.log(`Order created successfully for session ${session.id}`);
          break;
  
        case 'payment_intent.succeeded':
        case 'payment_intent.created':
        case 'charge.succeeded':
        case 'charge.updated':
          // Log these events, but no action needed
          console.log(`Received event ${event.type}`);
          break;
  
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
  
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
  }
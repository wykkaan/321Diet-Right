'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        calculateTotal(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const calculateTotal = (cartItems) => {
    const sum = cartItems.reduce((acc, item) => {
      const price = parseFloat(item.products?.price) || 0;
      return acc + (price * item.quantity);
    }, 0);
    setTotal(sum);
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const token = await getToken();
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: newQuantity })
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: cart })
      });
      const session = await response.json();
      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });
      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.products?.name || 'Unknown Product'}</h3>
                <p>${(parseFloat(item.products?.price) || 0).toFixed(2)}</p>
              </div>
              <div className="flex items-center">
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="px-2 py-1 bg-[#3C4E2A] text-[#F5E9D4] rounded">-</button>
                <span className="mx-2">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="px-2 py-1 bg-[#3C4E2A] text-[#F5E9D4] rounded">+</button>
                <button onClick={() => removeFromCart(item.product_id)} className="ml-4 text-red-500">Remove</button>
              </div>
            </div>
          ))}
          
          <div className="mt-4">
            <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
            <button
              onClick={handleCheckout}
              className="mt-4 w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
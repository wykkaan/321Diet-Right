'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function SuccessPage() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchSession = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setError('No session ID found');
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`/api/checkout-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          throw new Error('Failed to fetch session');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError(error.message);
      }
    };

    fetchSession();
  }, [getToken, searchParams]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
      <p>Your order has been processed successfully.</p>
      <p>Order total: ${(session.amount_total / 100).toFixed(2)}</p>
      <button 
        onClick={() => router.push('/shop')}
        className="mt-4 bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded"
      >
        Continue Shopping
      </button>
    </div>
  );
}
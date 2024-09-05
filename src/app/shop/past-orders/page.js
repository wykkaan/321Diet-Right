'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

const PastOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">Past Orders</h1>
      
      {orders.length === 0 ? (
        <p>You haven&apos;t placed any orders yet.</p>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow mb-4">
              <h3 className="font-semibold">Order #{order.id}</h3>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <p>Status: {order.status}</p>
              <p>Total: ${order.total_price.toFixed(2)}</p>
              <h4 className="font-semibold mt-2">Items:</h4>
              <ul>
                {order.items.map(item => (
                  <li key={item.id}>
                    {item.name} - Quantity: {item.quantity} - ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastOrdersPage;
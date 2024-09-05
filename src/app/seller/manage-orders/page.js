'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const validStatuses = ['shipped', 'cancelled', 'preparing', 'transferred to delivery partner', 'delivering', 'delivered'];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const sellerData = JSON.parse(localStorage.getItem('seller_data'));
    if (!sellerData || !sellerData.user.id) {
      router.push('/seller/login');
      return;
    }
    fetchOrders(sellerData.user.id);
  }, []);

  const fetchOrders = async (sellerId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/orders?sellerId=${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch('/api/seller/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      
      // Refresh the orders after updating
      const sellerData = JSON.parse(localStorage.getItem('seller_data'));
      await fetchOrders(sellerData.user.id);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-bold">Order #{order.id}</h2>
            <p>Status: {order.status}</p>
            <p>Total: ${order.total_price}</p>
            <h3 className="font-semibold mt-2">Items:</h3>
            <ul>
              {order.order_items.map((item) => (
                <li key={item.id}>
                  {item.products.name} - Quantity: {item.quantity}
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                className="p-2 border rounded"
              >
                {validStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
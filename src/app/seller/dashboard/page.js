'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const sellerData = JSON.parse(localStorage.getItem('seller_data'));
    if (!sellerData || !sellerData.user.id) {
      router.push('/seller/login');
      return;
    }
    fetchProducts(sellerData.user.id);
  }, []);

  const fetchProducts = async (sellerId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/products?sellerId=${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] p-4">
      <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>
      <div className="mb-4">
        <input type="text" placeholder="Search products..." className="w-full p-2 border rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow">
            <Image src={product.image_url} alt={product.name} width={200} height={200} className="w-full h-40 object-cover mb-2" />
            <h2 className="font-bold">{product.name}</h2>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <p>${product.price}</p>
            <p>Inventory: {product.inventory_count}</p>
            <p>Status: {product.is_available ? 'Available' : 'Suspended'}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col space-y-2">
        <button 
          onClick={() => router.push('/seller/manage-products')}
          className="bg-[#3C4E2A] text-white p-2 rounded"
        >
          Manage Products
        </button>
        <button 
          onClick={() => router.push('/seller/manage-orders')}
          className="bg-[#3C4E2A] text-white p-2 rounded"
        >
          Manage Orders
        </button>
      </div>
    </div>
  );
}
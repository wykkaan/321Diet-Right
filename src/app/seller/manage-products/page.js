'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
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

  const handleDeleteSuspend = async (productId, action) => {
    try {
      const sellerData = JSON.parse(localStorage.getItem('seller_data'));
      const response = await fetch('/api/seller/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: productId, 
          sellerId: sellerData.user.id, 
          action,
          is_available: action === 'activate'
        }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} product`);
      fetchProducts(sellerData.user.id);
    } catch (error) {
      console.error(`Error ${action}ing product:`, error);
      setError(error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = async () => {
    try {
      const sellerData = JSON.parse(localStorage.getItem('seller_data'));
      const response = await fetch('/api/seller/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          sellerId: sellerData.user.id,
          action: 'update',
          ...editingProduct
        }),
      });
      if (!response.ok) throw new Error('Failed to update product');
      fetchProducts(sellerData.user.id);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>
      <div className="mb-4">
        <input type="text" placeholder="Search products..." className="w-full p-2 border rounded" />
      </div>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        products.map((product) => (
          <div key={product.id} className="flex items-center bg-white p-4 rounded-lg shadow mb-4">
            <div className="w-20 h-20 relative mr-4">
              <Image
                src={product.image_url}
                alt={product.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-grow">
              <h2 className="font-bold">{product.name}</h2>
              <p className="text-sm text-gray-600">{product.description}</p>
              <p>${product.price}</p>
              <p>Category: {product.category}</p>
              <p>Inventory: {product.inventory_count}</p>
              <p>Status: {product.is_available ? 'Available' : 'Suspended'}</p>
            </div>
            <div className="flex flex-col space-y-2">
  <button 
    onClick={() => handleEdit(product)}
    className="bg-blue-500 text-white p-2 rounded w-full"
  >
    Edit
  </button>
  <button 
    onClick={() => handleDeleteSuspend(product.id, 'delete')}
    className="bg-red-500 text-white p-2 rounded w-full"
  >
    Delete
  </button>
  <button 
    onClick={() => handleDeleteSuspend(product.id, product.is_available ? 'suspend' : 'activate')}
    className={`${product.is_available ? 'bg-yellow' : 'bg-green-500'} text-white p-2 rounded w-full`}
  >
    {product.is_available ? 'Suspend' : 'Activate'}
  </button>
</div>
          </div>
        ))
      )}
      <button 
        onClick={() => router.push('/seller/add-product')}
        className="fixed bottom-4 right-4 bg-[#3C4E2A] text-white p-4 rounded-full"
      >
        Add Meal
      </button>

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1" htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1" htmlFor="description">Description</label>
              <textarea
                id="description"
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1" htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1" htmlFor="inventory">Inventory Count</label>
              <input
                id="inventory"
                type="number"
                value={editingProduct.inventory_count}
                onChange={(e) => setEditingProduct({...editingProduct, inventory_count: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1" htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setEditingProduct(null)}
                className="bg-gray-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
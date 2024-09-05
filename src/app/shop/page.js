'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const { getToken } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchUserPreferences();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDietaryPreferences(data.dietary_preferences || {});
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const addToCart = async (productId) => {
    setAddingToCart(prev => ({ ...prev, [productId]: true }));
    try {
      const token = await getToken();
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      // You might want to show a success message here
      console.log('Added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
      // You might want to show an error message here
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const handleFilterChange = (preference) => {
    const updatedPreferences = { ...dietaryPreferences, [preference]: !dietaryPreferences[preference] };
    setDietaryPreferences(updatedPreferences);
    filterProducts(updatedPreferences);
  };

  const filterProducts = (preferences) => {
    const filtered = products.filter(product => {
      return Object.entries(preferences).every(([key, value]) => {
        if (!value) return true; // If the preference is not selected, don't filter by it
        return product[key] === value;
      });
    });
    setFilteredProducts(filtered);
  };

return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">Meal Shop</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full p-2 border border-[#3C4E2A] rounded"
        />
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Filter by Dietary Preference</h2>
        <div className="flex flex-wrap gap-2">
          {['vegetarian', 'vegan', 'gluten_free', 'dairy_free'].map(pref => (
            <button
              key={pref}
              onClick={() => handleFilterChange(pref)}
              className={`px-3 py-1 rounded ${dietaryPreferences[pref] ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-[#F5E9D4] border border-[#3C4E2A]'}`}
            >
              {pref.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow">
            <div className="relative w-full h-40 mb-2">
              <Image 
                src={product.image_url} 
                alt={product.name} 
                layout="fill"
                objectFit="cover"
                className="rounded"
              />
            </div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm mb-2">{product.description}</p>
            <p className="font-bold">${product.price.toFixed(2)}</p>
            <button 
              onClick={() => addToCart(product.id)}
              disabled={addingToCart[product.id]}
              className="mt-2 w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded disabled:opacity-50"
            >
              {addingToCart[product.id] ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="fixed bottom-16 left-0 right-0 bg-[#3C4E2A] text-[#F5E9D4] p-4 flex justify-between">
        <Link href="/shop/past-orders" className="font-semibold">Past Orders</Link>
        <Link href="/shop/cart" className="font-semibold">Cart</Link>
      </div>
    </div>
  );
}

export default ShopPage;
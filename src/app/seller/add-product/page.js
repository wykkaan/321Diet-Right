'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('');
  const [inventoryCount, setInventoryCount] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const router = useRouter();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('seller_id', JSON.parse(localStorage.getItem('seller_data')).user.id);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('inventory_count', inventoryCount);
      formData.append('is_available', isAvailable);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to add product');

      router.push('/seller/manage-products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E9D4] p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Inventory Count"
          value={inventoryCount}
          onChange={(e) => setInventoryCount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="mr-2"
          />
          <label>Is Available</label>
        </div>
        <button type="submit" className="w-full bg-[#3C4E2A] text-white p-2 rounded">
          Add Product
        </button>
      </form>
    </div>
  );
}
// src/app/image-recognition/page.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';

const ImageRecognitionPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { getToken } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const token = await getToken();
      const response = await fetch('/api/image-recognition', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <h1 className="text-2xl font-bold mb-4">Food Recognition</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="image-upload" className="block mb-2">
            Take a photo or upload an image of food:
          </label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="w-full p-2 border border-[#3C4E2A] rounded"
          />
        </div>
        
        {previewUrl && (
          <div className="mb-4">
            <Image 
              src={previewUrl} 
              alt="Preview" 
              width={300} 
              height={300} 
              className="max-w-full h-auto rounded"
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={!selectedImage || isLoading}
          className="w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <div>
          <h2 className="text-xl font-bold mb-2">Detected Food Items:</h2>
          <ul className="mb-4">
            {results.foodItems.map((item, index) => (
              <li key={index} className="bg-white p-2 rounded shadow mb-2">
                <span className="font-semibold">{item.description}</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-[#3C4E2A] h-2.5 rounded-full" 
                    style={{ width: `${item.score * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {(item.score * 100).toFixed(0)}% confidence
                </span>
              </li>
            ))}
          </ul>

          {results.nutritionInfo && (
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-bold mb-2">Estimated Nutrition (for top item):</h3>
              <p><strong>Calories:</strong> {results.nutritionInfo.calories.value} {results.nutritionInfo.calories.unit}</p>
              <p><strong>Protein:</strong> {results.nutritionInfo.protein.value} {results.nutritionInfo.protein.unit}</p>
              <p><strong>Fat:</strong> {results.nutritionInfo.fat.value} {results.nutritionInfo.fat.unit}</p>
              <p><strong>Carbs:</strong> {results.nutritionInfo.carbs.value} {results.nutritionInfo.carbs.unit}</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="mt-4 w-full bg-[#008080] text-[#F5E9D4] py-2 rounded-lg font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default ImageRecognitionPage;
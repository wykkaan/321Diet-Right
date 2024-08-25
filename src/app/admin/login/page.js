// src/app/admin/login/page.js
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user, error } = await signIn(email, password);
      if (error) throw error;
      
      // Check if the user is an admin
      const response = await fetch('/api/check-admin', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      const { isAdmin } = await response.json();
      
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        setError('You do not have admin privileges.');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user && isAdmin) {
    return null; // This will be briefly shown before the useEffect redirects
  }

  return (
    <div className="min-h-screen bg-[#F5E9D4] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#3C4E2A] text-white py-2 px-4 rounded-md hover:bg-[#2A3E1A] transition-colors"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
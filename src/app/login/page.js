// src\app\login\page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, supabase } from '@/lib/auth'

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user } = await signIn(email, password);
      
      // Check if user needs to complete onboarding
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        router.push('/onboarding/begin');
        return;
      }

      // Check for missing fields
      const requiredFields = ['username', 'goal', 'gender', 'age', 'height', 'weight', 'target_calories']
      const missingFields = requiredFields.filter(field => !profile[field])

      if (missingFields.length > 0) {
        router.push('/onboarding/begin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <main className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center drop-shadow-md">Welcome Back!</h1>
        
        <form onSubmit={handleSubmit} className="bg-[#3C4E2A] rounded-3xl p-8 shadow-lg">
          <div className="mb-4">
            <label htmlFor="email" className="block text-[#F5E9D4] mb-2">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-[#F5E9D4] text-[#3C4E2A]"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-[#F5E9D4] mb-2">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-[#F5E9D4] text-[#3C4E2A]"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#F5E9D4] text-[#3C4E2A] py-2 px-4 rounded-full font-semibold hover:bg-[#E5D9C4] transition-colors"
          >
            Login
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
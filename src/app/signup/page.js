'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth';

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        try {
            await signUp(email, password, username);
            router.push('/login');
        } catch (error) {
            setError(error.message);
        }
    };
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
        <main className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-8 text-center drop-shadow-md">Create Account</h1>
          
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
            <div className="mb-4">
              <label htmlFor="username" className="block text-[#F5E9D4] mb-2">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded bg-[#F5E9D4] text-[#3C4E2A]"
                required
              />
            </div>
            <div className="mb-4">
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
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-[#F5E9D4] mb-2">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 rounded bg-[#F5E9D4] text-[#3C4E2A]"
                required
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#F5E9D4] text-[#3C4E2A] py-2 px-4 rounded-full font-semibold hover:bg-[#E5D9C4] transition-colors"
            >
              Sign Up
            </button>
          </form>
        </main>
      </div>
    );
  };
  
  export default SignUpPage;
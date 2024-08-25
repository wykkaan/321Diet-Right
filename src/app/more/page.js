'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/user-data', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No user data available</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] flex flex-col">
      <div className="flex-grow p-4">
        <h1 className="text-2xl font-bold mb-4">Hello, {userData.username}!</h1>
        
        <div className="bg-[#FF7F50] text-white p-4 rounded-lg mb-4">
          <h2 className="text-lg">Current Goal</h2>
          <p className="text-2xl font-bold">{userData.goal.toUpperCase()}</p>
        </div>
        
        <button onClick={() => router.push('/progress')} className="w-full bg-[#F5E9D4] border border-[#3C4E2A] text-[#3C4E2A] py-3 rounded-lg font-semibold mb-4">
          Progress
        </button>
        
        <button onClick={() => router.push('/goals')} className="w-full bg-[#F5E9D4] border border-[#3C4E2A] text-[#3C4E2A] py-3 rounded-lg font-semibold mb-4">
          Goals
        </button>
        
        <button onClick={() => router.push('/my-recipes')} className="w-full bg-[#F5E9D4] border border-[#3C4E2A] text-[#3C4E2A] py-3 rounded-lg font-semibold mb-4">
          My Recipes
        </button>
        
        <button onClick={() => router.push('/search-recipes')} className="w-full bg-[#F5E9D4] border border-[#3C4E2A] text-[#3C4E2A] py-3 rounded-lg font-semibold mb-4">
          Search Recipes
        </button>
        
        <button onClick={() => router.push('/profile')} className="w-full bg-[#F5E9D4] border border-[#3C4E2A] text-[#3C4E2A] py-3 rounded-lg font-semibold mb-4">
          My Profile
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
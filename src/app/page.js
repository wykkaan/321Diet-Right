'use client'

import React from 'react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3C4E2A] text-[#F5E9D4] p-4">
      <main className="w-full max-w-md flex flex-col items-center">
        <h1 className="text-5xl font-bold mb-4 text-center">
          DIET
          <br />
          RIGHT
        </h1>
        
        <Link href="/signup" className="mb-4 w-full">
          <button className="w-full bg-[#F5E9D4] text-[#3C4E2A] py-3 px-6 rounded-full font-semibold text-lg hover:bg-[#E5D9C4] transition-colors">
            Sign up for free
          </button>
        </Link>
        
        <Link href="/login" className="text-[#F5E9D4] hover:underline">
          Login
        </Link>
      </main>
    </div>
  );
};

export default LandingPage;
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkEmailConfirmation, resendConfirmationEmail, getCurrentUser } from '@/lib/auth';

export default function EmailConfirmationPendingPage() {
  const [resendEmailSent, setResendEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser?.email_confirmed_at) {
          router.push('/onboarding/begin');
        }
      } catch (err) {
        console.error('Error checking user:', err);
        setError('Unable to verify user status. Please try logging in again.');
      }
    };

    checkUser();
  }, [router]);

  const handleResendConfirmationEmail = async () => {
    try {
      await resendConfirmationEmail();
      setResendEmailSent(true);
    } catch (err) {
      console.error('Error resending confirmation email:', err);
      setError(err.message);
    }
  };

  const handleCheckConfirmation = async () => {
    try {
      const isConfirmed = await checkEmailConfirmation();
      if (isConfirmed) {
        router.push('/onboarding/begin');
      } else {
        setError('Email not confirmed yet. Please check your inbox and confirm your email.');
      }
    } catch (err) {
      console.error('Error checking email confirmation:', err);
      setError(err.message);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[#F5E9D4] flex items-center justify-center">
      <p className="text-[#3C4E2A]">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#F5E9D4] flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-[#3C4E2A]">Email Confirmation Pending</h1>
      <p className="text-lg mb-6 text-center">
        Please check your email and click the confirmation link to activate your account.
      </p>
      {!resendEmailSent ? (
        <button
          onClick={handleResendConfirmationEmail}
          className="bg-[#3C4E2A] text-[#F5E9D4] px-6 py-2 rounded-full hover:bg-[#2A3E1A] transition-colors mb-4"
        >
          Resend Confirmation Email
        </button>
      ) : (
        <p className="text-green-600 mb-4">Confirmation email resent. Please check your inbox.</p>
      )}
      <button
        onClick={handleCheckConfirmation}
        className="bg-[#008080] text-[#F5E9D4] px-6 py-2 rounded-full hover:bg-[#006666] transition-colors"
      >
        I&apos;ve Confirmed My Email
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
// src\app\profile\page.js
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    height: '',
    gender: '',
    dob: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const router = useRouter();
  const { user, getToken } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        setIsEditing(false);
      } else {
        console.error('Failed to update user data');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handlePasswordChange = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });
      if (response.ok) {
        setNewPassword('');
        alert('Password changed successfully');
      } else {
        console.error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] p-4">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {Object.entries(userData).map(([key, value]) => (
          <div key={key} className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              type="text"
              id={key}
              name={key}
              value={value}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full p-2 bg-[#E5D9C4] rounded"
            />
          </div>
        ))}
        {isEditing ? (
          <button type="submit" className="w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold mb-4">
            Save Changes
          </button>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-[#3C4E2A] text-[#F5E9D4] py-2 rounded-lg font-semibold mb-4">
            Edit Profile
          </button>
        )}
      </form>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Change Password</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full p-2 bg-[#E5D9C4] rounded mb-2"
        />
        <button onClick={handlePasswordChange} className="w-full bg-[#008080] text-[#F5E9D4] py-2 rounded-lg font-semibold">
          Change Password
        </button>
      </div>

      <div>
        <button onClick={() => setShowDeleteConfirmation(true)} className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold">
          Delete My Account
        </button>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <p className="mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="flex justify-end">
              <button onClick={() => setShowDeleteConfirmation(false)} className="mr-2 px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500 text-white rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
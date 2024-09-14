// src\app\progress\page.js
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const ProgressPage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Theme colors
  const colors = {
    background: '#F5E9D4',
    text: '#3C4E2A',
    primary: '#3C4E2A',
    secondary: '#FF7F50',
    tertiary: '#008080',
    chart: {
      calories: '#3C4E2A',
      protein: '#FF7F50',
      fat: '#008080',
      carbs: '#FFA500',
      weight: '#4CAF50',
      bmi: '#9C27B0',
      target: '#FF0000'
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/user-progress', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user progress data');
        }

        const data = await response.json();
        
        // Fill in missing weight data
        data.weightData = fillMissingWeightData(data.weightData);
        
        // Calculate BMI data
        data.bmiData = calculateBMIData(data.weightData, data.height);
        
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user progress data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fillMissingWeightData = (weightData) => {
    const filledData = [];
    let lastKnownWeight = null;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const currentDate = d.toISOString().split('T')[0];
      const existingEntry = weightData.find(entry => entry.date === currentDate);

      if (existingEntry) {
        filledData.push(existingEntry);
        if (existingEntry.weight !== null) {
          lastKnownWeight = existingEntry.weight;
        }
      } else {
        filledData.push({
          date: currentDate,
          weight: lastKnownWeight
        });
      }
    }

    return filledData;
  };

  const calculateBMIData = (weightData, height) => {
    if (!height || !weightData || weightData.length === 0) return [];
    const heightInMeters = height / 100; // Assuming height is in cm
    return weightData.map(entry => ({
      date: entry.date,
      bmi: entry.weight ? parseFloat((entry.weight / (heightInMeters * heightInMeters)).toFixed(1)) : null
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: colors.background, padding: '10px', border: `1px solid ${colors.primary}` }}>
          <p className="label">{`Date: ${label}`}</p>
          {payload.map((pld) => (
            <p key={pld.name} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value}`}
            </p>
          ))}
          {userData.targetCalories && payload[0].name === 'Calories' && (
            <p style={{ color: colors.chart.target }}>
              {`Target: ${userData.targetCalories}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getYAxisDomain = (dataKey, factor = 1.1) => {
    if (!userData || !userData[dataKey]) return [0, 'auto'];
    let values = userData[dataKey].map(d => d[dataKey.replace('Data', '')] || 0);
    if (dataKey === 'calorieData') {
      values.push(userData.targetCalories); // Include target calories in the calculation
    }
    const max = Math.max(...values);
    const upperBound = max * factor;
    return [0, Math.ceil(upperBound / 100) * 100];
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5E9D4] text-[#3C4E2A]">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#F5E9D4] text-[#3C4E2A]">Error: {error}</div>;
  if (!userData) return <div className="min-h-screen flex items-center justify-center bg-[#F5E9D4] text-[#3C4E2A]">No user progress data available</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">Current Diet Progress</h1>

      <div className="mb-4">
        <h2 className="text-xl mb-2">31 Day Outlook (Kcal graph)</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userData.calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.text} opacity={0.1} />
              <XAxis dataKey="date" stroke={colors.text} />
              <YAxis domain={getYAxisDomain('calorieData')} stroke={colors.text} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke={colors.chart.calories} name="Calories" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="protein" stroke={colors.chart.protein} name="Protein" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fat" stroke={colors.chart.fat} name="Fat" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="carbohydrates" stroke={colors.chart.carbs} name="Carbs" strokeWidth={2} dot={false} />
              <ReferenceLine 
                y={userData.targetCalories} 
                label={{ 
                  value: 'Target', 
                  position: 'insideTopRight', 
                  fill: colors.chart.target,
                  fontSize: 12,
                  fontWeight: 'bold'
                }} 
                stroke={colors.chart.target} 
                strokeDasharray="3 3" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl mb-2">31 Day Outlook (Weight graph)</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userData.weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.text} opacity={0.1} />
              <XAxis dataKey="date" stroke={colors.text} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={colors.text} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke={colors.chart.weight} 
                name="Weight" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="mb-4">
        <h2 className="text-xl mb-2">31 Day Outlook (BMI graph)</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userData.bmiData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.text} opacity={0.1} />
              <XAxis dataKey="date" stroke={colors.text} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={colors.text} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="bmi" stroke={colors.chart.bmi} name="BMI" strokeWidth={2} dot={true} />
              <ReferenceLine y={18.5} label="Underweight" stroke="#2196F3" strokeDasharray="3 3" />
              <ReferenceLine y={24.9} label="Normal" stroke="#4CAF50" strokeDasharray="3 3" />
              <ReferenceLine y={29.9} label="Overweight" stroke="#FFC107" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button 
        onClick={() => router.push('/profile')}
        className="mt-4 w-full bg-[#3C4E2A] text-[#F5E9D4] py-3 rounded-lg font-semibold hover:bg-[#2A3E1A] transition-colors"
      >
        Back to Profile
      </button>
    </div>
  );
};

export default ProgressPage;
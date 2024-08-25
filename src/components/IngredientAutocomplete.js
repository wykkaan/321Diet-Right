'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/auth';

const IngredientAutocomplete = ({ onIngredientSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weight, setWeight] = useState(100);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch(`/api/ingredient-autocomplete?query=${query}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = async (ingredient) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/ingredient-info/${ingredient.id}?weight=${weight}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ingredient info');
      }

      const data = await response.json();
      onIngredientSelect({...data, weight});
      setQuery('');
      setSuggestions([]);
      setWeight(100); // Reset weight to default after selection
    } catch (err) {
      console.error('Error fetching ingredient info:', err);
      setError(err.message);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an ingredient"
        className="w-full p-2 border border-[#3C4E2A] rounded bg-[#F5E9D4] text-[#3C4E2A] mb-2"
      />
      <div className="flex items-center mb-2">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value)))}
          className="w-1/2 p-2 border border-[#3C4E2A] rounded bg-[#F5E9D4] text-[#3C4E2A] mr-2"
        />
        <span className="text-[#3C4E2A]">grams</span>
      </div>
      {loading && <p className="text-[#3C4E2A]">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-[#F5E9D4] border border-[#3C4E2A] rounded mt-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="p-2 hover:bg-[#3C4E2A] hover:text-[#F5E9D4] cursor-pointer"
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IngredientAutocomplete;
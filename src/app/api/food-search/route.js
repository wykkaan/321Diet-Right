import { NextResponse } from 'next/server';

const API_KEY = process.env.SPOONACULAR_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.spoonacular.com/food/menuItems/suggest?query=${query}&number=10&apiKey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch food suggestions');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching food:', error);
    return NextResponse.json({ error: 'Failed to search food' }, { status: 500 });
  }
}
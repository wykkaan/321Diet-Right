// src/app/api/image-recognition/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;

// List of words to exclude from food names
const excludeWords = ['food', 'cuisine', 'dish', 'meal', 'recipe', 'ingredient'];

function isSpecificFoodItem(label) {
  const lowerLabel = label.toLowerCase();
  return !excludeWords.some(word => lowerLabel.includes(word)) && 
         !lowerLabel.includes(' cuisine') &&
         !lowerLabel.includes(' food');
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // Make request to Google Cloud Vision API
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`;
    const visionRequestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'WEB_DETECTION', maxResults: 20 },
          ]
        }
      ]
    };

    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      body: JSON.stringify(visionRequestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Cloud Vision API Error:', visionResponse.status, errorText);
      throw new Error(`Google Cloud Vision API responded with ${visionResponse.status}: ${errorText}`);
    }

    const visionResult = await visionResponse.json();

    // Extract and filter specific food items
    const labels = visionResult.responses[0].labelAnnotations || [];
    const webEntities = visionResult.responses[0].webDetection?.webEntities || [];
    
    const foodItems = [...labels, ...webEntities]
      .filter(item => isSpecificFoodItem(item.description))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Get nutrition information for the top food item
    let nutritionInfo = null;
    if (foodItems.length > 0) {
      const topFoodItem = foodItems[0].description;
      const nutritionResponse = await fetch(
        `https://api.spoonacular.com/recipes/guessNutrition?title=${encodeURIComponent(topFoodItem)}&apiKey=${spoonacularApiKey}`
      );

      if (nutritionResponse.ok) {
        nutritionInfo = await nutritionResponse.json();
      } else {
        console.error('Failed to fetch nutrition info:', await nutritionResponse.text());
      }
    }

    return NextResponse.json({
      foodItems,
      nutritionInfo
    });

  } catch (error) {
    console.error('Detailed error in image analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze food image', details: error.message }, { status: 500 });
  }
}
// app/api/seller/upload-image/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      throw new Error('No image file provided');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { publicURL, error: urlError } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    if (urlError) throw urlError;

    return NextResponse.json({ url: publicURL });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
// app/api/seller/products/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');

  if (!sellerId) {
    return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const sellerId = formData.get('seller_id');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const category = formData.get('category');
    const inventoryCount = parseInt(formData.get('inventory_count'));
    const isAvailable = formData.get('is_available') === 'true';
    const image = formData.get('image');

    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        seller_id: sellerId,
        description,
        price,
        image_url: imageUrl,
        category,
        inventory_count: inventoryCount,
        is_available: isAvailable
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const { id, sellerId, action, is_available, ...updateData } = await request.json();

  if (!id || !sellerId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    let result;
    if (action === 'delete') {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('seller_id', sellerId);
      if (error) throw error;
      result = { message: 'Product deleted successfully' };
    } else if (action === 'suspend' || action === 'activate') {
      const { data, error } = await supabase
        .from('products')
        .update({ is_available })
        .eq('id', id)
        .eq('seller_id', sellerId)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      // Handle regular product updates
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('seller_id', sellerId)
        .select();
      if (error) throw error;
      result = data[0];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
  
  export async function DELETE(request) {
    const { id } = await request.json();
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
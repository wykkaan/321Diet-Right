import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRole)

export async function POST(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
  }

  try {
    const userData = await req.json()

    // First, get the user's ID from the auth.users table
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userData.email)
      .single()

    if (authError) throw authError

    // Now insert the data into the public.users table
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          username: userData.username,
          email: userData.email,
          goal: userData.goal,
          gender: userData.gender,
          age: userData.age,
          height: userData.height,
          weight: userData.weight,
          target_calories: userData.target_calories
        }
      ])

    if (error) throw error

    return NextResponse.json({ message: 'User data submitted successfully', data })
  } catch (error) {
    console.error('Error submitting user data:', error)
    return NextResponse.json({ error: 'An error occurred while submitting user data' }, { status: 500 })
  }
}
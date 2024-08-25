import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Allow access to login pages and API routes
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/admin/login') ||
      request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Redirect to login if no session
  if (!session) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check admin status for admin routes
  if (session && request.nextUrl.pathname.startsWith('/admin')) {
    const { data, error } = await supabase
      .from('users')
      .select('isAdmin')
      .eq('id', session.user.id)
      .single();

    if (error || !data || !data.isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check profile completion for non-admin routes
  if (session && !request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      return NextResponse.redirect(new URL('/onboarding/begin', request.url))
    }

    const requiredFields = ['username', 'goal', 'gender', 'age', 'height', 'weight', 'target_calories']
    const missingFields = requiredFields.filter(field => !profile[field])

    if (missingFields.length > 0) {
      return NextResponse.redirect(new URL('/onboarding/begin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
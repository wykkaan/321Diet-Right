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

  if (session && !request.nextUrl.pathname.startsWith('/onboarding')) {
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
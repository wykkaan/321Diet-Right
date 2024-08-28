import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request) {
  console.log('Middleware called for path:', request.nextUrl.pathname);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  const { data: { session } } = await supabase.auth.getUser()
  console.log('Session in middleware:', session ? 'exists' : 'does not exist');

  // We're not doing any redirects here, just passing along the session information
  // The client-side will handle all routing decisions

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
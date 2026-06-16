import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that do NOT require authentication
const PUBLIC_PREFIXES = ['/login', '/auth/']
// API routes with their own auth (cron secret)
const SELF_AUTH_PREFIXES = ['/api/cron/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets — skip entirely
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Routes with self-managed auth
  if (SELF_AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Public pages
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Use getUser() — validates JWT with Supabase Auth server, not just local cookie
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static Next.js internals
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}

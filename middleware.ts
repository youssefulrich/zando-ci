import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/residences',
  '/vehicles',
  '/events',
  '/login',
  '/register',
  '/api/paiement/webhook',
]

const AUTH_ONLY_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  // --- Laisser passer les bots (Facebook, Twitter, LinkedIn…) ---
  const BOT_UA_REGEX = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|Googlebot/i
  if (BOT_UA_REGEX.test(request.headers.get('user-agent') || '')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (!user && !isPublic) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|og.png|og.jpg|og.jpeg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
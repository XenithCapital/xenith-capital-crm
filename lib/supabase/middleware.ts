import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes — always accessible
  const publicRoutes = ['/login', '/unauthorised', '/api/cron', '/auth/confirm']
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))

  if (isPublic) {
    return supabaseResponse
  }

  // Not authenticated → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Fetch profile to get role + agreement_signed
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agreement_signed')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const agreementSigned = profile?.agreement_signed ?? false

  // Introducer: must complete onboarding before accessing anything else
  // /set-password is also allowed before onboarding (invited users set their password first)
  if (role === 'introducer' && !agreementSigned && pathname !== '/onboarding' && pathname !== '/set-password') {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Prevent signed introducers from re-visiting onboarding
  if (role === 'introducer' && agreementSigned && pathname === '/onboarding') {
    const url = request.nextUrl.clone()
    url.pathname = '/portal/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (pathname.startsWith('/admin') && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorised'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/portal') && role !== 'introducer') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorised'
    return NextResponse.redirect(url)
  }

  // Redirect root to correct dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin/dashboard' : '/portal/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

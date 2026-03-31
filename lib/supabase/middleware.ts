import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { REQUIRED_AGREEMENT_VERSION } from '@/lib/agreement/config'

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
  const publicRoutes = ['/login', '/forgot-password', '/unauthorised', '/api/cron', '/auth/confirm', '/register/', '/prospect/']
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
    .select('role, agreement_signed, signed_agreement_version')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const agreementSigned = profile?.agreement_signed ?? false
  const signedVersion = profile?.signed_agreement_version ?? null

  // Introducer: must complete onboarding before accessing anything else
  // /set-password and API routes are also allowed before onboarding
  if (role === 'introducer' && !agreementSigned && !pathname.startsWith('/api/') && pathname !== '/onboarding' && pathname !== '/set-password') {
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

  // Introducer: signed but on an outdated agreement version — gate to /re-sign
  if (
    role === 'introducer' &&
    agreementSigned &&
    signedVersion !== REQUIRED_AGREEMENT_VERSION &&
    !pathname.startsWith('/api/') &&
    pathname !== '/re-sign' &&
    pathname !== '/set-password'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/re-sign'
    return NextResponse.redirect(url)
  }

  // Prevent introducers on the current version from hitting /re-sign
  if (
    role === 'introducer' &&
    agreementSigned &&
    signedVersion === REQUIRED_AGREEMENT_VERSION &&
    pathname === '/re-sign'
  ) {
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

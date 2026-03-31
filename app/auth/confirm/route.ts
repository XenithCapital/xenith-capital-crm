import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the redirect from Supabase invite links.
// Supabase appends ?token_hash=xxx&type=invite to the redirectTo URL.
// We exchange the token, then redirect invited users to /set-password.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'invite' | 'recovery' | 'email' | null
  const next = searchParams.get('next')

  if (tokenHash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      if (type === 'recovery') {
        // Password reset: send to set-password page
        return NextResponse.redirect(`${origin}/set-password`)
      }
      if (type === 'invite') {
        // First-time invite: user is now logged in but has no password — send to set-password
        return NextResponse.redirect(`${origin}/set-password`)
      }
      // Use explicit next param or fall back to onboarding
      return NextResponse.redirect(`${origin}${next ?? '/onboarding'}`)
    }

    console.error('[auth/confirm] OTP verification failed:', error.message)
  }

  // Token missing or invalid — back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=invalid_invite`)
}

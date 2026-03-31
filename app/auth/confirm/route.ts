import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles two auth callback flows:
// 1. PKCE flow (password reset via resetPasswordForEmail) — Supabase appends ?code=xxx
// 2. Token hash flow (invite links) — Supabase appends ?token_hash=xxx&type=invite
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'invite' | 'recovery' | 'email' | null
  const next = searchParams.get('next')

  const supabase = await createClient()

  // PKCE flow — password reset emails land here with a code param
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/set-password`)
    }
    console.error('[auth/confirm] Code exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`)
  }

  // Token hash flow — invite emails land here with token_hash + type
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      if (type === 'recovery' || type === 'invite') {
        return NextResponse.redirect(`${origin}/set-password`)
      }
      return NextResponse.redirect(`${origin}${next ?? '/onboarding'}`)
    }

    console.error('[auth/confirm] OTP verification failed:', error.message)
  }

  // No valid token — back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=invalid_invite`)
}

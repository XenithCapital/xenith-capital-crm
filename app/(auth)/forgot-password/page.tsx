'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/confirm?type=recovery&next=/set-password`,
    })

    if (resetError) {
      const msg = resetError.message.toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('Too many reset attempts. Please wait a few minutes before trying again.')
      } else {
        setError(resetError.message)
      }
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="bg-[#002147] h-20 flex items-center justify-center px-8">
        <Image
          src="/logo.png"
          alt="Xenith Capital"
          width={220}
          height={60}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#002147] mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#002147]">Reset your password</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {sent ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4">
                    <p className="text-sm text-green-700 font-medium">Check your inbox</p>
                    <p className="text-sm text-green-600 mt-1">
                      If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      Can't find it? Check your <strong>junk or spam folder</strong>.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="block text-sm text-[#5FB548] hover:underline mt-4"
                  >
                    ← Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] focus:border-transparent transition"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>

                  <div className="text-center pt-2">
                    <Link href="/login" className="text-sm text-gray-500 hover:text-[#002147] transition">
                      ← Back to sign in
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Xenith Capital Introducer Portal — Authorised users only
          </p>
        </div>
      </div>
    </div>
  )
}

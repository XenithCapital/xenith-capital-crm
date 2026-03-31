'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Profile } from '@/types/database'
import { AGREEMENT_TEXT, REQUIRED_AGREEMENT_VERSION } from '@/lib/agreement/config'

interface ReSignWizardProps {
  profile: Profile
}

export default function ReSignWizard({ profile }: ReSignWizardProps) {
  const router = useRouter()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const nameMatches = signedName.toLowerCase() === profile.full_name.toLowerCase()
  const canSign = checked1 && checked2 && checked3 && nameMatches && hasScrolledToBottom

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true)
    }
  }

  async function handleSign() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullNameTyped: signedName }),
      })

      let data: { error?: string; success?: boolean } = {}
      try {
        data = await res.json()
      } catch {
        setError('Server error — please refresh and try again, or contact info@xenithcapital.co.uk.')
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to sign agreement')
        return
      }

      setDone(true)
    } catch (err) {
      console.error('[re-sign] Network error:', err)
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
          <Image src="/logo.png" alt="Xenith Capital" width={160} height={44} className="object-contain" priority />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#002147] mb-2">Agreement Updated</h2>
            <p className="text-gray-500 text-sm mb-8">
              Thank you, {profile.full_name.split(' ')[0]}. Your updated agreement has been signed and a copy sent to {profile.email}.
            </p>
            <button
              onClick={() => router.push('/portal/dashboard')}
              className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-8 py-3 rounded-xl transition text-sm"
            >
              Continue to portal →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
        <Image src="/logo.png" alt="Xenith Capital" width={160} height={44} className="object-contain" priority />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Notice banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Updated agreement requires your signature</p>
            <p className="text-sm text-amber-700 mt-0.5">
              The Xenith Capital Introducer Agreement has been updated ({REQUIRED_AGREEMENT_VERSION.replace('_', ' ').replace('_', ' ')}).
              Please read and sign the new version below to continue accessing the portal.
            </p>
          </div>
        </div>

        {/* Agreement card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#002147]">Independent Capital Introducer Agreement</h2>
            <p className="text-sm text-gray-500 mt-1">{REQUIRED_AGREEMENT_VERSION.replace('_', ' ').replace('_', ' ')} — Please scroll to the bottom to enable signing</p>
          </div>

          {/* Scrollable agreement text */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-72 overflow-y-auto px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line border-b border-gray-100 font-mono bg-gray-50"
          >
            {AGREEMENT_TEXT}
          </div>

          {!hasScrolledToBottom && (
            <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-100">
              <p className="text-xs text-yellow-700">↓ Scroll to the bottom of the agreement to enable signing</p>
            </div>
          )}

          <div className="px-6 py-6 space-y-5">
            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked1}
                  onChange={(e) => setChecked1(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5FB548]"
                />
                <span className="text-sm text-gray-700">
                  I have read and understood the updated Introducer Agreement in full
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked2}
                  onChange={(e) => setChecked2(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5FB548]"
                />
                <span className="text-sm text-gray-700">
                  I confirm I am acting as an independent contractor, not an employee of Xenith Capital or Pelican Trading
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked3}
                  onChange={(e) => setChecked3(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5FB548]"
                />
                <span className="text-sm text-gray-700">
                  I confirm I will not provide financial advice or handle client funds
                </span>
              </label>
            </div>

            {/* Name + date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type your full legal name to sign <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder={profile.full_name}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                    signedName && !nameMatches
                      ? 'border-red-300 focus:ring-red-300'
                      : nameMatches && signedName
                      ? 'border-green-300 focus:ring-green-300'
                      : 'border-gray-300 focus:ring-[#5FB548]'
                  }`}
                />
                {signedName && !nameMatches && (
                  <p className="text-xs text-red-500 mt-1">
                    Name must match: {profile.full_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={today}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleSign}
              disabled={!canSign || loading}
              className="w-full bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Processing…' : 'Sign Updated Agreement →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

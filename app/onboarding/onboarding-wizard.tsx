'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

const AGREEMENT_TEXT = `INDEPENDENT CAPITAL INTRODUCER AGREEMENT
Xenith Capital — Sophisticated & High-Net-Worth Client Programme
Version: V2 | March 2026

This Agreement is entered into between SRL Partners Ltd, trading as Xenith Capital (Company No. 15983046), registered at 167-169 Great Portland Street, 5th Floor, London, W1W 5PF ("Xenith Capital") and the Introducer identified in the portal profile ("you" or "Introducer").

1. APPOINTMENT

Xenith Capital appoints you as a non-exclusive, independent capital introducer on the terms set out in this Agreement. You are not an employee, agent, or representative of Xenith Capital or Pelican Trading for any purpose.

2. SCOPE OF PERMITTED ACTIVITIES

You may introduce prospective investors to Xenith Capital by:
• Sharing Xenith-approved materials only
• Directing prospects to the Xenith Capital website and Dashboard
• Registering prospects via the Introducer Portal
You must include the mandatory risk disclaimer on all materials and disclose your remunerated introducer status to all prospects.

3. PROHIBITED ACTIVITIES

You must not:
• Provide personalised investment advice or suitability assessments
• Handle, receive, or transmit client funds
• Make representations about future returns or guaranteed performance
• Publish any content about Xenith Capital without prior written approval
• Create the impression you are an employee of Xenith Capital or Pelican Trading
• Sub-appoint agents without Xenith Capital's prior written consent

4. REVENUE SHARE

Subject to the terms of this Agreement:
• Tier 1 (AUM USD 10,000–999,999): 15% of Performance Fee generated on your Introduced Accounts
• Tier 2 (AUM USD 1,000,000–9,999,999): 20% of Performance Fee
• Tier 3 (AUM USD 10,000,000+): individually agreed
Performance Fees are only charged on net new profits above the High-Water Mark. In any month with no profit, no Performance Fee is charged and no Revenue Share is payable.

5. REFERRAL REWARD

USD 500 one-time payment per Introduced Account, vesting after 90 continuous days funded at or above USD 10,000. Subject to a 24-month clawback window.

6. QUALIFIED MINIMUM DEPOSIT

USD 10,000 per Introduced Account. Accounts below this threshold generate no Revenue Share or Referral Reward until the threshold is met and maintained.

7. ATTRIBUTION

You must register each prospect via the portal before they contact Xenith Capital independently. Registration must reference a genuine pre-existing relationship. No bulk speculative registrations permitted.

8. COMPLIANCE

You must comply with all applicable laws and FCA guidance. You acknowledge that introducing investors to financial services firms may constitute a regulated activity and you are solely responsible for ensuring your activities fall within permitted boundaries. Xenith Capital operates as a Strategy Provider to Pelican Trading, a trading name of London & Eastern LLP (FCA Ref: 534484).

9. CONFIDENTIALITY

You must keep all non-public information about Xenith Capital, its technology, fee structures, partners, and clients strictly confidential.

10. TERMINATION

Either party may terminate this Agreement on 30 days' written notice. Xenith Capital may terminate immediately for material breach. A 24-month clawback window applies to all payments where a breach is subsequently established.

11. GOVERNING LAW

This Agreement is governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the English courts.

By signing below you confirm you have read, understood, and agree to be bound by the terms of this Agreement in its entirety.`

interface OnboardingWizardProps {
  profile: Profile
}

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [companyName, setCompanyName] = useState(profile.company_name ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
        body: JSON.stringify({
          fullNameTyped: signedName,
          phone,
          companyName,
          linkedinUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to sign agreement')
        return
      }

      setStep(3)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    router.push('/portal/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#5FB548] flex items-center justify-center">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <span className="text-white font-bold text-lg tracking-widest uppercase">Xenith Capital</span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step ? 'bg-[#5FB548] text-white' :
                s === step ? 'bg-[#002147] text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {s < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-sm font-medium ${
                s === step ? 'text-[#002147]' : s < step ? 'text-[#5FB548]' : 'text-gray-400'
              }`}>
                {s === 1 ? 'Welcome' : s === 2 ? 'Agreement' : 'Profile'}
              </span>
              {s < 3 && <div className="w-16 h-px bg-gray-200 ml-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#002147] flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">X</span>
            </div>
            <h1 className="text-3xl font-bold text-[#002147] mb-4">
              Welcome to the Xenith Capital Introducer Portal
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-4">
              Hello <strong>{profile.full_name}</strong>,
            </p>
            <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-4">
              This portal is your dedicated platform for managing your introducer relationship with
              Xenith Capital. Through it, you can register and track prospects, monitor investor
              account status, view your earnings, and raise support requests.
            </p>
            <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-8">
              Before accessing the portal, you must review and sign the Independent Capital
              Introducer Agreement. This takes approximately 3 minutes.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-8 py-3 rounded-xl transition text-sm"
            >
              Continue to Agreement →
            </button>
          </div>
        )}

        {/* STEP 2: Agreement */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#002147]">Independent Capital Introducer Agreement</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Please read the full agreement carefully. Scroll to the bottom before signing.
                </p>
              </div>

              {/* Scrollable agreement text */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-[420px] overflow-y-auto px-6 py-5 bg-gray-50 border-b border-gray-200"
              >
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  {AGREEMENT_TEXT.split('\n\n').map((section, i) => {
                    const lines = section.trim().split('\n')
                    const firstLine = lines[0]
                    const isHeading = /^\d+\.\s/.test(firstLine) || firstLine === firstLine.toUpperCase()

                    if (isHeading && lines.length > 1) {
                      return (
                        <div key={i}>
                          <p className="font-bold text-[#002147] mb-2">{firstLine}</p>
                          {lines.slice(1).map((line, j) => (
                            <p key={j} className={`${line.startsWith('•') ? 'pl-4' : ''} mb-1`}>{line}</p>
                          ))}
                        </div>
                      )
                    }

                    return (
                      <div key={i}>
                        {lines.map((line, j) => (
                          <p key={j} className={`${line.startsWith('•') ? 'pl-4' : ''} ${isHeading && j === 0 ? 'font-bold text-[#002147]' : ''} mb-1`}>
                            {line}
                          </p>
                        ))}
                      </div>
                    )
                  })}
                </div>
                {!hasScrolledToBottom && (
                  <div className="sticky bottom-0 left-0 right-0 py-3 text-center text-xs text-amber-700 bg-amber-50 border-t border-amber-200 mt-4">
                    ↓ Scroll to bottom to enable signing
                  </div>
                )}
              </div>

              {/* Signing fields */}
              <div className={`px-6 py-6 space-y-4 transition-opacity ${hasScrolledToBottom ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked1}
                      onChange={(e) => setChecked1(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#5FB548]"
                    />
                    <span className="text-sm text-gray-700">
                      I confirm I have read and understood the full Introducer Agreement
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

                <div className="grid grid-cols-2 gap-4 pt-2">
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
                        Name must match your registered name: {profile.full_name}
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
                  className="w-full bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {loading ? 'Processing…' : 'Sign & Continue →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Profile Completion */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#002147]">Agreement Signed Successfully</h2>
                  <p className="text-sm text-gray-500">
                    A copy has been emailed to {profile.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-6">
                Complete your profile below. Your phone number is required. All other fields are optional.
              </p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900000"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company / trading name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Wilson Capital Introductions"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleComplete}
                disabled={!phone}
                className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-8 py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Complete Setup →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

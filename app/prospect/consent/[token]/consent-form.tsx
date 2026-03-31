'use client'

import { useState } from 'react'

interface Props {
  token: string
  prospectName: string
  prospectEmail: string
  introducerName: string
}

const DECLARATIONS = [
  'I confirm that I have a genuine pre-existing relationship with the named Introducer and that I have expressed genuine interest in learning more about Xenith Capital.',
  'I understand that by confirming my interest, a mandatory 24-hour regulatory cooling-off period will begin. During this period I am under no obligation to invest or proceed further.',
  'I understand that Xenith Capital acts as a Strategy Provider and that client accounts are managed by Pelican Trading, a trading name of London & Eastern LLP (FCA Ref: 534484), and that all investments carry risk.',
]

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/London',
    timeZoneName: 'short',
  })
}

export default function ConsentForm({ token, prospectName, prospectEmail, introducerName }: Props) {
  const [checked, setChecked] = useState<boolean[]>(DECLARATIONS.map(() => false))
  const [typedName, setTypedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coolingOffEndsAt, setCoolingOffEndsAt] = useState<string | null>(null)

  const allChecked = checked.every(Boolean)
  const nameMatch = typedName.trim().toLowerCase() === prospectName.toLowerCase()
  const canSubmit = allChecked && nameMatch && !loading

  function toggleCheck(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/prospect/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullNameTyped: typedName.trim() }),
      })

      let data: { success?: boolean; coolingOffEndsAt?: string; error?: string }
      try {
        data = await res.json()
      } catch {
        setError(`Server error (${res.status}) — please try again.`)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error ?? `Server error (${res.status})`)
        setLoading(false)
        return
      }

      setCoolingOffEndsAt(data.coolingOffEndsAt ?? null)
    } catch {
      setError('Network error — please check your connection and try again.')
      setLoading(false)
    }
  }

  // Success state
  if (coolingOffEndsAt) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#002147]">Interest Confirmed</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Thank you, <strong>{prospectName}</strong>. Your interest has been confirmed and your
          24-hour cooling-off period has begun.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Your cooling-off period ends at <strong>{formatDateTime(coolingOffEndsAt)}</strong>.
          During this time you are under <strong>no obligation</strong> to proceed.
        </div>
        <p className="text-gray-500 text-xs">
          A signed copy of your consent record has been emailed to <strong>{prospectEmail}</strong>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Declarations */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#002147] uppercase tracking-wide">Declarations</h2>
        <p className="text-xs text-gray-500">
          Please read and tick each declaration below before signing.
        </p>

        {DECLARATIONS.map((text, i) => (
          <label
            key={i}
            className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              checked[i]
                ? 'border-[#5FB548] bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  checked[i] ? 'bg-[#5FB548] border-[#5FB548]' : 'border-gray-300 bg-white'
                }`}
                onClick={() => toggleCheck(i)}
              >
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => toggleCheck(i)}
              className="sr-only"
            />
            <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
          </label>
        ))}
      </div>

      {/* Signature */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#002147] uppercase tracking-wide">Electronic Signature</h2>
        <p className="text-xs text-gray-500">
          Type your full name exactly as registered (<strong>{prospectName}</strong>) to confirm your identity and sign this consent record.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder={`e.g. ${prospectName}`}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
              typedName.length > 0
                ? nameMatch
                  ? 'border-[#5FB548] bg-green-50 focus:ring-2 focus:ring-[#5FB548]/20'
                  : 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10'
            }`}
          />
          {typedName.length > 0 && !nameMatch && (
            <p className="text-xs text-red-500 mt-1">Name does not match your registered name.</p>
          )}
          {typedName.length > 0 && nameMatch && (
            <p className="text-xs text-green-600 mt-1">Name verified.</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <p><span className="font-medium text-gray-700">Signing as:</span> {prospectName}</p>
          <p><span className="font-medium text-gray-700">Email:</span> {prospectEmail}</p>
          <p><span className="font-medium text-gray-700">Referred by:</span> {introducerName}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full rounded-xl py-3 px-6 text-sm font-semibold transition-all ${
          canSubmit
            ? 'bg-[#002147] text-white hover:bg-[#002147]/90 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          'Confirm Interest & Start Cooling-Off Period'
        )}
      </button>

      {!allChecked && (
        <p className="text-center text-xs text-gray-400">
          Please tick all declarations above before signing.
        </p>
      )}
    </form>
  )
}

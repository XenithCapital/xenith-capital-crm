'use client'

import { useState } from 'react'

const COUNTRIES = [
  'United Kingdom', 'United States', 'United Arab Emirates', 'Australia', 'Canada',
  'Germany', 'France', 'Switzerland', 'Netherlands', 'Spain', 'Italy', 'Singapore',
  'Hong Kong', 'South Africa', 'Nigeria', 'Kenya', 'India', 'Pakistan', 'Poland', 'Other',
]

interface Props {
  introducerId: string
  introducerName: string
}

export default function ProspectSelfRegisterForm({ introducerId, introducerName }: Props) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string } | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/prospects/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        introducerId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        country: form.country,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Registration failed. Please try again.'); setLoading(false); return }
    setDone({ email: form.email })
    setLoading(false)
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#002147] mb-2">Almost there — check your email</h2>
        <p className="text-gray-600 text-sm mb-4">
          We've sent a consent confirmation link to <strong>{done.email}</strong>.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 text-left">
          <p className="font-semibold mb-1">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Open the email from Xenith Capital.</li>
            <li>Click the confirmation link to review the terms and sign.</li>
            <li>Once confirmed, your 24-hour cooling-off period will begin.</li>
          </ol>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          If you don't see the email, check your spam folder or contact{' '}
          <a href="mailto:info@xenithcapital.co.uk" className="text-[#5FB548] underline">info@xenithcapital.co.uk</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.fullName} onChange={set('fullName')} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
          <input type="tel" value={form.phone} onChange={set('phone')} required placeholder="+44 7700 900000"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Country of Residence <span className="text-red-500">*</span></label>
          <select value={form.country} onChange={set('country')} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
        By submitting, you confirm that you have a pre-existing relationship with{' '}
        <strong>{introducerName}</strong> and are registering your genuine interest in Xenith Capital.
        You will receive an email to formally confirm your consent before any cooling-off period begins.
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-3 rounded-lg transition disabled:opacity-40 text-sm">
        {loading ? 'Submitting…' : 'Submit Registration'}
      </button>
    </form>
  )
}

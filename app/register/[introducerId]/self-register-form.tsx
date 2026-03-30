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
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: '', consent: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ endsAt: string } | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((f) => ({ ...f, [key]: val }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consent) { setError('You must confirm your consent to proceed.'); return }
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
    setDone({ endsAt: data.coolingOffEndsAt })
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
        <h2 className="text-xl font-bold text-[#002147] mb-2">You're registered</h2>
        <p className="text-gray-600 text-sm mb-4">
          A confirmation email has been sent to <strong>{form.email}</strong>.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Your 24-hour cooling-off period ends at approximately <strong>{new Date(done.endsAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</strong>.
          You will receive an email when it concludes.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
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
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Country of Residence <span className="text-red-500">*</span></label>
          <select value={form.country} onChange={set('country')} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-start gap-3 pt-1">
        <input type="checkbox" id="consent" checked={form.consent} onChange={set('consent')}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#5FB548] focus:ring-[#5FB548]" />
        <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
          I confirm that I have a pre-existing relationship with <strong>{introducerName}</strong>, I am
          registering my genuine interest in Xenith Capital, and I understand that a 24-hour
          cooling-off period will begin immediately upon submission.
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading || !form.consent}
        className="w-full bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-3 rounded-lg transition disabled:opacity-40 text-sm">
        {loading ? 'Registering…' : 'Register Interest & Start Cooling-Off'}
      </button>
    </form>
  )
}

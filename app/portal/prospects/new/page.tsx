'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

const COUNTRIES = [
  'United Kingdom', 'United States', 'United Arab Emirates', 'Singapore', 'Hong Kong',
  'Australia', 'Canada', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Spain', 'Italy', 'New Zealand', 'South Africa', 'Nigeria',
  'Kenya', 'India', 'Japan', 'Malaysia', 'Thailand', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Other',
]

export default function NewProspectPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    sourceNote: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ prospectId: string; fullName: string; email: string } | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/prospects/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        sourceNote: form.sourceNote,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to register prospect')
      setLoading(false)
      return
    }

    setSuccess({ prospectId: data.prospect.id, fullName: form.fullName, email: form.email })
    setLoading(false)
  }

  if (success) {
    return (
      <div>
        <PageHeader title="Prospect Registered" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 max-w-lg">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#002147] mb-3">Prospect registered successfully</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-1">Consent email sent</p>
            <p className="text-sm text-blue-800">
              A consent request email has been sent to <strong>{success.fullName}</strong> at{' '}
              <strong>{success.email}</strong>. The 24-hour cooling-off period will begin only after
              they confirm their interest via the link in that email.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/portal/prospects/${success.prospectId}`}
              className="bg-[#5FB548] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[#4ea038] transition text-sm"
            >
              View Prospect
            </Link>
            <button
              onClick={() => {
                setSuccess(null)
                setForm({ fullName: '', email: '', phone: '', country: '', sourceNote: '' })
              }}
              className="text-sm text-gray-600 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Register New Prospect"
        description="All fields are required unless marked optional"
        actions={
          <Link href="/portal/prospects" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </Link>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-2xl">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> After submitting, your prospect will receive an email asking them
          to confirm their interest. The mandatory 24-hour regulatory cooling-off period will only start
          once they confirm. Ensure you have a genuine pre-existing relationship with this person before
          registering them. Speculative bulk registrations are prohibited under your Introducer Agreement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full legal name <span className="text-red-500">*</span></label>
              <input type="text" value={form.fullName} onChange={set('fullName')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number <span className="text-red-500">*</span></label>
              <input type="tel" value={form.phone} onChange={set('phone')} required
                placeholder="+44 7700 900000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country of residence <span className="text-red-500">*</span></label>
              <select value={form.country} onChange={set('country')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How do you know this person? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.sourceNote}
              onChange={set('sourceNote')}
              required
              rows={4}
              placeholder="Describe your pre-existing relationship with this prospect. E.g. 'Long-standing business contact from the finance sector, met at a conference in 2022...'"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Required by your Introducer Agreement. Must describe a genuine pre-existing relationship.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-40 text-sm"
          >
            {loading ? 'Registering…' : 'Register Prospect & Send Consent Email'}
          </button>
        </div>
      </form>
    </div>
  )
}

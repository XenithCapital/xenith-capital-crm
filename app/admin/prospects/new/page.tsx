'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  'United Kingdom', 'United States', 'United Arab Emirates', 'Australia', 'Canada',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Switzerland', 'Singapore',
  'Hong Kong', 'South Africa', 'Nigeria', 'Kenya', 'India', 'Pakistan', 'Poland',
  'Other',
]

export default function NewProspectPage() {
  const router = useRouter()
  const [introducers, setIntroducers] = useState<Array<{ id: string; full_name: string; is_internal: boolean }>>([])
  const [form, setForm] = useState({
    introducerId: '',
    fullName: '',
    email: '',
    phone: '',
    country: '',
    sourceNote: '',
    notes: '',
    startCoolingOff: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, full_name, is_internal')
      .eq('role', 'introducer')
      .order('full_name')
      .then(({ data }) => setIntroducers(data ?? []))
  }, [])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        introducerId: form.introducerId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        country: form.country || null,
        sourceNote: form.sourceNote || null,
        notes: form.notes || null,
        startCoolingOff: form.startCoolingOff,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create prospect')
      setLoading(false)
      return
    }

    router.push(`/admin/prospects/${data.prospect.id}`)
  }

  const internalIntroducers = introducers.filter((i) => i.is_internal)
  const externalIntroducers = introducers.filter((i) => !i.is_internal)

  return (
    <div>
      <PageHeader
        title="Add Prospect"
        description="Register a new prospect manually"
        actions={
          <Link href="/admin/prospects" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Introducer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source / Introducer <span className="text-red-500">*</span>
            </label>
            <select
              value={form.introducerId}
              onChange={set('introducerId')}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            >
              <option value="">Select source…</option>
              {internalIntroducers.length > 0 && (
                <optgroup label="Xenith Capital (Internal)">
                  {internalIntroducers.map((i) => (
                    <option key={i.id} value={i.id}>{i.full_name}</option>
                  ))}
                </optgroup>
              )}
              {externalIntroducers.length > 0 && (
                <optgroup label="External Introducers">
                  {externalIntroducers.map((i) => (
                    <option key={i.id} value={i.id}>{i.full_name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={form.country}
                onChange={set('country')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              >
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source / How they were referred</label>
            <input
              type="text"
              value={form.sourceNote}
              onChange={set('sourceNote')}
              placeholder="e.g. LinkedIn, referral, event…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Any relevant background information…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
            />
          </div>

          {/* Cooling-off toggle */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="cooling-off"
              checked={form.startCoolingOff}
              onChange={(e) => setForm((f) => ({ ...f, startCoolingOff: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="cooling-off" className="text-sm text-amber-800 cursor-pointer">
              <span className="font-semibold">Start cooling-off period immediately</span>
              <p className="text-xs mt-0.5 text-amber-700 font-normal">
                Tick this if the prospect has already been verbally approached. The 14-day cooling-off clock will start from now.
              </p>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
          >
            {loading ? 'Creating…' : 'Create Prospect'}
          </button>
          <Link
            href="/admin/prospects"
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

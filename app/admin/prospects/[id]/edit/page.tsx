'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  'United Kingdom', 'United States', 'United Arab Emirates', 'Singapore', 'Hong Kong',
  'Australia', 'Canada', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Spain', 'Italy', 'New Zealand', 'South Africa', 'Nigeria',
  'Kenya', 'India', 'Japan', 'Malaysia', 'Thailand', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Other',
]

export default function EditProspectPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    sourceNote: '',
  })
  const [prospectRef, setProspectRef] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('prospects')
      .select('full_name, email, phone, country, source_note, prospect_ref')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            fullName: data.full_name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            country: data.country ?? '',
            sourceNote: data.source_note ?? '',
          })
          setProspectRef(data.prospect_ref ?? null)
        }
        setLoading(false)
      })
  }, [id])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/admin/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        country: form.country || null,
        sourceNote: form.sourceNote || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save changes')
      setSaving(false)
      return
    }

    router.push(`/admin/prospects/${id}`)
    router.refresh()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
  }

  return (
    <div>
      <PageHeader
        title="Edit Prospect"
        description={
          prospectRef
            ? `${form.fullName} · ${prospectRef}`
            : form.fullName
        }
        actions={
          <Link
            href={`/admin/prospects/${id}`}
            className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-2xl">
        <p className="text-sm text-amber-800">
          <strong>Admin edit.</strong> All changes are written to the audit log with a full before/after record.
          The prospect&apos;s reference number and status are not editable here.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full legal name <span className="text-red-500">*</span>
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
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Changing the email triggers a duplicate check across all active prospects.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+44 7700 900000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country of residence</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Source note</label>
            <textarea
              value={form.sourceNote}
              onChange={set('sourceNote')}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href={`/admin/prospects/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

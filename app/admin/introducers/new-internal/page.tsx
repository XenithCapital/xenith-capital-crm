'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

export default function NewInternalMemberPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/introducers/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: form.fullName, email: form.email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push(`/admin/introducers/${data.profile.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Add Team Member"
        description="Creates an internal attribution record — no portal login required"
        actions={
          <Link
            href="/admin/introducers"
            className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            ← Back
          </Link>
        }
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">Internal attribution record</p>
            <p className="text-sm text-blue-700">
              This creates a named profile so prospects can be attributed to a specific team member.
              A reference number in the reserved <span className="font-mono font-semibold">XC-100</span> to{' '}
              <span className="font-mono font-semibold">XC-110</span> range is auto-assigned.
              No portal account or agreement signing is required.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={set('fullName')}
              required
              placeholder="e.g. James Whitfield"
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
              placeholder="e.g. james@xenithcapital.co.uk"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used for identification only — no login email will be sent.
            </p>
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
            disabled={loading}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
          >
            {loading ? 'Creating…' : 'Create Team Member'}
          </button>
          <Link
            href="/admin/introducers"
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

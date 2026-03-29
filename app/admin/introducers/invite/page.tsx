'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

export default function InviteIntroducerPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/introducers/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send invitation')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div>
        <PageHeader title="Invite Introducer" />
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-lg text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#002147] mb-2">Invitation Sent</h2>
          <p className="text-gray-600 mb-6">
            An invitation has been sent to <strong>{email}</strong>. They will receive an
            email with a link to access the portal and complete onboarding.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setSuccess(false); setEmail(''); setFullName('') }}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-lg transition"
            >
              Invite Another
            </button>
            <Link
              href="/admin/introducers"
              className="bg-[#5FB548] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#4ea038] transition"
            >
              Back to Introducers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Invite Introducer"
        description="Send an invitation email to a new introducer"
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full legal name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="James Wilson"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            />
            <p className="text-xs text-gray-400 mt-1">
              This must match the name they will use to sign the agreement.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="james@example.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/admin/introducers"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2.5 border border-gray-200 rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !email || !fullName}
              className="flex-1 bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Sending invitation…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

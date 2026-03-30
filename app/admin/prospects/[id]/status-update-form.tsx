'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProspectStatus } from '@/types/database'

const STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: 'registered',           label: 'Registered' },
  { value: 'cooling_off',          label: 'Cooling-Off' },
  { value: 'cooling_off_complete', label: 'Cooling-Off Complete' },
  { value: 'education_sent',       label: 'Onboarding Pack Issued' },
  { value: 'handoff_pending',      label: 'Introducer to Xenith Handoff' },
  { value: 'handed_off',           label: 'Handed Off' },
  { value: 'onboarding',           label: 'Pelican Onboarding' },
  { value: 'funded',               label: 'Funded' },
  { value: 'active',               label: 'Compliant & Active' },
  { value: 'stalled',              label: 'Stalled' },
  { value: 'lost',                 label: 'Lost' },
  { value: 'rejected',             label: 'Rejected' },
]

interface StatusUpdateFormProps {
  prospectId: string
  currentStatus: ProspectStatus
}

export default function StatusUpdateForm({ prospectId, currentStatus }: StatusUpdateFormProps) {
  const router = useRouter()
  const [newStatus, setNewStatus] = useState<ProspectStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newStatus === currentStatus) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/prospects/${prospectId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus, note }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to update status')
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
        <select
          value={newStatus}
          onChange={(e) => { setNewStatus(e.target.value as ProspectStatus); setSuccess(false) }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note {newStatus !== currentStatus && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for status change…"
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Status updated successfully.</p>}
      <button
        type="submit"
        disabled={loading || newStatus === currentStatus || (newStatus !== currentStatus && !note)}
        className="bg-[#002147] hover:bg-[#003366] text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        {loading ? 'Updating…' : 'Update Status'}
      </button>
    </form>
  )
}

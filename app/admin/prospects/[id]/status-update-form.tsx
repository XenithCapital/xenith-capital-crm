'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProspectStatus } from '@/types/database'

const STATUSES: ProspectStatus[] = [
  'registered', 'cooling_off', 'cooling_off_complete', 'education_sent',
  'handoff_pending', 'handed_off', 'onboarding', 'funded', 'active',
  'stalled', 'lost', 'rejected',
]

const STATUS_LABELS: Record<ProspectStatus, string> = {
  registered: 'Registered',
  cooling_off: 'Cooling Off',
  cooling_off_complete: 'Cooling-Off Complete',
  education_sent: 'Education Sent',
  handoff_pending: 'Handoff Pending',
  handed_off: 'Handed Off',
  onboarding: 'Onboarding',
  funded: 'Funded',
  active: 'Active',
  stalled: 'Stalled',
  lost: 'Lost',
  rejected: 'Rejected',
}

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
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
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

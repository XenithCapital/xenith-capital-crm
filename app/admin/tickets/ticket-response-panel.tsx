'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/status-badge'
import { formatDateLondon } from '@/lib/utils'
import type { SupportTicket, TicketStatus } from '@/types/database'

interface TicketResponsePanelProps {
  ticket: SupportTicket & { raiser?: { full_name: string; email: string } | null }
}

export default function TicketResponsePanel({ ticket }: TicketResponsePanelProps) {
  const router = useRouter()
  const raiser = ticket.raiser as { full_name: string; email: string } | null
  const [response, setResponse] = useState(ticket.admin_response ?? '')
  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: ticket.id,
        adminResponse: response,
        status,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 sticky top-6">
      <div>
        <h3 className="font-bold text-[#002147]">{ticket.subject}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {raiser?.full_name ?? '—'} · {formatDateLondon(ticket.created_at)}
        </p>
      </div>
      <div className="flex gap-2">
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm font-semibold text-gray-600 mb-1">Message</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">{ticket.body}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Response</label>
        <textarea
          value={response}
          onChange={(e) => { setResponse(e.target.value); setSaved(false) }}
          rows={5}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
          placeholder="Type your response to the introducer…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as TicketStatus); setSaved(false) }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {saved && <p className="text-sm text-green-600">Response saved and introducer notified.</p>}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-[#002147] hover:bg-[#003366] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
      >
        {loading ? 'Saving…' : 'Save Response'}
      </button>
    </div>
  )
}

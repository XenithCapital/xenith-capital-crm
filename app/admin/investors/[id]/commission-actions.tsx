'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CommissionStatus } from '@/types/database'

interface Props {
  commissionId: string
  status: CommissionStatus
}

type Action = 'request_invoice' | 'invoice_received' | 'mark_paid' | 'cancel'

const ACTIONS: Array<{
  action: Action
  label: string
  fromStatuses: CommissionStatus[]
  style: string
  confirm?: string
}> = [
  {
    action: 'request_invoice',
    label: 'Request Invoice',
    fromStatuses: ['pending'],
    style: 'bg-[#002147] text-white hover:bg-[#001a38]',
  },
  {
    action: 'invoice_received',
    label: 'Mark Invoice Received',
    fromStatuses: ['invoice_requested'],
    style: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  {
    action: 'mark_paid',
    label: 'Mark Paid',
    fromStatuses: ['invoice_received'],
    style: 'bg-[#5FB548] text-white hover:bg-[#4ea038]',
  },
  {
    action: 'cancel',
    label: 'Cancel',
    fromStatuses: ['pending', 'invoice_requested', 'invoice_received'],
    style: 'text-red-600 border border-red-200 hover:bg-red-50',
    confirm: 'Are you sure you want to cancel this commission record?',
  },
]

export default function CommissionActions({ commissionId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const availableActions = ACTIONS.filter((a) => a.fromStatuses.includes(status))

  async function handleAction(action: Action, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return

    setError(null)
    const res = await fetch(`/api/admin/commissions/${commissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Action failed')
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  if (availableActions.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {availableActions.map(({ action, label, style, confirm }) => (
        <button
          key={action}
          onClick={() => handleAction(action, confirm)}
          disabled={isPending}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${style}`}
        >
          {label}
        </button>
      ))}
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </div>
  )
}

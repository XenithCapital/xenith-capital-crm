'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'cooling_off', label: 'Cooling Off' },
  { value: 'cooling_off_complete', label: 'Cooling-Off Complete' },
  { value: 'education_sent', label: 'Education Sent' },
  { value: 'handoff_pending', label: 'Handoff Pending' },
  { value: 'handed_off', label: 'Handed Off' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'funded', label: 'Funded' },
  { value: 'active', label: 'Active' },
  { value: 'stalled', label: 'Stalled' },
  { value: 'lost', label: 'Lost' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ProspectsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          update('search', e.target.value)
        }}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] w-64"
      />
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}

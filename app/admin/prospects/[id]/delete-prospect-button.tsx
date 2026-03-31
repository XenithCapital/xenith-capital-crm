'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteProspectButton({ prospectId, prospectName }: { prospectId: string; prospectName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const surname = prospectName.trim().split(' ').pop() ?? prospectName
  const confirmed = typed.trim().toLowerCase() === surname.toLowerCase()

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/prospects/${prospectId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to delete')
      setLoading(false)
      return
    }
    router.push('/admin/prospects')
    router.refresh()
  }

  function handleCancel() {
    setConfirming(false)
    setTyped('')
    setError(null)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={`Type "${surname}" to confirm`}
          autoFocus
          className="text-sm px-3 py-1.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 w-44"
        />
        <button
          onClick={handleDelete}
          disabled={!confirmed || loading}
          className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-40"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
        <button
          onClick={handleCancel}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-600 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
    >
      Delete
    </button>
  )
}

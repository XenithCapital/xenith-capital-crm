'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type InvestorStatus = 'active' | 'inactive' | 'withdrawn' | 'suspended'

interface Props {
  investorId: string
  currentStatus: InvestorStatus
  investorName: string
}

const STATUS_OPTIONS: { value: InvestorStatus; label: string; class: string }[] = [
  { value: 'active',    label: 'Active',    class: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' },
  { value: 'inactive',  label: 'Inactive',  class: 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'suspended', label: 'Suspended', class: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'withdrawn', label: 'Withdrawn', class: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
]

type Modal = 'status' | 'delete' | null

export default function InvestorStatusActions({ investorId, currentStatus, investorName }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [pendingStatus, setPendingStatus] = useState<InvestorStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const surname = investorName.trim().split(' ').at(-1) ?? ''

  function close() {
    setModal(null)
    setError(null)
    setDeleteInput('')
    setPendingStatus(null)
  }

  function requestStatusChange(status: InvestorStatus) {
    if (status === currentStatus) return
    setPendingStatus(status)
    setModal('status')
  }

  async function handleStatusChange() {
    if (!pendingStatus) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/investors/${investorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      close()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (deleteInput !== surname) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/investors/${investorId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      router.push('/admin/investors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const pendingOption = STATUS_OPTIONS.find((o) => o.value === pendingStatus)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status buttons — show all except current */}
        {STATUS_OPTIONS.filter((o) => o.value !== currentStatus).map((opt) => (
          <button
            key={opt.value}
            onClick={() => requestStatusChange(opt.value)}
            className={`text-sm font-semibold px-3 py-2 rounded-lg border transition ${opt.class}`}
          >
            {opt.label}
          </button>
        ))}

        {/* Delete */}
        <button
          onClick={() => setModal('delete')}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
        >
          Delete
        </button>
      </div>

      {/* Status change confirm */}
      {modal === 'status' && pendingOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-[#002147] mb-2">
              Change status to {pendingOption.label}?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-semibold">{investorName}</span> will be marked as{' '}
              <span className="font-semibold">{pendingOption.label.toLowerCase()}</span>.
              This is recorded in the audit log.
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleStatusChange}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#002147] hover:bg-[#001535] text-white transition disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Confirm'}
              </button>
              <button
                onClick={close}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-red-700 mb-2">Permanently delete investor?</h3>
            <p className="text-sm text-gray-600 mb-1 font-semibold">{investorName}</p>
            <p className="text-sm text-gray-500 mb-4">
              All allocations and audit history for this investor will be removed.{' '}
              <span className="font-semibold text-red-600">This cannot be undone.</span>
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Type <span className="font-mono font-bold text-gray-900">{surname}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={surname}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading || deleteInput !== surname}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting…' : 'Delete permanently'}
              </button>
              <button
                onClick={close}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

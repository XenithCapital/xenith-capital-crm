'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  introducerId: string
  currentStatus: 'active' | 'dormant'
  introducerName: string
}

type Modal = 'dormant' | 'reactivate' | 'delete' | null

export default function IntroducerStatusActions({ introducerId, currentStatus, introducerName }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const surname = introducerName.trim().split(' ').at(-1) ?? ''
  const isDormant = currentStatus === 'dormant'

  function close() {
    setModal(null)
    setError(null)
    setDeleteInput('')
  }

  async function handleStatusChange(status: 'active' | 'dormant') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/introducers/${introducerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
      const res = await fetch(`/api/admin/introducers/${introducerId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      router.push('/admin/introducers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Dormant / Reactivate */}
        <button
          onClick={() => setModal(isDormant ? 'reactivate' : 'dormant')}
          className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
            isDormant
              ? 'bg-[#5FB548] hover:bg-[#4ea038] text-white'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {isDormant ? 'Reactivate' : 'Make Dormant'}
        </button>

        {/* Delete */}
        <button
          onClick={() => setModal('delete')}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
        >
          Delete
        </button>
      </div>

      {/* Dormant confirm */}
      {modal === 'dormant' && (
        <ConfirmModal
          title="Make introducer dormant?"
          body={`${introducerName}'s portal access will be blocked immediately. All their data is preserved and can be restored.`}
          confirmLabel="Make Dormant"
          confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
          loading={loading}
          error={error}
          onConfirm={() => handleStatusChange('dormant')}
          onCancel={close}
        />
      )}

      {/* Reactivate confirm */}
      {modal === 'reactivate' && (
        <ConfirmModal
          title="Reactivate introducer?"
          body={`${introducerName}'s portal access will be restored immediately.`}
          confirmLabel="Reactivate"
          confirmClass="bg-[#5FB548] hover:bg-[#4ea038] text-white"
          loading={loading}
          error={error}
          onConfirm={() => handleStatusChange('active')}
          onCancel={close}
        />
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-red-700 mb-2">Permanently delete introducer?</h3>
            <p className="text-sm text-gray-600 mb-1 font-semibold">{introducerName}</p>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete their account and all associated data — prospects, investors, agreements, and audit logs. <span className="font-semibold text-red-600">This cannot be undone.</span>
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

function ConfirmModal({
  title, body, confirmLabel, confirmClass, loading, error, onConfirm, onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  confirmClass: string
  loading: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-bold text-[#002147] mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{body}</p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Saving…' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

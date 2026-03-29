'use client'

import { useState } from 'react'
import { formatDateOnlyLondon } from '@/lib/utils'

interface AdminUser {
  id: string
  full_name: string
  email: string
  created_at: string
}

interface Props {
  agreementVersion: string
  adminUsers: AdminUser[]
}

export default function SettingsClient({ agreementVersion, adminUsers }: Props) {
  const [version, setVersion] = useState(agreementVersion)
  const [editingVersion, setEditingVersion] = useState(false)
  const [versionInput, setVersionInput] = useState(agreementVersion)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveVersion() {
    if (!versionInput.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'agreement_version', value: versionInput.trim() }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    setVersion(versionInput.trim())
    setEditingVersion(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      {/* Agreement version */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-bold text-[#002147]">Agreement Version</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              All new sign-ups will be bound by the agreement text in the codebase.
              Update this label whenever you deploy a new agreement version.
            </p>
          </div>
          {saved && (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              ✓ Saved
            </span>
          )}
        </div>

        {editingVersion ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              placeholder="e.g. V3_June_2026"
              className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
              onKeyDown={(e) => e.key === 'Enter' && saveVersion()}
              autoFocus
            />
            <button
              onClick={saveVersion}
              disabled={saving}
              className="bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditingVersion(false); setVersionInput(version) }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm bg-[#002147]/10 text-[#002147] px-3 py-1 rounded-full font-mono font-bold">
              {version}
            </span>
            <span className="text-sm text-gray-500">Current active version</span>
            <button
              onClick={() => { setVersionInput(version); setEditingVersion(true) }}
              className="ml-auto text-xs text-[#5FB548] hover:underline font-medium"
            >
              Edit
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Admin users */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#002147]">Admin Users</h2>
          <p className="text-xs text-gray-400">
            New admins must be created via Supabase Dashboard with role: admin
          </p>
        </div>
        <div className="space-y-2">
          {adminUsers.map((admin) => (
            <div key={admin.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-[#002147] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{admin.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{admin.full_name}</p>
                <p className="text-xs text-gray-500">{admin.email}</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">
                Joined {formatDateOnlyLondon(admin.created_at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

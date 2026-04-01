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

  // Admin invite state
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState(false)

  async function sendAdminInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)

    const res = await fetch('/api/admin/invite-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: inviteForm.fullName, email: inviteForm.email }),
    })

    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error ?? 'Failed to send invitation')
      setInviting(false)
      return
    }

    setInviteSent(true)
    setInviting(false)
    setShowInviteForm(false)
    setInviteForm({ fullName: '', email: '' })
    setTimeout(() => setInviteSent(false), 4000)
  }

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
          <div>
            <h2 className="font-bold text-[#002147]">Admin Users</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Full portal access with no restrictions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {inviteSent && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                ✓ Invitation sent
              </span>
            )}
            <button
              onClick={() => { setShowInviteForm((v) => !v); setInviteError(null) }}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#002147] hover:bg-[#001a38] px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite Admin
            </button>
          </div>
        </div>

        {showInviteForm && (
          <form onSubmit={sendAdminInvite} className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Admin Invitation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. sarah@xenithcapital.co.uk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
            </div>
            {inviteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inviteError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-40"
              >
                {inviting ? 'Sending…' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInviteForm(false); setInviteError(null) }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

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

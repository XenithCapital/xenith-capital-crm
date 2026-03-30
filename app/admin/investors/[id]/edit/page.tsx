'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STRATEGIES, STRATEGY_SERIES } from '@/lib/strategies'

interface Allocation {
  id?: string
  strategy: string
  fundedAmountUsd: string
  fundedAt: string
  accountNumber: string
  accountType: string
}

const emptyAllocation = (): Allocation => ({
  strategy: '', fundedAmountUsd: '', fundedAt: '', accountNumber: '', accountType: '',
})

export default function EditInvestorPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', notes: '', status: 'active',
  })
  const [allocations, setAllocations] = useState<Allocation[]>([emptyAllocation()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('investors').select('*').eq('id', id).single(),
      supabase.from('investor_allocations').select('*').eq('investor_id', id).order('created_at', { ascending: true }),
    ]).then(([{ data: inv }, { data: allocs }]) => {
      if (inv) {
        setForm({
          fullName: inv.full_name ?? '',
          email: inv.email ?? '',
          phone: inv.phone ?? '',
          notes: inv.notes ?? '',
          status: inv.status ?? 'active',
        })
      }
      if (allocs && allocs.length > 0) {
        setAllocations(allocs.map((a) => ({
          id: a.id,
          strategy: a.strategy ?? '',
          fundedAmountUsd: a.funded_amount_usd?.toString() ?? '',
          fundedAt: a.funded_at ?? '',
          accountNumber: a.account_number ?? '',
          accountType: a.account_type ?? '',
        })))
      } else if (inv) {
        // Fall back to legacy single-strategy fields
        setAllocations([{
          strategy: inv.strategy ?? '',
          fundedAmountUsd: inv.funded_amount_usd?.toString() ?? '',
          fundedAt: inv.funded_at ?? '',
          accountNumber: inv.vantage_account_number ?? '',
          accountType: inv.account_type ?? '',
        }])
      }
      setLoading(false)
    })
  }, [id])

  function setField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function updateAlloc(idx: number, key: keyof Allocation, value: string) {
    setAllocations((prev) => prev.map((a, i) => i === idx ? { ...a, [key]: value } : a))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/admin/investors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        notes: form.notes || null,
        status: form.status,
        allocations: allocations.filter((a) => a.strategy).map((a) => ({
          id: a.id ?? null,
          strategy: a.strategy,
          fundedAmountUsd: a.fundedAmountUsd ? parseFloat(a.fundedAmountUsd) : null,
          fundedAt: a.fundedAt || null,
          accountNumber: a.accountNumber || null,
          accountType: a.accountType || null,
        })),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save'); setSaving(false); return }
    router.push(`/admin/investors/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Edit Investor"
        description={form.fullName}
        actions={
          <Link href={`/admin/investors/${id}`} className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {/* Core details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-[#002147] text-sm uppercase tracking-wide">Investor Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.fullName} onChange={setField('fullName')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={setField('email')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={setField('phone')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={setField('status')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={setField('notes')} rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none" />
          </div>
        </div>

        {/* Strategy allocations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#002147] text-sm uppercase tracking-wide">Strategy Allocations</h3>
            <button type="button" onClick={() => setAllocations((p) => [...p, emptyAllocation()])}
              className="text-xs text-[#5FB548] hover:underline font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add account
            </button>
          </div>
          {allocations.map((alloc, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  {idx === 0 ? 'Primary Account' : `Account ${idx + 1}`}
                </span>
                {allocations.length > 1 && (
                  <button type="button" onClick={() => setAllocations((p) => p.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Strategy</label>
                  <select value={alloc.strategy} onChange={(e) => updateAlloc(idx, 'strategy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                    <option value="">Select strategy…</option>
                    {STRATEGY_SERIES.map((series) => (
                      <optgroup key={series.key} label={series.label}>
                        {STRATEGIES.filter((s) => s.series === series.key).map((s) => (
                          <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account No.</label>
                  <input type="text" value={alloc.accountNumber} onChange={(e) => updateAlloc(idx, 'accountNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Type</label>
                  <input type="text" value={alloc.accountType} placeholder="e.g. USD Standard" onChange={(e) => updateAlloc(idx, 'accountType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Funded (USD)</label>
                  <input type="number" value={alloc.fundedAmountUsd} min="0" step="0.01" onChange={(e) => updateAlloc(idx, 'fundedAmountUsd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Funded Date</label>
                  <input type="date" value={alloc.fundedAt} onChange={(e) => updateAlloc(idx, 'fundedAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <button type="submit" disabled={saving}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

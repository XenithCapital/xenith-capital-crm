'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewInvestorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillProspectId = searchParams.get('prospectId')
  const prefillIntroducerId = searchParams.get('introducerId')

  const [introducers, setIntroducers] = useState<Array<{ id: string; full_name: string }>>([])
  const [prospects, setProspects] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  const [form, setForm] = useState({
    prospectId: prefillProspectId ?? '',
    introducerId: prefillIntroducerId ?? '',
    fullName: '',
    email: '',
    phone: '',
    vantageAccountNumber: '',
    strategy: '',
    accountType: '',
    fundedAmountUsd: '',
    fundedAt: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('id, full_name').eq('role', 'introducer').then(({ data }) => {
      setIntroducers(data ?? [])
    })
    supabase.from('prospects').select('id, full_name, email').then(({ data }) => {
      setProspects(data ?? [])
    })

    // If prospect pre-filled, fetch their details
    if (prefillProspectId) {
      supabase.from('prospects').select('full_name, email, phone').eq('id', prefillProspectId).single()
        .then(({ data }) => {
          if (data) {
            setForm((f) => ({
              ...f,
              fullName: data.full_name,
              email: data.email,
              phone: data.phone ?? '',
            }))
          }
        })
    }
  }, [prefillProspectId])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectId: form.prospectId || null,
        introducerId: form.introducerId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        vantageAccountNumber: form.vantageAccountNumber || null,
        strategy: form.strategy || null,
        accountType: form.accountType || null,
        fundedAmountUsd: form.fundedAmountUsd ? parseFloat(form.fundedAmountUsd) : null,
        fundedAt: form.fundedAt || null,
        notes: form.notes || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create investor')
      setLoading(false)
      return
    }

    router.push(`/admin/investors/${data.investor.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Add Investor"
        description="Create a new investor record"
        actions={
          <Link href="/admin/investors" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Introducer <span className="text-red-500">*</span></label>
              <select value={form.introducerId} onChange={set('introducerId')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                <option value="">Select introducer…</option>
                {introducers.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Prospect</label>
              <select value={form.prospectId} onChange={set('prospectId')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                <option value="">None</option>
                {prospects.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.fullName} onChange={set('fullName')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vantage Account No.</label>
              <input type="text" value={form.vantageAccountNumber} onChange={set('vantageAccountNumber')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
              <select value={form.strategy} onChange={set('strategy')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]">
                <option value="">Select…</option>
                <option value="XQS">XQS</option>
                <option value="XNS">XNS</option>
                <option value="XXS">XXS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <input type="text" value={form.accountType} onChange={set('accountType')}
                placeholder="e.g. USD CENT, Standard"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funded Amount (USD)</label>
              <input type="number" value={form.fundedAmountUsd} onChange={set('fundedAmountUsd')}
                min="0" step="0.01"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funded Date</label>
              <input type="date" value={form.fundedAt} onChange={set('fundedAt')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm">
            {loading ? 'Creating…' : 'Create Investor'}
          </button>
        </div>
      </form>
    </div>
  )
}

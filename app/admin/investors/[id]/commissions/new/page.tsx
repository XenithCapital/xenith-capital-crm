'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

export default function NewCommissionPage() {
  const router = useRouter()
  const { id: investorId } = useParams<{ id: string }>()

  const [form, setForm] = useState({
    periodLabel: '',
    amountGbp: '',
    performanceFeeGbp: '',
    commissionRate: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const amount = parseFloat(form.amountGbp)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid commission amount.')
      setSaving(false)
      return
    }

    const res = await fetch('/api/admin/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investorId,
        periodLabel: form.periodLabel,
        amountGbp: amount,
        performanceFeeGbp: form.performanceFeeGbp ? parseFloat(form.performanceFeeGbp) : null,
        commissionRate: form.commissionRate ? parseFloat(form.commissionRate) / 100 : null,
        notes: form.notes || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create commission record')
      setSaving(false)
      return
    }

    router.push(`/admin/investors/${investorId}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Log Commission"
        description="Create a new commission record for this investor account"
        actions={
          <Link
            href={`/admin/investors/${investorId}`}
            className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        }
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-2xl">
        <p className="text-sm text-blue-800">
          <strong>Invoice-based.</strong> Once you save this record you can request an invoice from the
          introducer directly from the investor page. The commission will be marked as paid once you
          confirm receipt and process payment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Period <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.periodLabel}
              onChange={set('periodLabel')}
              required
              placeholder="e.g. March 2025 or Q1 2025"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
            />
            <p className="text-xs text-gray-400 mt-1">
              This label will appear on the invoice request email and in the introducer's earnings view.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Due (GBP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amountGbp}
                  onChange={set('amountGbp')}
                  required
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gross Perf. Fee (GBP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.performanceFeeGbp}
                  onChange={set('performanceFeeGbp')}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Optional — for your records</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.commissionRate}
                  onChange={set('commissionRate')}
                  placeholder="e.g. 15"
                  className="w-full px-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Optional — informational only</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Any additional context for this commission record…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, this note will appear in the invoice request email to the introducer.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
          >
            {saving ? 'Saving…' : 'Save Commission Record'}
          </button>
          <Link
            href={`/admin/investors/${investorId}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

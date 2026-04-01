import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ReferralRewardBadge } from '@/components/status-badge'
import { formatCurrency, formatDateOnlyLondon, getTierLabel } from '@/lib/utils'
import type { CommissionStatus } from '@/types/database'

const TIER_INFO = {
  tier_1: {
    label: 'Tier 1',
    rate: '15% of Performance Fee',
    aumRange: 'AUM USD 10,000 – 999,999',
    nextTier: 'Tier 2',
    nextThreshold: 'USD 1,000,000',
  },
  tier_2: {
    label: 'Tier 2',
    rate: '20% of Performance Fee',
    aumRange: 'AUM USD 1,000,000 – 9,999,999',
    nextTier: 'Tier 3',
    nextThreshold: 'USD 10,000,000',
  },
  tier_3: {
    label: 'Tier 3',
    rate: 'Individually agreed',
    aumRange: 'AUM USD 10,000,000+',
    nextTier: null,
    nextThreshold: null,
  },
}

export default async function PortalEarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [{ data: investors }, { data: commissions }] = await Promise.all([
    supabase
      .from('investors')
      .select('*')
      .eq('introducer_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('commissions')
      .select('*, investor:investor_id(full_name)')
      .eq('introducer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const investorList = investors ?? []
  const commissionList = commissions ?? []
  const totalAum = investorList.reduce((sum, inv) => sum + (inv.funded_amount_usd ?? 0), 0)

  // Commission totals
  const totalPaid = commissionList.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount_gbp ?? 0), 0)
  const totalPending = commissionList
    .filter((c) => ['pending', 'invoice_requested', 'invoice_received'].includes(c.status))
    .reduce((s, c) => s + (c.amount_gbp ?? 0), 0)

  const rewardsByStatus = {
    pending:   investorList.filter((i) => i.referral_reward_status === 'pending'),
    vested:    investorList.filter((i) => i.referral_reward_status === 'vested'),
    paid:      investorList.filter((i) => i.referral_reward_status === 'paid'),
    forfeited: investorList.filter((i) => i.referral_reward_status === 'forfeited'),
  }

  const tier = profile?.tier ?? 'tier_1'
  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO]

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings Overview" description="Read-only summary of your revenue share and referral rewards" />

      {/* Tier card */}
      <div className="bg-[#002147] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Your Current Tier</p>
            <h2 className="text-2xl font-bold">{tierInfo.label}</h2>
            <p className="text-[#5FB548] font-semibold mt-1">{tierInfo.rate}</p>
            <p className="text-white/60 text-sm mt-1">{tierInfo.aumRange}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Total Active AUM</p>
            <p className="text-2xl font-bold">{formatCurrency(totalAum)}</p>
            {tierInfo.nextTier && (
              <p className="text-white/60 text-sm mt-2">
                {formatCurrency(1000000 - totalAum > 0 ? 1000000 - totalAum : 0)} to {tierInfo.nextTier}
              </p>
            )}
          </div>
        </div>

        {tierInfo.nextTier && totalAum < (tier === 'tier_1' ? 1000000 : 10000000) && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{tier === 'tier_1' ? 'USD 10,000' : 'USD 1,000,000'}</span>
              <span>{tierInfo.nextThreshold}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-[#5FB548] h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (totalAum / (tier === 'tier_1' ? 1000000 : 10000000)) * 100)}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Commission summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Commissions Paid</p>
          <p className="text-2xl font-bold text-[#002147]">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totalPaid)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{commissionList.filter((c) => c.status === 'paid').length} payment{commissionList.filter((c) => c.status === 'paid').length !== 1 ? 's' : ''} processed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Commissions In Progress</p>
          <p className="text-2xl font-bold text-amber-600">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totalPending)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pending invoice or payment</p>
        </div>
      </div>

      {/* Commission history */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-[#002147] mb-4">Commission History</h2>
        {commissionList.length === 0 ? (
          <p className="text-sm text-gray-400">No commission records yet. Payments will appear here once logged by Xenith Capital.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Investor</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Amount (GBP)</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissionList.map((c) => {
                const status = c.status as CommissionStatus
                const inv = c.investor as { full_name: string } | null
                const statusConfig: Record<CommissionStatus, { label: string; cls: string }> = {
                  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-600' },
                  invoice_requested: { label: 'Invoice Requested', cls: 'bg-amber-100 text-amber-700' },
                  invoice_received: { label: 'Invoice Received', cls: 'bg-blue-100 text-blue-700' },
                  paid: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
                  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
                }
                const cfg = statusConfig[status]
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{c.period_label}</td>
                    <td className="px-3 py-2.5 text-gray-600">{inv?.full_name ?? '—'}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(c.amount_gbp)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {c.paid_at
                        ? formatDateOnlyLondon(c.paid_at)
                        : c.invoice_requested_at
                        ? formatDateOnlyLondon(c.invoice_requested_at)
                        : formatDateOnlyLondon(c.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Referral rewards summary */}
      <div>
        <h2 className="font-bold text-[#002147] mb-3">Referral Rewards</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: rewardsByStatus.pending.length, value: rewardsByStatus.pending.length * 500, color: 'bg-gray-50 border-gray-200' },
            { label: 'Vested', count: rewardsByStatus.vested.length, value: rewardsByStatus.vested.length * 500, color: 'bg-teal-50 border-teal-200' },
            { label: 'Paid', count: rewardsByStatus.paid.length, value: rewardsByStatus.paid.length * 500, color: 'bg-green-50 border-green-200' },
            { label: 'Forfeited', count: rewardsByStatus.forfeited.length, value: rewardsByStatus.forfeited.length * 500, color: 'bg-red-50 border-red-200' },
          ].map(({ label, count, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label} Rewards</p>
              <p className="text-xl font-bold text-gray-900">{count} <span className="text-sm font-normal text-gray-500">account{count !== 1 ? 's' : ''}</span></p>
              <p className="text-sm font-medium text-gray-700">{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active investors list */}
      {investorList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Active Investor Accounts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Investor</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Strategy</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Funded (USD)</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Referral Reward</th>
              </tr>
            </thead>
            <tbody>
              {investorList.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{inv.full_name}</td>
                  <td className="px-3 py-2">
                    {inv.strategy ? (
                      <span className="text-xs bg-[#002147]/10 text-[#002147] px-2 py-0.5 rounded font-mono">{inv.strategy}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 font-medium">{formatCurrency(inv.funded_amount_usd)}</td>
                  <td className="px-3 py-2"><ReferralRewardBadge status={inv.referral_reward_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Note:</strong> Revenue share calculations are provided by Xenith Capital monthly.
          The figures shown here are indicative only and do not constitute a confirmed statement of earnings.
          For queries regarding your earnings or payments, contact{' '}
          <a href="mailto:info@xenithcapital.co.uk" className="text-[#5FB548] hover:underline">
            info@xenithcapital.co.uk
          </a>.
        </p>
      </div>
    </div>
  )
}

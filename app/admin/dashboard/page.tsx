import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { ProspectStatusBadge } from '@/components/status-badge'
import Link from 'next/link'
import { formatDateLondon, formatCurrency } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const [
    { count: totalIntroducers },
    { count: totalProspects },
    { count: activeInvestors },
    { data: prospects },
    { data: coolingOffProspects },
    { data: vestingDue },
    { data: aumData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'introducer').eq('agreement_signed', true),
    supabase.from('prospects').select('*', { count: 'exact', head: true }),
    supabase.from('investors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('prospects').select('status'),
    supabase.from('prospects')
      .select('id, full_name, email, cooling_off_completed_at, introducer:introducer_id(full_name)')
      .eq('status', 'cooling_off')
      .order('cooling_off_completed_at', { ascending: true })
      .limit(10),
    supabase.from('investors')
      .select('id, full_name, vesting_end_date, referral_reward_status')
      .eq('referral_reward_status', 'pending')
      .gte('vesting_end_date', startOfMonth)
      .lte('vesting_end_date', endOfMonth),
    supabase.from('investors').select('funded_amount_usd').eq('status', 'active'),
  ])

  const totalAum = (aumData ?? []).reduce((sum, inv) => sum + (inv.funded_amount_usd ?? 0), 0)

  // Count by status
  const statusCounts: Record<string, number> = {}
  for (const p of prospects ?? []) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
  }

  const pipelineStatuses = [
    { status: 'cooling_off',          label: 'Cooling-Off' },
    { status: 'cooling_off_complete', label: 'Cooling-Off Complete' },
    { status: 'education_sent',       label: 'Onboarding Pack Issued' },
    { status: 'handoff_pending',      label: 'Introducer to Xenith Handoff' },
    { status: 'onboarding',           label: 'Pelican Onboarding' },
    { status: 'funded',               label: 'Funded' },
    { status: 'active',               label: 'Compliant & Active' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of the Xenith Capital Introducer Programme"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Introducers"
          value={totalIntroducers ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Prospects"
          value={totalProspects ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          title="Active Investors"
          value={activeInvestors ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total AUM"
          value={formatCurrency(totalAum)}
          subtitle="Active funded accounts"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Pipeline Summary</h2>
          <div className="space-y-2">
            {pipelineStatuses.map(({ status, label }) => {
              const count = statusCounts[status] ?? 0
              const max = Math.max(...pipelineStatuses.map((s) => statusCounts[s.status] ?? 0), 1)
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-500 text-right flex-shrink-0">{label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    <div
                      className="bg-[#002147] h-5 rounded-full transition-all"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                    {count > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="w-8 text-xs font-semibold text-gray-700 flex-shrink-0">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cooling off right now */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#002147]">Cooling Off Now</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {coolingOffProspects?.length ?? 0}
            </span>
          </div>
          {coolingOffProspects?.length === 0 ? (
            <p className="text-sm text-gray-400">No prospects currently cooling off.</p>
          ) : (
            <div className="space-y-2">
              {coolingOffProspects?.map((p) => {
                const intro = p.introducer as { full_name: string } | null
                return (
                  <Link
                    key={p.id}
                    href={`/admin/prospects/${p.id}`}
                    className="block p-2.5 rounded-lg hover:bg-gray-50 transition border border-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-500">via {intro?.full_name ?? '—'}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Due: {p.cooling_off_completed_at ? formatDateLondon(p.cooling_off_completed_at) : '—'}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vesting completions this month */}
      {(vestingDue?.length ?? 0) > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">
            Vesting Completions Due This Month ({vestingDue?.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Investor</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Vesting End</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Reward Status</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {vestingDue?.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{inv.full_name}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {inv.vesting_end_date ? formatDateLondon(inv.vesting_end_date, 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {inv.referral_reward_status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/investors/${inv.id}`}
                        className="text-xs text-[#5FB548] hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { ProspectStatusBadge } from '@/components/status-badge'
import { formatDateLondon, getTierLabel } from '@/lib/utils'
import Link from 'next/link'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const [
    { data: prospects },
    { count: activeInvestors },
    { data: coolingOffProspects },
    { data: vestingDue },
  ] = await Promise.all([
    supabase.from('prospects').select('*').eq('introducer_id', user.id),
    supabase.from('investors').select('*', { count: 'exact', head: true }).eq('introducer_id', user.id).eq('status', 'active'),
    supabase.from('prospects').select('id, full_name, cooling_off_completed_at').eq('introducer_id', user.id).eq('status', 'cooling_off').order('cooling_off_completed_at', { ascending: true }),
    supabase.from('investors').select('id, full_name, vesting_end_date, referral_reward_status').eq('introducer_id', user.id).eq('referral_reward_status', 'pending').gte('vesting_end_date', startOfMonth).lte('vesting_end_date', endOfMonth),
  ])

  const statusCounts: Record<string, number> = {}
  for (const p of prospects ?? []) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
  }

  const PIPELINE_STAGES = [
    { status: 'cooling_off', label: 'Cooling Off' },
    { status: 'cooling_off_complete', label: 'Cooling-Off Complete' },
    { status: 'education_sent', label: 'Education Sent' },
    { status: 'handoff_pending', label: 'Handoff Pending' },
    { status: 'onboarding', label: 'Onboarding' },
    { status: 'funded', label: 'Funded' },
    { status: 'active', label: 'Active' },
  ]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        description={`Introducer Portal · ${getTierLabel(profile?.tier ?? 'tier_1')}`}
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Prospects"
          value={prospects?.length ?? 0}
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
          title="Cooling Off Now"
          value={coolingOffProspects?.length ?? 0}
          subtitle="Complete within 24hrs of registration"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#002147]">Your Pipeline</h2>
            <Link href="/portal/prospects" className="text-xs text-[#5FB548] hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {PIPELINE_STAGES.map(({ status, label }) => {
              const count = statusCounts[status] ?? 0
              const max = Math.max(...PIPELINE_STAGES.map((s) => statusCounts[s.status] ?? 0), 1)
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-500 text-right flex-shrink-0">{label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    {count > 0 && (
                      <div className="bg-[#002147] h-5 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    )}
                    {count > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">{count}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/portal/prospects/new"
              className="inline-flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Register New Prospect
            </Link>
          </div>
        </div>

        {/* Cooling off */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Cooling Off</h2>
          {(coolingOffProspects?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">No prospects currently cooling off.</p>
          ) : (
            <div className="space-y-2">
              {coolingOffProspects?.map((p) => (
                <Link
                  key={p.id}
                  href={`/portal/prospects/${p.id}`}
                  className="block p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                >
                  <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Due: {p.cooling_off_completed_at ? formatDateLondon(p.cooling_off_completed_at) : '—'}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {(vestingDue?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Vesting Due This Month</h3>
              {vestingDue?.map((inv) => (
                <Link key={inv.id} href={`/portal/investors`}
                  className="block p-2 rounded-lg hover:bg-gray-50 border border-gray-100 transition mb-1">
                  <p className="text-sm font-medium text-gray-900">{inv.full_name}</p>
                  <p className="text-xs text-teal-600">Vesting: {inv.vesting_end_date ? formatDateLondon(inv.vesting_end_date, 'dd/MM/yyyy') : '—'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

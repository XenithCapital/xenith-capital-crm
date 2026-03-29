import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { InvestorStatusBadge, ReferralRewardBadge } from '@/components/status-badge'
import { VestingTracker } from '@/components/investors/vesting-tracker'
import { formatDateOnlyLondon, formatCurrency } from '@/lib/utils'

export default async function PortalInvestorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: investors } = await supabase
    .from('investors')
    .select('*')
    .eq('introducer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Investors"
        description={`${investors?.length ?? 0} investor account${(investors?.length ?? 0) !== 1 ? 's' : ''} (read-only)`}
      />

      {(investors?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No investor accounts yet. Your accounts will appear here once Xenith Capital confirms funding.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {investors?.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{inv.full_name}</h3>
                  <p className="text-sm text-gray-500">{inv.email}</p>
                  {inv.vantage_account_number && (
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{inv.vantage_account_number}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {inv.strategy && (
                    <span className="text-xs bg-[#002147]/10 text-[#002147] px-2 py-0.5 rounded font-mono font-bold">
                      {inv.strategy}
                    </span>
                  )}
                  <InvestorStatusBadge status={inv.status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Funded Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(inv.funded_amount_usd)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Account Type</p>
                  <p className="font-medium text-gray-900">{inv.account_type ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Funded Date</p>
                  <p className="font-medium text-gray-900">
                    {inv.funded_at ? formatDateOnlyLondon(inv.funded_at) : '—'}
                  </p>
                </div>
              </div>

              {/* Vesting tracker */}
              {inv.vesting_start_date && (
                <div className="border-t border-gray-100 pt-4">
                  <VestingTracker
                    vestingStartDate={inv.vesting_start_date}
                    vestingEndDate={inv.vesting_end_date}
                    referralRewardStatus={inv.referral_reward_status}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

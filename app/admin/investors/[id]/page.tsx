import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { InvestorStatusBadge } from '@/components/status-badge'
import { VestingTracker } from '@/components/investors/vesting-tracker'
import { formatDateLondon, formatDateOnlyLondon, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminInvestorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: investor, error } = await supabase
    .from('investors')
    .select(`
      *,
      introducer:introducer_id(id, full_name, email),
      prospect:prospect_id(id, full_name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !investor) notFound()

  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select('*')
    .eq('target_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const intro = investor.introducer as { id: string; full_name: string; email: string } | null
  const prospect = investor.prospect as { id: string; full_name: string } | null

  return (
    <div className="space-y-6">
      <PageHeader
        title={investor.full_name}
        description="Investor Account"
        actions={
          <Link href="/admin/investors" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            ← Back
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Account details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Account Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Full Name', value: investor.full_name },
              { label: 'Email', value: investor.email },
              { label: 'Phone', value: investor.phone ?? '—' },
              { label: 'Account No.', value: investor.vantage_account_number ?? '—' },
              { label: 'Strategy', value: investor.strategy ?? '—' },
              { label: 'Account Type', value: investor.account_type ?? '—' },
              { label: 'Funded (USD)', value: formatCurrency(investor.funded_amount_usd) },
              { label: 'Funded Date', value: investor.funded_at ? formatDateOnlyLondon(investor.funded_at) : '—' },
              { label: 'HWM', value: formatCurrency(investor.high_water_mark) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <InvestorStatusBadge status={investor.status} />
            </div>
            {intro && (
              <div className="flex justify-between">
                <span className="text-gray-500">Introducer</span>
                <Link href={`/admin/introducers/${intro.id}`} className="text-[#5FB548] font-medium hover:underline text-sm">
                  {intro.full_name}
                </Link>
              </div>
            )}
            {prospect && (
              <div className="flex justify-between">
                <span className="text-gray-500">Origin Prospect</span>
                <Link href={`/admin/prospects/${prospect.id}`} className="text-[#5FB548] font-medium hover:underline text-sm">
                  {prospect.full_name}
                </Link>
              </div>
            )}
          </div>
          {investor.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{investor.notes}</p>
            </div>
          )}
        </div>

        {/* Vesting + reward */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-[#002147] mb-4">Vesting & Referral Reward</h2>
            <VestingTracker
              vestingStartDate={investor.vesting_start_date}
              vestingEndDate={investor.vesting_end_date}
              referralRewardStatus={investor.referral_reward_status}
            />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-0.5">Vesting Start</p>
                  <p className="font-medium">
                    {investor.vesting_start_date ? formatDateOnlyLondon(investor.vesting_start_date) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Vesting End</p>
                  <p className="font-medium">
                    {investor.vesting_end_date ? formatDateOnlyLondon(investor.vesting_end_date) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit */}
          {(auditLogs?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-[#002147] mb-4">Audit History</h2>
              <div className="space-y-2">
                {auditLogs?.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 text-xs w-36 flex-shrink-0">{formatDateLondon(log.created_at)}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">{log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { InvestorStatusBadge } from '@/components/status-badge'
import { VestingTracker } from '@/components/investors/vesting-tracker'
import { formatDateLondon, formatDateOnlyLondon, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import InvestorStatusActions from './status-actions'
import CommissionActions from './commission-actions'
import type { CommissionStatus } from '@/types/database'

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

  const [{ data: allocations }, { data: auditLogs }, { data: commissions }] = await Promise.all([
    supabase
      .from('investor_allocations')
      .select('*')
      .eq('investor_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('audit_log')
      .select('*')
      .eq('target_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('commissions')
      .select('*')
      .eq('investor_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const intro = investor.introducer as { id: string; full_name: string; email: string } | null
  const prospect = investor.prospect as { id: string; full_name: string } | null

  const hasAllocations = (allocations?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={investor.full_name}
        description="Investor Account"
        actions={
          <div className="flex items-center gap-2">
            <InvestorStatusActions
              investorId={params.id}
              currentStatus={investor.status as 'active' | 'inactive' | 'withdrawn' | 'suspended'}
              investorName={investor.full_name}
            />
            <Link href={`/admin/investors/${params.id}/edit`} className="text-sm bg-[#5FB548] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#4ea038] transition">
              Edit
            </Link>
            <Link href="/admin/investors" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              ← Back
            </Link>
          </div>
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
              { label: 'Total Funded', value: formatCurrency(investor.funded_amount_usd) },
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

        {/* Right column */}
        <div className="col-span-2 space-y-4">

          {/* Strategy Allocations */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-[#002147] mb-4">Strategy Allocations</h2>
            {hasAllocations ? (
              <div className="space-y-3">
                {allocations!.map((alloc, idx) => (
                  <div key={alloc.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {idx === 0 ? 'Primary Account' : `Account ${idx + 1}`}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        alloc.referral_reward_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : alloc.referral_reward_status === 'vested'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        Reward: {alloc.referral_reward_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Strategy</p>
                        <p className="font-medium text-gray-900">{alloc.strategy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Account No.</p>
                        <p className="font-medium text-gray-900">{alloc.account_number ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Account Type</p>
                        <p className="font-medium text-gray-900">{alloc.account_type ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Funded (USD)</p>
                        <p className="font-semibold text-[#002147]">{formatCurrency(alloc.funded_amount_usd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Funded Date</p>
                        <p className="font-medium text-gray-900">{alloc.funded_at ? formatDateOnlyLondon(alloc.funded_at) : '—'}</p>
                      </div>
                      {alloc.vesting_end_date && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Vesting End</p>
                          <p className="font-medium text-gray-900">{formatDateOnlyLondon(alloc.vesting_end_date)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fall back to legacy single-strategy fields */
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Strategy', value: investor.strategy ?? '—' },
                  { label: 'Account No.', value: investor.vantage_account_number ?? '—' },
                  { label: 'Account Type', value: investor.account_type ?? '—' },
                  { label: 'Funded (USD)', value: formatCurrency(investor.funded_amount_usd) },
                  { label: 'Funded Date', value: investor.funded_at ? formatDateOnlyLondon(investor.funded_at) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vesting + reward (based on primary allocation or legacy fields) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-[#002147] mb-4">Vesting & Referral Reward</h2>
            <VestingTracker
              vestingStartDate={
                hasAllocations
                  ? allocations!.find((a) => a.vesting_start_date)?.vesting_start_date ?? investor.vesting_start_date
                  : investor.vesting_start_date
              }
              vestingEndDate={
                hasAllocations
                  ? allocations!.find((a) => a.vesting_end_date)?.vesting_end_date ?? investor.vesting_end_date
                  : investor.vesting_end_date
              }
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

          {/* Commissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#002147]">Commission Records</h2>
              <Link
                href={`/admin/investors/${params.id}/commissions/new`}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5FB548] hover:bg-[#4ea038] px-3 py-1.5 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Log Commission
              </Link>
            </div>
            {(commissions?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400">No commission records yet.</p>
            ) : (
              <div className="space-y-3">
                {commissions?.map((c) => {
                  const status = c.status as CommissionStatus
                  const statusStyles: Record<CommissionStatus, string> = {
                    pending: 'bg-gray-100 text-gray-600',
                    invoice_requested: 'bg-amber-100 text-amber-700',
                    invoice_received: 'bg-blue-100 text-blue-700',
                    paid: 'bg-green-100 text-green-700',
                    cancelled: 'bg-red-100 text-red-600',
                  }
                  const statusLabels: Record<CommissionStatus, string> = {
                    pending: 'Pending',
                    invoice_requested: 'Invoice Requested',
                    invoice_received: 'Invoice Received',
                    paid: 'Paid',
                    cancelled: 'Cancelled',
                  }
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.period_label}</p>
                          <p className="text-lg font-bold text-[#002147]">
                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(c.amount_gbp)}
                            {c.commission_rate && (
                              <span className="ml-1.5 text-xs font-normal text-gray-400">
                                ({(c.commission_rate * 100).toFixed(0)}%)
                              </span>
                            )}
                          </p>
                          {c.performance_fee_gbp && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Gross perf. fee: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(c.performance_fee_gbp)}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyles[status]}`}>
                          {statusLabels[status]}
                        </span>
                      </div>
                      {c.notes && (
                        <p className="text-xs text-gray-500 mb-2 italic">{c.notes}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">{formatDateLondon(c.created_at)}</p>
                        <CommissionActions commissionId={c.id} status={status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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

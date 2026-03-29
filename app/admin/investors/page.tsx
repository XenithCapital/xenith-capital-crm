import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { InvestorStatusBadge, ReferralRewardBadge } from '@/components/status-badge'
import { formatDateOnlyLondon, formatCurrency, getVestingProgress } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminInvestorsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('investors')
    .select(`
      *,
      introducer:introducer_id(id, full_name)
    `)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: investors } = await query

  const filtered = searchParams.search
    ? investors?.filter((inv) =>
        inv.full_name.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
        inv.email.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : investors

  return (
    <div>
      <PageHeader
        title="Investors"
        description={`${filtered?.length ?? 0} investor account${(filtered?.length ?? 0) !== 1 ? 's' : ''}`}
        actions={
          <Link
            href="/admin/investors/new"
            className="flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Investor
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search name or email…"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548] w-64"
          />
          <select
            name="status"
            defaultValue={searchParams.status ?? ''}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="suspended">Suspended</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-[#002147] text-white text-sm font-medium rounded-lg">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Investor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Introducer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategy</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Funded (USD)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vesting</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reward</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(filtered?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No investors found.</td>
              </tr>
            )}
            {filtered?.map((inv) => {
              const intro = inv.introducer as { id: string; full_name: string } | null
              const { percentComplete, isComplete } = getVestingProgress(inv.vesting_start_date, inv.vesting_end_date)
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{inv.full_name}</p>
                    <p className="text-xs text-gray-400">{inv.email}</p>
                    {inv.vantage_account_number && (
                      <p className="text-xs text-gray-400 font-mono">{inv.vantage_account_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {intro ? (
                      <Link href={`/admin/introducers/${intro.id}`} className="text-sm text-[#002147] hover:text-[#5FB548] font-medium">
                        {intro.full_name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {inv.strategy ? (
                      <span className="text-xs bg-[#002147]/10 text-[#002147] px-2 py-0.5 rounded font-mono font-medium">
                        {inv.strategy}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(inv.funded_amount_usd)}</td>
                  <td className="px-4 py-3"><InvestorStatusBadge status={inv.status} size="sm" /></td>
                  <td className="px-4 py-3">
                    {inv.vesting_start_date ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${percentComplete}%` }} />
                        </div>
                        <span className={`text-xs ${isComplete ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                          {isComplete ? '✓' : `${percentComplete}%`}
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><ReferralRewardBadge status={inv.referral_reward_status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/investors/${inv.id}`} className="text-xs text-[#5FB548] hover:underline font-medium">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ProspectStatusBadge, InvestorStatusBadge } from '@/components/status-badge'
import { formatDateLondon, formatDateOnlyLondon, formatCurrency, getTierLabel } from '@/lib/utils'
import Link from 'next/link'
import AgreementDownloadButton from './agreement-download-button'
import IntroducerStatusActions from './status-actions'
import { isSuperAdmin } from '@/lib/auth/permissions'

export default async function IntroducerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const superAdmin = isSuperAdmin(user?.email)

  const { data: introducer, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'introducer')
    .single()

  if (error || !introducer) {
    notFound()
  }

  const [
    { data: prospects },
    { data: investors },
    { data: tickets },
    { data: agreement },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.from('prospects').select('*').eq('introducer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('investors').select('*').eq('introducer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('support_tickets').select('*').eq('raised_by', params.id).order('created_at', { ascending: false }),
    supabase.from('agreements').select('*').eq('introducer_id', params.id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('audit_log').select('*').eq('actor_id', params.id).order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title={introducer.full_name}
        description={`Introducer · ${introducer.email}`}
        actions={
          <div className="flex items-center gap-2">
            <IntroducerStatusActions
              introducerId={params.id}
              currentStatus={(introducer.status as 'active' | 'dormant') ?? 'active'}
              introducerName={introducer.full_name}
            />
            {superAdmin && (
              <Link
                href={`/admin/introducers/${params.id}/edit`}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#5FB548] hover:bg-[#4ea038] px-4 py-2 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            )}
            <Link
              href="/admin/introducers"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-lg transition"
            >
              ← Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Profile</h2>
          {introducer.introducer_ref && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Introducer Ref</p>
              <span className="font-mono text-sm font-bold text-[#002147] bg-[#002147]/8 px-3 py-1.5 rounded-lg inline-block">
                {introducer.introducer_ref}
              </span>
            </div>
          )}
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: introducer.full_name },
              { label: 'Email', value: introducer.email },
              { label: 'Phone', value: introducer.phone ?? '—' },
              { label: 'Company', value: introducer.company_name ?? '—' },
              { label: 'Tier', value: getTierLabel(introducer.tier) },
              { label: 'Joined', value: formatDateOnlyLondon(introducer.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Agreement</span>
              {introducer.agreement_signed ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Signed</span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
              )}
            </div>
          </div>

          {agreement && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Agreement signed {formatDateLondon(agreement.signed_at)}</p>
              <AgreementDownloadButton agreementId={agreement.id} />
            </div>
          )}
        </div>

        {/* Prospects */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#002147]">Prospects ({prospects?.length ?? 0})</h2>
          </div>
          {(prospects?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">No prospects registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Registered</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {prospects?.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{p.full_name}</td>
                      <td className="px-3 py-2"><ProspectStatusBadge status={p.status} size="sm" /></td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{formatDateOnlyLondon(p.created_at)}</td>
                      <td className="px-3 py-2">
                        <Link href={`/admin/prospects/${p.id}`} className="text-xs text-[#5FB548] hover:underline">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Investors */}
      {(investors?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Investors ({investors?.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Strategy</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Funded</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {investors?.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{inv.full_name}</td>
                  <td className="px-3 py-2 text-gray-600">{inv.strategy ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{formatCurrency(inv.funded_amount_usd)}</td>
                  <td className="px-3 py-2"><InvestorStatusBadge status={inv.status} size="sm" /></td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/investors/${inv.id}`} className="text-xs text-[#5FB548] hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent audit */}
      {(auditLogs?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Recent Activity</h2>
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
  )
}

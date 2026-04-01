import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { formatDateOnlyLondon, getTierLabel } from '@/lib/utils'
import { isSuperAdmin } from '@/lib/auth/permissions'

export default async function AdminIntroducersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const superAdmin = isSuperAdmin(user?.email)

  const { data: allIntroducers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'introducer')
    .order('created_at', { ascending: false })

  // Get prospect and investor counts per introducer
  const { data: prospectCounts } = await supabase.from('prospects').select('introducer_id')
  const { data: investorCounts } = await supabase.from('investors').select('introducer_id')

  const prospectMap: Record<string, number> = {}
  const investorMap: Record<string, number> = {}
  for (const p of prospectCounts ?? []) prospectMap[p.introducer_id] = (prospectMap[p.introducer_id] ?? 0) + 1
  for (const i of investorCounts ?? []) investorMap[i.introducer_id] = (investorMap[i.introducer_id] ?? 0) + 1

  const internalIntroducers = (allIntroducers ?? []).filter((i) => i.is_internal)
  const externalIntroducers = (allIntroducers ?? []).filter((i) => !i.is_internal)

  const tableHeader = (
    <tr className="border-b border-gray-100 bg-gray-50/50">
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospects</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Investors</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agreement</th>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
      <th className="px-4 py-3"></th>
    </tr>
  )

  return (
    <div>
      <PageHeader
        title="Introducers"
        description={`${externalIntroducers.length} external · ${internalIntroducers.length} internal (XC team)`}
        actions={
          <div className="flex items-center gap-2">
            {superAdmin && (
              <Link
                href="/admin/introducers/new-internal"
                className="flex items-center gap-2 bg-[#002147] hover:bg-[#001a38] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Team Member
              </Link>
            )}
            <Link
              href="/admin/introducers/invite"
              className="flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite Introducer
            </Link>
          </div>
        }
      />

      {/* Internal XC team */}
      {internalIntroducers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 px-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Xenith Capital Team</h2>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>{tableHeader}</thead>
              <tbody>
                {internalIntroducers.map((intro) => (
                  <tr key={intro.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {intro.introducer_ref ? (
                        <span className="font-mono text-xs font-semibold text-[#002147] bg-[#002147]/8 px-2 py-1 rounded whitespace-nowrap">
                          {intro.introducer_ref}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#5FB548]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5FB548] font-semibold text-xs">
                            {intro.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{intro.full_name}</span>
                          <span className="text-xs bg-[#5FB548]/15 text-[#5FB548] px-1.5 py-0.5 rounded font-semibold">
                            Internal
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{intro.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {getTierLabel(intro.tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{prospectMap[intro.id] ?? 0}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{investorMap[intro.id] ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 italic">N/A</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateOnlyLondon(intro.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/introducers/${intro.id}`} className="text-xs text-[#5FB548] hover:underline font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* External introducers */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">External Introducers</h2>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>{tableHeader}</thead>
            <tbody>
              {externalIntroducers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No external introducers yet.{' '}
                    <Link href="/admin/introducers/invite" className="text-[#5FB548] hover:underline">
                      Invite one →
                    </Link>
                  </td>
                </tr>
              )}
              {externalIntroducers.map((intro) => (
                <tr key={intro.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {intro.introducer_ref ? (
                      <span className="font-mono text-xs font-semibold text-[#002147] bg-[#002147]/8 px-2 py-1 rounded whitespace-nowrap">
                        {intro.introducer_ref}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#002147]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#002147] font-semibold text-xs">
                          {intro.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{intro.full_name}</span>
                        {intro.company_name && (
                          <p className="text-xs text-gray-400">{intro.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{intro.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {getTierLabel(intro.tier)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{prospectMap[intro.id] ?? 0}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{investorMap[intro.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    {intro.agreement_signed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Signed</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDateOnlyLondon(intro.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/introducers/${intro.id}`} className="text-xs text-[#5FB548] hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box about invite flow */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">How the Invite flow works</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Clicking <strong>Invite Introducer</strong> sends a branded welcome email with a secure sign-up link.
              On first login they go through a 3-step onboarding wizard: review and digitally sign the introducer agreement,
              then complete their profile. Their signed PDF is stored securely and emailed to both parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

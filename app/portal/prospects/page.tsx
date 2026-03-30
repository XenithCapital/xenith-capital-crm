import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ProspectStatusBadge } from '@/components/status-badge'
import { formatDateOnlyLondon, formatDateLondon } from '@/lib/utils'
import Link from 'next/link'

export default async function PortalProspectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .eq('introducer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="My Prospects"
        description={`${prospects?.length ?? 0} prospects registered`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-gray-500 select-all font-mono">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'}/register/${user.id}`}
              </span>
            </div>
            <Link
              href="/portal/prospects/new"
              className="flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Register
            </Link>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cooling-Off</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(prospects?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="text-gray-400 mb-3">You haven't registered any prospects yet.</div>
                  <Link href="/portal/prospects/new"
                    className="text-sm text-[#5FB548] hover:underline font-medium">
                    Register your first prospect →
                  </Link>
                </td>
              </tr>
            )}
            {prospects?.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.country ?? '—'}</td>
                <td className="px-4 py-3"><ProspectStatusBadge status={p.status} size="sm" /></td>
                <td className="px-4 py-3 text-xs">
                  {p.status === 'cooling_off' ? (
                    <span className="text-amber-600 font-medium">
                      Due {p.cooling_off_completed_at ? formatDateLondon(p.cooling_off_completed_at, 'dd/MM HH:mm') : '—'}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateOnlyLondon(p.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/portal/prospects/${p.id}`} className="text-xs text-[#5FB548] hover:underline font-medium">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

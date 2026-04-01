import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ProspectStatusBadge } from '@/components/status-badge'
import { formatDateLondon, formatDateOnlyLondon } from '@/lib/utils'
import Link from 'next/link'
import ProspectsFilter from './prospects-filter'

export default async function AdminProspectsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('prospects')
    .select(`
      *,
      introducer:introducer_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: prospects } = await query

  const filtered = searchParams.search
    ? prospects?.filter((p) =>
        p.full_name.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
        p.email.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : prospects

  return (
    <div>
      <PageHeader
        title="Prospects"
        description={`${filtered?.length ?? 0} prospect${(filtered?.length ?? 0) !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/prospects/export"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </a>
            <Link
              href="/admin/prospects/new"
              className="flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Prospect
            </Link>
          </div>
        }
      />

      <ProspectsFilter />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Introducer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cooling-Off</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(filtered?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No prospects found.
                </td>
              </tr>
            )}
            {filtered?.map((p) => {
              const intro = p.introducer as { id: string; full_name: string } | null
              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {p.prospect_ref ? (
                      <span className="font-mono text-xs font-semibold text-[#002147] bg-[#002147]/8 px-2 py-1 rounded whitespace-nowrap">
                        {p.prospect_ref}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {intro ? (
                      <Link href={`/admin/introducers/${intro.id}`} className="text-sm text-[#002147] hover:text-[#5FB548] font-medium">
                        {intro.full_name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.country ?? '—'}</td>
                  <td className="px-4 py-3">
                    <ProspectStatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.cooling_off_completed_at
                      ? formatDateLondon(p.cooling_off_completed_at, 'dd/MM HH:mm')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateOnlyLondon(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/prospects/${p.id}`} className="text-xs text-[#5FB548] hover:underline font-medium">View →</Link>
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

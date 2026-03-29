import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ProspectStatusBadge } from '@/components/status-badge'
import { CoolingOffCountdown } from '@/components/prospects/cooling-off-countdown'
import { formatDateLondon, formatDateOnlyLondon } from '@/lib/utils'
import Link from 'next/link'

export default async function PortalProspectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', params.id)
    .eq('introducer_id', user.id)
    .single()

  if (error || !prospect) notFound()

  const { data: statusHistory } = await supabase
    .from('prospect_status_history')
    .select(`*, changer:changed_by(full_name, role)`)
    .eq('prospect_id', params.id)
    .order('changed_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title={prospect.full_name}
        description="Prospect Details (Read-Only)"
        actions={
          <Link href="/portal/prospects" className="text-sm text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            ← Back
          </Link>
        }
      />

      {/* Cooling-off countdown */}
      {prospect.status === 'cooling_off' && (
        <CoolingOffCountdown coolingOffCompletedAt={prospect.cooling_off_completed_at} />
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Prospect details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Full Name', value: prospect.full_name },
              { label: 'Email', value: prospect.email },
              { label: 'Phone', value: prospect.phone ?? '—' },
              { label: 'Country', value: prospect.country ?? '—' },
              { label: 'Registered', value: formatDateOnlyLondon(prospect.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <ProspectStatusBadge status={prospect.status} />
            </div>
          </div>

          {prospect.source_note && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Source Note</p>
              <p className="text-sm text-gray-700 leading-relaxed">{prospect.source_note}</p>
            </div>
          )}

          {prospect.status === 'cooling_off' && prospect.cooling_off_completed_at && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Cooling-Off Timeline</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Started: {formatDateLondon(prospect.cooling_off_started_at ?? prospect.created_at)}</p>
                <p>Completes: {formatDateLondon(prospect.cooling_off_completed_at)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status history */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Status History</h2>
          {(statusHistory?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">No status history yet.</p>
          ) : (
            <div className="space-y-3">
              {statusHistory?.map((h) => {
                const changer = h.changer as { full_name: string; role: string } | null
                // Only show notes shared by admin (heuristic: if changer is admin or system)
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#5FB548] mt-2 flex-shrink-0" />
                    <div className="flex-1 pb-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.old_status && (
                          <>
                            <ProspectStatusBadge status={h.old_status as Parameters<typeof ProspectStatusBadge>[0]['status']} size="sm" />
                            <span className="text-gray-400 text-xs">→</span>
                          </>
                        )}
                        <ProspectStatusBadge status={h.new_status as Parameters<typeof ProspectStatusBadge>[0]['status']} size="sm" />
                      </div>
                      {h.note && changer?.role === 'admin' && (
                        <p className="text-xs text-gray-600 mt-1 italic">{h.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateLondon(h.changed_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

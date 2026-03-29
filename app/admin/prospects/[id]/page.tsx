import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ProspectStatusBadge } from '@/components/status-badge'
import { CoolingOffCountdown } from '@/components/prospects/cooling-off-countdown'
import { formatDateLondon, formatDateOnlyLondon } from '@/lib/utils'
import Link from 'next/link'
import StatusUpdateForm from './status-update-form'

export default async function AdminProspectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select(`
      *,
      introducer:introducer_id(id, full_name, email)
    `)
    .eq('id', params.id)
    .single()

  if (error || !prospect) notFound()

  const { data: statusHistory } = await supabase
    .from('prospect_status_history')
    .select(`*, changer:changed_by(full_name)`)
    .eq('prospect_id', params.id)
    .order('changed_at', { ascending: false })

  const { data: linkedInvestor } = await supabase
    .from('investors')
    .select('id, full_name, strategy, status')
    .eq('prospect_id', params.id)
    .single()

  const intro = prospect.introducer as { id: string; full_name: string; email: string } | null

  return (
    <div className="space-y-6">
      <PageHeader
        title={prospect.full_name}
        description={`Prospect · via ${intro?.full_name ?? '—'}`}
        actions={
          <div className="flex items-center gap-3">
            {!linkedInvestor && (
              <Link
                href={`/admin/investors/new?prospectId=${prospect.id}&introducerId=${prospect.introducer_id}`}
                className="flex items-center gap-2 bg-[#5FB548] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#4ea038] transition"
              >
                Create Investor Record
              </Link>
            )}
            <Link href="/admin/prospects" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-lg transition">
              ← Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Prospect info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Prospect Details</h2>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: prospect.full_name },
              { label: 'Email', value: prospect.email },
              { label: 'Phone', value: prospect.phone ?? '—' },
              { label: 'Country', value: prospect.country ?? '—' },
              { label: 'Registered', value: formatDateOnlyLondon(prospect.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right max-w-[180px] truncate">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Status</span>
              <ProspectStatusBadge status={prospect.status} />
            </div>
            {intro && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Introducer</span>
                <Link href={`/admin/introducers/${intro.id}`} className="text-sm text-[#5FB548] font-medium hover:underline">
                  {intro.full_name}
                </Link>
              </div>
            )}
          </div>

          {prospect.source_note && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Source Note</p>
              <p className="text-sm text-gray-700 leading-relaxed">{prospect.source_note}</p>
            </div>
          )}

          {linkedInvestor && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Linked Investor</p>
              <Link href={`/admin/investors/${linkedInvestor.id}`}
                className="flex items-center gap-2 text-sm text-[#002147] hover:text-[#5FB548] font-medium">
                {linkedInvestor.full_name} · {linkedInvestor.strategy ?? 'No strategy'}
              </Link>
            </div>
          )}
        </div>

        {/* Status & cooling-off */}
        <div className="col-span-2 space-y-4">
          {/* Cooling off countdown */}
          {prospect.status === 'cooling_off' && (
            <CoolingOffCountdown coolingOffCompletedAt={prospect.cooling_off_completed_at} />
          )}

          {/* Status update form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-[#002147] mb-4">Update Status</h2>
            <StatusUpdateForm
              prospectId={prospect.id}
              currentStatus={prospect.status}
            />
          </div>

          {/* Status history */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-[#002147] mb-4">Status Timeline</h2>
            {(statusHistory?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400">No status history yet.</p>
            ) : (
              <div className="space-y-3">
                {statusHistory?.map((h) => {
                  const changer = h.changer as { full_name: string } | null
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
                        {h.note && <p className="text-xs text-gray-600 mt-1">{h.note}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateLondon(h.changed_at)} · {changer?.full_name ?? 'System'}
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
    </div>
  )
}

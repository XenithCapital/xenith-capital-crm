import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/status-badge'
import { formatDateLondon } from '@/lib/utils'
import NewTicketForm from './new-ticket-form'

export default async function PortalTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('raised_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Raise and track support requests" />

      <div className="grid grid-cols-3 gap-6">
        {/* New ticket form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-[#002147] mb-4">Raise a Ticket</h2>
          <NewTicketForm />
        </div>

        {/* Ticket list */}
        <div className="col-span-2 space-y-3">
          {(tickets?.length ?? 0) === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <p className="text-sm">No support tickets raised yet.</p>
            </div>
          ) : (
            tickets?.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{ticket.body}</p>

                {ticket.admin_response && (
                  <div className="bg-[#5FB548]/5 border border-[#5FB548]/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Response from Xenith Capital</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{ticket.admin_response}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">{formatDateLondon(ticket.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

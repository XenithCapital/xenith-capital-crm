import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/status-badge'
import { formatDateLondon } from '@/lib/utils'
import Link from 'next/link'
import TicketResponsePanel from './ticket-response-panel'

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: { ticketId?: string; status?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('support_tickets')
    .select(`*, raiser:raised_by(full_name, email)`)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: tickets } = await query

  // If a ticket is selected, show it
  const selectedTicket = searchParams.ticketId
    ? tickets?.find((t) => t.id === searchParams.ticketId)
    : null

  return (
    <div>
      <PageHeader title="Support Tickets" description={`${tickets?.length ?? 0} total tickets`} />

      <div className="flex items-center gap-3 mb-4">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <Link
            key={s}
            href={s ? `?status=${s}` : '?'}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              (searchParams.status ?? '') === s
                ? 'bg-[#002147] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="col-span-2 space-y-2">
          {(tickets?.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No tickets found.
            </div>
          )}
          {tickets?.map((ticket) => {
            const raiser = ticket.raiser as { full_name: string; email: string } | null
            const isSelected = ticket.id === searchParams.ticketId
            return (
              <Link
                key={ticket.id}
                href={`?ticketId=${ticket.id}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
                className={`block bg-white rounded-xl border p-4 hover:shadow-sm transition ${
                  isSelected ? 'border-[#5FB548] shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{ticket.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {raiser?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{ticket.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <TicketStatusBadge status={ticket.status} />
                    <TicketPriorityBadge priority={ticket.priority} />
                    <span className="text-xs text-gray-400">{formatDateLondon(ticket.created_at, 'dd/MM HH:mm')}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Ticket detail / response */}
        <div>
          {selectedTicket ? (
            <TicketResponsePanel ticket={selectedTicket} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-sm">Select a ticket to view and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

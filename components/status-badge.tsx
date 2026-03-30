import { cn } from '@/lib/utils'
import type { ProspectStatus, InvestorStatus, TicketStatus, TicketPriority } from '@/types/database'

const prospectStatusConfig: Record<ProspectStatus, { label: string; className: string }> = {
  registered:            { label: 'Registered',                    className: 'bg-gray-100 text-gray-700 border-gray-200' },
  cooling_off:           { label: 'Cooling-Off',                   className: 'bg-amber-100 text-amber-800 border-amber-200' },
  cooling_off_complete:  { label: 'Cooling-Off Complete',          className: 'bg-blue-100 text-blue-700 border-blue-200' },
  education_sent:        { label: 'Onboarding Pack Issued',        className: 'bg-sky-100 text-sky-700 border-sky-200' },
  handoff_pending:       { label: 'Introducer to Xenith Handoff',  className: 'bg-purple-100 text-purple-700 border-purple-200' },
  handed_off:            { label: 'Handed Off',                    className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  onboarding:            { label: 'Pelican Onboarding',            className: 'bg-orange-100 text-orange-700 border-orange-200' },
  funded:                { label: 'Funded',                        className: 'bg-teal-100 text-teal-700 border-teal-200' },
  active:                { label: 'Compliant & Active',            className: 'bg-green-100 text-green-700 border-green-200' },
  stalled:               { label: 'Stalled',                       className: 'bg-red-100 text-red-600 border-red-200' },
  lost:                  { label: 'Lost',                          className: 'bg-red-100 text-red-700 border-red-200' },
  rejected:              { label: 'Rejected',                      className: 'bg-red-200 text-red-900 border-red-300' },
}

const investorStatusConfig: Record<InvestorStatus, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-green-100 text-green-700 border-green-200' },
  inactive:  { label: 'Inactive',  className: 'bg-gray-100 text-gray-700 border-gray-200' },
  withdrawn: { label: 'Withdrawn', className: 'bg-red-100 text-red-700 border-red-200' },
  suspended: { label: 'Suspended', className: 'bg-amber-100 text-amber-800 border-amber-200' },
}

const ticketStatusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  resolved:    { label: 'Resolved',    className: 'bg-green-100 text-green-700 border-green-200' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const ticketPriorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600 border-gray-200' },
  normal: { label: 'Normal', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  high:   { label: 'High',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-200' },
}

interface ProspectStatusBadgeProps { status: ProspectStatus; size?: 'sm' | 'md' }
export function ProspectStatusBadge({ status, size = 'md' }: ProspectStatusBadgeProps) {
  const config = prospectStatusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1', config.className)}>
      {config.label}
    </span>
  )
}

interface InvestorStatusBadgeProps { status: InvestorStatus; size?: 'sm' | 'md' }
export function InvestorStatusBadge({ status, size = 'md' }: InvestorStatusBadgeProps) {
  const config = investorStatusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1', config.className)}>
      {config.label}
    </span>
  )
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = ticketStatusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium text-xs px-2.5 py-1', config.className)}>
      {config.label}
    </span>
  )
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = ticketPriorityConfig[priority]
  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium text-xs px-2.5 py-1', config.className)}>
      {config.label}
    </span>
  )
}

export function ReferralRewardBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    pending:   { label: 'Pending',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
    vested:    { label: 'Vested',    className: 'bg-teal-100 text-teal-700 border-teal-200' },
    paid:      { label: 'Paid',      className: 'bg-green-100 text-green-700 border-green-200' },
    forfeited: { label: 'Forfeited', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const config = configs[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium text-xs px-2.5 py-1', config.className)}>
      {config.label}
    </span>
  )
}

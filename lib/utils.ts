import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatInTimeZone } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const LONDON_TZ = 'Europe/London'

export function formatDateLondon(date: string | Date, fmt = 'dd/MM/yyyy HH:mm') {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, LONDON_TZ, fmt)
}

export function formatDateOnlyLondon(date: string | Date) {
  return formatDateLondon(date, 'dd/MM/yyyy')
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateOnlyLondon(d)
}

export function getVestingProgress(vestingStartDate: string | null, vestingEndDate: string | null): {
  daysElapsed: number
  daysRemaining: number
  percentComplete: number
  isComplete: boolean
} {
  if (!vestingStartDate || !vestingEndDate) {
    return { daysElapsed: 0, daysRemaining: 90, percentComplete: 0, isComplete: false }
  }

  const start = new Date(vestingStartDate)
  const end = new Date(vestingEndDate)
  const now = new Date()

  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = Math.min(now.getTime() - start.getTime(), totalMs)
  const daysElapsed = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, 90 - daysElapsed)
  const percentComplete = Math.min(100, Math.floor((daysElapsed / 90) * 100))
  const isComplete = now >= end

  return { daysElapsed, daysRemaining, percentComplete, isComplete }
}

export function getCoolingOffTimeRemaining(coolingOffCompletedAt: string | null): {
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
  totalSecondsRemaining: number
} {
  if (!coolingOffCompletedAt) {
    return { hours: 0, minutes: 0, seconds: 0, isComplete: true, totalSecondsRemaining: 0 }
  }

  const end = new Date(coolingOffCompletedAt)
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isComplete: true, totalSecondsRemaining: 0 }
  }

  const totalSecondsRemaining = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSecondsRemaining / 3600)
  const minutes = Math.floor((totalSecondsRemaining % 3600) / 60)
  const seconds = totalSecondsRemaining % 60

  return { hours, minutes, seconds, isComplete: false, totalSecondsRemaining }
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case 'tier_1': return 'Tier 1 (15%)'
    case 'tier_2': return 'Tier 2 (20%)'
    case 'tier_3': return 'Tier 3 (Custom)'
    default: return tier
  }
}

import type { Queue, Tier } from '../types'

export const tierLabels: Record<Tier, string> = {
  care_plus: 'Care Plus', care: 'Care', optimize: 'Optimize', free: 'Free',
}
export const queueLabels: Record<Queue, string> = {
  technician_review: 'Technician review', data_connectivity_review: 'Data / connectivity',
}
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
})
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', timeZone: 'UTC',
})
export function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00Z`)) : 'Not provided'
}
export function formatShortDate(value: string | null): string {
  return value ? shortDateFormatter.format(new Date(`${value}T00:00:00Z`)) : 'not available'
}
export function readingAge(days: number | null): string {
  if (days === null) return 'No readings in supplied period'
  return `${days} ${days === 1 ? 'day' : 'days'} before snapshot`
}

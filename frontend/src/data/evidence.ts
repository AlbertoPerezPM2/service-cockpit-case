import type { Reading } from '../types.ts'

export type SignalDay = {
  date: string
  state: 'signal_recorded' | 'other_reporting_day' | 'no_reading'
}

// A calendar projection of prepared observations, not a persistence/attention rule.
export function signalTimeline(readings: Reading[], rawSignal: string, snapshotDate: string): SignalDay[] {
  const observed = new Map(readings.map(reading => [reading.date, reading]))
  const end = new Date(`${snapshotDate}T00:00:00Z`)
  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(end.getUTCDate() - 29 + index)
    const date = day.toISOString().slice(0, 10)
    const reading = observed.get(date)
    return {
      date,
      state: !reading ? 'no_reading' : reading.rawSignal === rawSignal ? 'signal_recorded' : 'other_reporting_day',
    }
  })
}

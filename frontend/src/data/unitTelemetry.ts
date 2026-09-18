import type { FieldKey, Oem, Unit } from '../types.ts'

export const basicFields: Record<Oem, FieldKey[]> = {
  A: ['outdoor_temp_c', 'flow_temp_c', 'return_temp_c', 'dhw_actual_c', 'compressor_starts'],
  B: ['outdoor_temp_c', 'compressor_starts', 'electrical_energy_kwh', 'status_raw'],
  C: ['outdoor_temp_c', 'dhw_actual_c', 'electrical_energy_kwh'],
}

const trendFields: Record<Oem, FieldKey[]> = {
  A: ['flow_temp_c', 'return_temp_c'],
  B: ['compressor_starts'],
  C: ['dhw_actual_c'],
}

// Display the last 14 calendar days from the supplied snapshot, preserving gaps.
// This projection never changes data state, attention membership, or ordering.
export function recentUnitTrend(unit: Unit, snapshotDate: string) {
  const readings = new Map(unit.recentReadings.map(reading => [reading.date, reading]))
  const end = new Date(`${snapshotDate}T00:00:00Z`)
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(end.getUTCDate() - 13 + index)
    const date = day.toISOString().slice(0, 10)
    return { date, reporting: readings.has(date) }
  })
  const series = trendFields[unit.oem].map(key => ({
    key,
    values: days.map(({ date }) => {
      const reading = readings.get(date)
      const value = reading?.values[key]
      return typeof value === 'number' && Number.isFinite(value) && value !== -999
        && reading?.suspectedSentinels[key] === undefined ? value : null
    }),
  })).filter(series => series.values.filter(value => value !== null).length >= 2)
  // At least two actual observations are needed to present a field as a trend.
  return { kind: series.length ? 'measurements' as const : 'availability' as const, days, series }
}

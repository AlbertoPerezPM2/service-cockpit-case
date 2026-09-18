export type Oem = 'A' | 'B' | 'C'
export type Tier = 'care_plus' | 'care' | 'optimize' | 'free'
export type Queue = 'technician_review' | 'data_connectivity_review'
export type DataState = 'current' | 'stale' | 'no_telemetry'
export type FieldKey = 'outdoor_temp_c' | 'flow_temp_c' | 'return_temp_c' | 'dhw_actual_c'
  | 'electrical_energy_kwh' | 'thermal_energy_kwh' | 'compressor_starts' | 'defrost_cycles' | 'status_raw'
export type FieldDefinition = {
  label: string
  unit: string
  availability: 'observed' | 'intermittent' | 'unsupported'
}
export type Measurement = {
  rawValue: number | string | null
  value: number | string | null
  suspectedSentinel: boolean
  availability: 'available' | 'unsupported' | 'missing_for_unit' | 'missing_reading' | 'suspected_sentinel'
}
export type Reading = {
  date: string
  rawSignal: string | null
  values: Record<FieldKey, number | string | null>
  suspectedSentinels: Partial<Record<FieldKey, number>>
}
export type Unit = {
  unitId: string
  customerName: string
  oem: Oem
  region: string
  serviceTier: Tier
  commissioningDate: string | null
  lastServiceVisit: string | null
  connectivity: string
  dataQualityFlags: Array<'source_conflict' | 'service_date_conflict'>
  dataState: DataState
  hasTelemetry: boolean
  firstReading: string | null
  latestReading: string | null
  daysSinceLastReading: number | null
  reportingDays: number
  coveragePercent: number | null
  latestMeasurements: Record<FieldKey, Measurement>
  recentReadings: Reading[]
}
export type Signal = {
  type: 'persistent_oem_signal'
  label: string
  rawSignal: string
  persistenceDays: number
  firstObserved: string
  lastObserved: string
} | {
  type: 'telemetry_stopped'
  label: string
  lastReading: string
  daysStale: number
}
export type AttentionItem = {
  unitId: string
  queue: Queue
  signals: Signal[]
  sourceReason: string
  persistenceDays: number | null
  lastObserved: string | null
  daysStale: number | null
}
export type CockpitData = {
  schemaVersion: 1
  meta: {
    snapshotDate: string
    periodStart: string
    periodDays: number
    recentPeriodStart: string
    freshnessWindowDays: number
    availabilityBasis: 'supplied_data'
    sources: Record<string, string>
    excludedTelemetry: { rows: number; unitIds: string[] }
  }
  oemFields: Record<Oem, Record<FieldKey, FieldDefinition>>
  units: Unit[]
  attentionItems: AttentionItem[]
}
export type AttentionRow = { unit: Unit; attention: AttentionItem }
export type UnitSelection = { unit: Unit; attention: AttentionItem | null }

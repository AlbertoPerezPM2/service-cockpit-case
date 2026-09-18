import type { AttentionItem, CockpitData, FieldKey, Unit } from '../types.ts'

export const briefingSections = [
  { id: 'signalHistory', label: 'Signal history' },
  { id: 'telemetryStatus', label: 'Latest telemetry status' },
  { id: 'oemTelemetry', label: 'Latest available telemetry' },
  { id: 'dataLimitations', label: 'Data limitations' },
  { id: 'serviceContext', label: 'Service context' },
] as const

export type BriefingSection = (typeof briefingSections)[number]['id']
export type BriefingDraft = {
  sections: Record<BriefingSection, boolean>
  plannerNote: string
}

export function createBriefingDraft(): BriefingDraft {
  return {
    sections: { signalHistory: true, telemetryStatus: true, oemTelemetry: true, dataLimitations: true, serviceContext: true },
    plannerNote: '',
  }
}

export function visitReasons(attention: AttentionItem): string[] {
  return attention.signals.filter(signal => signal.type === 'persistent_oem_signal')
    .map(signal => `${signal.label} — ${signal.rawSignal}`)
}

// This is a projection of existing evidence. No attention, diagnosis, or ranking rules.
export function buildBriefing(data: CockpitData, unitId: string, draft: BriefingDraft) {
  const unit = data.units.find(unit => unit.unitId === unitId)
  const attention = data.attentionItems.find(item => item.unitId === unitId)
  if (!unit || !attention || attention.queue !== 'technician_review') {
    throw new Error('A Technical Visit Briefing requires an active technician-review case.')
  }
  const signals = attention.signals.filter(signal => signal.type === 'persistent_oem_signal')
  if (!signals.length) throw new Error('A prepared attention trigger is required.')

  const fields = Object.entries(data.oemFields[unit.oem]) as [FieldKey, CockpitData['oemFields'][Unit['oem']][FieldKey]][]
  const fieldNames = (condition: (key: FieldKey) => boolean) => fields.filter(([key]) => condition(key)).map(([, field]) => field.label)
  const conflicts: Array<{ title: string; detail: string; commissioningDate?: string | null; lastServiceVisit?: string | null }> = []
  if (unit.dataQualityFlags.includes('service_date_conflict')) {
    conflicts.push({ title: 'Source data conflict', detail: 'Last service visit predates commissioning date.',
      commissioningDate: unit.commissioningDate, lastServiceVisit: unit.lastServiceVisit })
  }
  if (unit.dataQualityFlags.includes('source_conflict')) {
    conflicts.push({ title: 'Source data conflict', detail: 'Installation source records contain conflicting connectivity values.' })
  }

  return {
    unit: { unitId: unit.unitId, customerName: unit.customerName, oem: unit.oem, serviceTier: unit.serviceTier, region: unit.region },
    snapshotDate: data.meta.snapshotDate,
    reasons: visitReasons(attention),
    // The trigger and its summary cannot be removed through evidence selections.
    signals: signals.map(signal => ({ ...signal })),
    conflicts,
    signalHistory: draft.sections.signalHistory ? structuredClone(unit.recentReadings) : null,
    telemetryStatus: draft.sections.telemetryStatus ? {
      dataState: unit.dataState, latestReading: unit.latestReading, daysSinceLastReading: unit.daysSinceLastReading,
      reportingDays: unit.reportingDays, periodDays: data.meta.periodDays, coveragePercent: unit.coveragePercent,
    } : null,
    oemTelemetry: draft.sections.oemTelemetry ? {
      readingDate: unit.latestReading,
      // Only the actual latest row. Never silently substitute an older reading.
      fields: fields.filter(([key]) => unit.latestMeasurements[key].availability === 'available'
        && !unit.latestMeasurements[key].suspectedSentinel && unit.latestMeasurements[key].value !== null)
        .map(([key, field]) => ({ key, label: field.label, unit: field.unit, value: unit.latestMeasurements[key].value! })),
    } : null,
    dataLimitations: draft.sections.dataLimitations ? {
      unsupported: fieldNames(key => data.oemFields[unit.oem][key].availability === 'unsupported'),
      intermittent: fieldNames(key => data.oemFields[unit.oem][key].availability === 'intermittent'),
      missingForUnit: fieldNames(key => unit.latestMeasurements[key].availability === 'missing_for_unit'),
      missingLatest: fieldNames(key => unit.latestMeasurements[key].availability === 'missing_reading'),
      suspectedSentinel: fieldNames(key => unit.latestMeasurements[key].suspectedSentinel),
    } : null,
    serviceContext: draft.sections.serviceContext ? {
      commissioningDate: unit.commissioningDate, lastServiceVisit: unit.lastServiceVisit,
    } : null,
    plannerNote: draft.plannerNote.trim() || null,
    selectedSections: briefingSections.filter(section => draft.sections[section.id]).map(section => section.id),
  }
}

export type Briefing = ReturnType<typeof buildBriefing>

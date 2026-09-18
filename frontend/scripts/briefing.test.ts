import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { briefingSections, buildBriefing, createBriefingDraft } from '../src/briefing/briefing.ts'
import type { CockpitData } from '../src/types.ts'
import { signalTimeline } from '../src/data/evidence.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))

test('confirmation starts with all five supporting sections selected and no note', () => {
  const draft = createBriefingDraft()
  assert.equal(draft.plannerNote, '')
  assert.deepEqual(briefingSections.map(section => section.label), [
    'Signal history', 'Latest telemetry status', 'Latest available telemetry', 'Data limitations', 'Service context',
  ])
  assert.ok(briefingSections.every(section => draft.sections[section.id]))
  draft.sections.signalHistory = false
  assert.equal(createBriefingDraft().sections.signalHistory, true)
})

test('TH-02312 briefing hands over actual unit identity, trigger, dated evidence and status', () => {
  const briefing = buildBriefing(data, 'TH-02312', createBriefingDraft())
  assert.deepEqual(briefing.unit, { unitId: 'TH-02312', customerName: 'Thorsten Oestreich', oem: 'C', serviceTier: 'care_plus', region: '50' })
  assert.deepEqual(briefing.reasons, ['Persistent OEM signal — ALM_HP_LOWFLOW'])
  assert.equal(briefing.snapshotDate, '2026-07-30')
  assert.equal(briefing.signals[0].firstObserved, '2026-07-17')
  assert.equal(briefing.signals[0].lastObserved, '2026-07-30')
  assert.equal(briefing.signals[0].persistenceDays, 14)
  assert.equal(briefing.telemetryStatus?.dataState, 'current')
  assert.equal(briefing.telemetryStatus?.latestReading, '2026-07-30')
  assert.equal(briefing.telemetryStatus?.reportingDays, 53)
  assert.equal(signalTimeline(briefing.signalHistory!, 'ALM_HP_LOWFLOW', briefing.snapshotDate)
    .filter(day => day.state === 'signal_recorded').length, 14)
})

test('service context and its conflict preserve both supplied dates', () => {
  const briefing = buildBriefing(data, 'TH-02312', createBriefingDraft())
  assert.deepEqual(briefing.serviceContext, { commissioningDate: '2024-08-03', lastServiceVisit: '2024-07-09' })
  assert.deepEqual(briefing.conflicts, [{ title: 'Source data conflict', detail: 'Last service visit predates commissioning date.',
    commissioningDate: '2024-08-03', lastServiceVisit: '2024-07-09' }])
  const missing = buildBriefing(data, 'TH-02298', createBriefingDraft())
  assert.equal(missing.serviceContext?.lastServiceVisit, null)
  assert.deepEqual(missing.conflicts, [])
})

test('section choices are honored without allowing the trigger or conflicts to disappear', () => {
  const draft = createBriefingDraft()
  for (const section of briefingSections) draft.sections[section.id] = false
  const briefing = buildBriefing(data, 'TH-02312', draft)
  for (const section of briefingSections) assert.equal(briefing[section.id], null)
  assert.deepEqual(briefing.selectedSections, [])
  assert.equal(briefing.reasons[0], 'Persistent OEM signal — ALM_HP_LOWFLOW')
  assert.equal(briefing.signals[0].persistenceDays, 14)
  assert.equal(briefing.conflicts.length, 1)
  assert.equal(briefing.conflicts[0].commissioningDate, '2024-08-03')
})

test('telemetry includes only actual latest available values, retaining raw status and zero values', () => {
  const briefing = buildBriefing(data, 'TH-02312', createBriefingDraft())
  const fields = briefing.oemTelemetry!.fields
  assert.equal(briefing.oemTelemetry?.readingDate, '2026-07-30')
  assert.equal(fields.find(field => field.key === 'outdoor_temp_c')?.value, 21.8)
  assert.equal(fields.find(field => field.key === 'electrical_energy_kwh')?.value, 1.23)
  assert.equal(fields.find(field => field.key === 'electrical_energy_kwh')?.unit, 'raw OEM value')
  assert.equal(fields.find(field => field.key === 'defrost_cycles')?.value, 0)
  assert.equal(fields.find(field => field.key === 'status_raw')?.value, 'OK')
  assert.ok(!fields.some(field => field.key === 'dhw_actual_c'))
  assert.ok(!fields.some(field => field.key === 'return_temp_c'))
  assert.equal(buildBriefing(data, 'TH-02298', createBriefingDraft()).oemTelemetry?.fields.find(field => field.key === 'status_raw')?.value, 'warn')
})

test('all technician-review briefings preserve missing-field categories and exclude suspected sentinels', () => {
  for (const attention of data.attentionItems.filter(item => item.queue === 'technician_review')) {
    const unit = data.units.find(unit => unit.unitId === attention.unitId)!
    const briefing = buildBriefing(data, unit.unitId, createBriefingDraft())
    for (const field of briefing.oemTelemetry!.fields) {
      const measurement = unit.latestMeasurements[field.key]
      assert.equal(measurement.availability, 'available')
      assert.equal(measurement.suspectedSentinel, false)
      assert.equal(field.value, measurement.value)
    }
  }
  const limitations = buildBriefing(data, 'TH-02312', createBriefingDraft()).dataLimitations!
  assert.deepEqual(limitations.unsupported, ['Return temperature', 'Thermal energy', 'Compressor starts'])
  assert.deepEqual(limitations.intermittent, ['Flow temperature', 'DHW temperature', 'Status'])
  assert.deepEqual(limitations.missingForUnit, ['Flow temperature'])
  assert.deepEqual(limitations.missingLatest, ['DHW temperature'])
})

test('optional planner note preserves text and line breaks without adding inferred content', () => {
  assert.equal(buildBriefing(data, 'TH-02312', { ...createBriefingDraft(), plannerNote: '  \n  ' }).plannerNote, null)
  const note = 'Source service dates conflict.\nCustomer requested a copy.'
  const briefing = buildBriefing(data, 'TH-02312', { ...createBriefingDraft(), plannerNote: ` ${note} ` })
  assert.equal(briefing.plannerNote, note)
  for (const forbidden of ['diagnosis', 'rootCause', 'repairRecommendation', 'severity', 'confidence', 'estimatedDuration']) {
    assert.ok(!(forbidden in briefing))
  }
})

test('briefing generation rejects data-connectivity, normal, and unknown units', () => {
  for (const unitId of ['TH-02023', 'TH-02001', 'TH-unknown']) {
    assert.throws(() => buildBriefing(data, unitId, createBriefingDraft()), /active technician-review case/)
  }
})

test('document generation does not mutate source data and produces a stable evidence snapshot', () => {
  const before = JSON.stringify(data)
  const draft = createBriefingDraft()
  const briefing = buildBriefing(data, 'TH-02312', draft)
  briefing.signalHistory![0].rawSignal = 'changed only in this test copy'
  briefing.signals[0].rawSignal = 'changed only in this test copy'
  draft.sections.signalHistory = false
  draft.plannerNote = 'changed after generation'
  assert.equal(JSON.stringify(data), before)
  assert.equal(briefing.plannerNote, null)
  assert.ok(briefing.signalHistory)
})

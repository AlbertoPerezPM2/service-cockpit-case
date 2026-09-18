import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { CockpitData } from '../src/types.ts'
import { emptyUnitFilters, selectUnit, selectUnits } from '../src/data/allUnits.ts'
import { recentUnitTrend } from '../src/data/unitTelemetry.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))
const normalUnits = data.units.filter(unit => !data.attentionItems.some(item => item.unitId === unit.unitId))

test('All Units includes the entire canonical fleet and defaults to Unit ID ordering', () => {
  const before = structuredClone(data.units)
  const units = selectUnits([...data.units].reverse(), emptyUnitFilters)
  assert.equal(units.length, 400)
  assert.equal(units.filter(unit => unit.hasTelemetry).length, 268)
  assert.deepEqual(['A', 'B', 'C'].map(oem => units.filter(unit => unit.oem === oem).length), [140, 150, 110])
  assert.deepEqual(units.map(unit => unit.unitId), data.units.map(unit => unit.unitId).sort())
  assert.deepEqual(data.units, before)
})

test('unit/customer search is case insensitive and trims surrounding whitespace', () => {
  assert.deepEqual(selectUnits(data.units, { ...emptyUnitFilters, search: ' th-02312 ' }).map(unit => unit.unitId), ['TH-02312'])
  assert.deepEqual(selectUnits(data.units, { ...emptyUnitFilters, search: 'THORSTEN OESTREICH' }).map(unit => unit.unitId), ['TH-02312'])
  assert.equal(selectUnits(data.units, { ...emptyUnitFilters, search: 'no-such-unit' }).length, 0)
})

test('all four filters combine immediately and no-telemetry units stay searchable', () => {
  assert.deepEqual(['current', 'stale', 'no_telemetry'].map(dataState => selectUnits(data.units, {
    ...emptyUnitFilters, dataState: dataState as 'current' | 'stale' | 'no_telemetry',
  }).length), [265, 3, 132])
  const unit = data.units.find(unit => unit.dataState === 'no_telemetry')!
  const filtered = selectUnits(data.units, { search: unit.customerName, oem: unit.oem, region: unit.region, tier: unit.serviceTier, dataState: 'no_telemetry' })
  assert.ok(filtered.some(row => row.unitId === unit.unitId))
  assert.ok(filtered.every(row => row.oem === unit.oem && row.region === unit.region && row.serviceTier === unit.serviceTier && row.dataState === 'no_telemetry'))
  assert.equal(selectUnits(data.units, { ...emptyUnitFilters, search: 'TH-02312', oem: 'A' }).length, 0)
})

test('shared drawer selection joins only existing attention and preserves source objects', () => {
  for (const unit of data.units) {
    const selection = selectUnit(data, unit.unitId)!
    assert.equal(selection.unit, unit)
    assert.equal(selection.attention, data.attentionItems.find(item => item.unitId === unit.unitId) ?? null)
  }
  assert.equal(selectUnit(data, 'TH-02312')?.attention?.queue, 'technician_review')
  assert.equal(selectUnit(data, 'TH-02023')?.attention?.queue, 'data_connectivity_review')
  assert.equal(selectUnit(data, 'TH-90000'), null)
  assert.equal(normalUnits.length, 393)
})

test('normal units receive one OEM-specific trend with exactly 14 snapshot calendar days', () => {
  const expected = { A: ['flow_temp_c', 'return_temp_c'], B: ['compressor_starts'], C: ['dhw_actual_c'] }
  for (const oem of ['A', 'B', 'C'] as const) {
    const unit = normalUnits.find(unit => unit.oem === oem && recentUnitTrend(unit, data.meta.snapshotDate).kind === 'measurements')!
    assert.ok(unit, `No real OEM ${oem} trend`)
    const trend = recentUnitTrend(unit, data.meta.snapshotDate)
    assert.deepEqual(trend.series.map(series => series.key), expected[oem])
    assert.equal(trend.days.length, 14)
    assert.equal(trend.days[0].date, '2026-07-17')
    assert.equal(trend.days.at(-1)?.date, '2026-07-30')
  }
})

test('trend values are exact prepared observations; absent and sentinel values stay null', () => {
  const before = structuredClone(data)
  let sentinelGaps = 0
  let reportingGaps = 0
  for (const unit of normalUnits) {
    const trend = recentUnitTrend(unit, data.meta.snapshotDate)
    for (const series of trend.series) trend.days.forEach((day, index) => {
      const reading = unit.recentReadings.find(reading => reading.date === day.date)
      const value = reading?.values[series.key]
      assert.equal(series.values[index], typeof value === 'number' && value !== -999 && reading?.suspectedSentinels[series.key] === undefined ? value : null)
      if (reading?.suspectedSentinels[series.key] !== undefined) { sentinelGaps++; assert.equal(series.values[index], null) }
      if (!reading) { reportingGaps++; assert.equal(series.values[index], null) }
    })
  }
  assert.ok(sentinelGaps > 0)
  assert.ok(reportingGaps > 0)
  assert.deepEqual(data, before)
})

test('unavailable OEM trends fall back to actual reporting days, including zero-telemetry cases', () => {
  const noTelemetry = normalUnits.filter(unit => !unit.hasTelemetry)
  assert.equal(noTelemetry.length, 132)
  for (const unit of noTelemetry) {
    const trend = recentUnitTrend(unit, data.meta.snapshotDate)
    assert.equal(trend.kind, 'availability')
    assert.equal(trend.days.filter(day => day.reporting).length, 0)
    assert.deepEqual(trend.series, [])
  }
  const unit = selectUnit(data, 'TH-02292')!.unit
  const fallback = recentUnitTrend(unit, data.meta.snapshotDate)
  assert.equal(fallback.kind, 'availability')
  assert.equal(fallback.days.filter(day => day.reporting).length, unit.recentReadings.filter(reading => reading.date >= '2026-07-17').length)
  assert.ok(fallback.days.some(day => day.reporting))
})

test('Current units retain their actual previous-day reading and a gap on the snapshot day', () => {
  const units = normalUnits.filter(unit => unit.dataState === 'current' && unit.daysSinceLastReading === 1)
  assert.equal(units.length, 6)
  for (const unit of units) {
    assert.equal(unit.latestReading, '2026-07-29')
    const trend = recentUnitTrend(unit, data.meta.snapshotDate)
    assert.equal(trend.days.at(-1)?.reporting, false)
    for (const series of trend.series) assert.equal(series.values.at(-1), null)
  }
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { emptyFilters, getAttentionRows, selectRows } from '../src/data/selectors.ts'
import type { CockpitData, Queue } from '../src/types.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))
const rows = getAttentionRows(data)
const defaultSort = { key: 'default', direction: 'asc' } as const
const ids = (queue: Queue, filters = emptyFilters) => selectRows(rows, queue, filters, defaultSort).map(row => row.unit.unitId)

test('prepared cohorts use observed evidence and deterministic Unit ID ties', () => {
  assert.deepEqual(ids('technician_review'), ['TH-02298', 'TH-02312', 'TH-02395', 'TH-02398'])
  assert.deepEqual(ids('data_connectivity_review'), ['TH-02023', 'TH-02280', 'TH-02304'])
  assert.equal(rows.length, 7)
  assert.equal(data.units.length, 400)
  assert.equal(data.units.filter(unit => unit.hasTelemetry).length, 268)
})

test('changing service tiers cannot change default priority in either queue', () => {
  const reversed = [...rows].reverse().map((row, i) => ({ ...row, unit: { ...row.unit, serviceTier: (['free', 'care_plus', 'care', 'optimize'] as const)[i % 4] } }))
  for (const queue of ['technician_review', 'data_connectivity_review'] as const) {
    assert.deepEqual(selectRows(reversed, queue, emptyFilters, defaultSort).map(row => row.unit.unitId), ids(queue))
  }
})

test('technical review orders persistence before recency, independent of tier', () => {
  const sample = rows.filter(row => row.attention.queue === 'technician_review').map((row, i) => ({
    ...row, unit: { ...row.unit, unitId: `TEST-${i}`, serviceTier: (['care_plus', 'free', 'care', 'optimize'] as const)[i] },
    attention: { ...row.attention, persistenceDays: [2, 14, 14, 14][i], lastObserved: ['2026-07-30', '2026-07-29', '2026-07-30', '2026-07-30'][i] },
  }))
  assert.deepEqual(selectRows(sample.reverse(), 'technician_review', emptyFilters, defaultSort).map(row => row.unit.unitId), ['TEST-2', 'TEST-3', 'TEST-1', 'TEST-0'])
})

test('connectivity review orders stale days before Unit ID, ignoring unrelated recurrence', () => {
  const sample = rows.filter(row => row.attention.queue === 'data_connectivity_review').map((row, i) => ({
    ...row, unit: { ...row.unit, unitId: `TEST-${i}` },
    attention: { ...row.attention, daysStale: [2, 10, 10][i], persistenceDays: [100, 0, 50][i] },
  }))
  assert.deepEqual(selectRows(sample.reverse(), 'data_connectivity_review', emptyFilters, defaultSort).map(row => row.unit.unitId), ['TEST-1', 'TEST-2', 'TEST-0'])
})

test('search matches unit or customer case-insensitively and combines filters', () => {
  assert.deepEqual(ids('technician_review', { ...emptyFilters, search: ' th-02312 ' }), ['TH-02312'])
  assert.deepEqual(ids('technician_review', { ...emptyFilters, search: 'dAgMaR', tier: 'care_plus', region: '90', oem: 'C', reason: 'persistent_oem_signal' }), ['TH-02398'])
  assert.deepEqual(ids('technician_review', { ...emptyFilters, oem: 'A' }), [])
  assert.deepEqual(ids('data_connectivity_review', { ...emptyFilters, reason: 'persistent_oem_signal' }), [])
  assert.deepEqual(ids('data_connectivity_review', { ...emptyFilters, oem: 'B', reason: 'telemetry_stopped' }), ['TH-02280'])
})

test('user sorting changes display order without mutating prepared queue or data', () => {
  const before = JSON.stringify(rows)
  assert.deepEqual(selectRows(rows, 'technician_review', emptyFilters, { key: 'tier', direction: 'desc' }).map(row => row.unit.unitId),
    ['TH-02298', 'TH-02395', 'TH-02312', 'TH-02398'])
  assert.deepEqual(selectRows(rows, 'data_connectivity_review', emptyFilters, { key: 'oem', direction: 'desc' }).map(row => row.unit.oem), ['C', 'B', 'A'])
  assert.deepEqual(selectRows(rows, 'data_connectivity_review', emptyFilters, { key: 'region', direction: 'asc' }).map(row => row.unit.region), ['10', '44', '90'])
  assert.equal(JSON.stringify(rows), before)
})

test('latest-reading sort handles recency and missing dates in either direction', () => {
  const sample = rows.filter(row => row.attention.queue === 'technician_review').slice(0, 3).map((row, index) => ({
    ...row, unit: { ...row.unit, latestReading: ['2026-07-29', null, '2026-07-30'][index]! },
  }))
  for (const direction of ['asc', 'desc'] as const) {
    const dates = selectRows(sample, 'technician_review', emptyFilters, { key: 'latest', direction }).map(row => row.unit.latestReading)
    assert.deepEqual(dates, direction === 'asc' ? ['2026-07-29', '2026-07-30', null] : ['2026-07-30', '2026-07-29', null])
  }
})

test('missing attention identity fails instead of silently dropping a candidate', () => {
  assert.throws(() => getAttentionRows({ ...data, units: [] }), /no resolved unit/)
})

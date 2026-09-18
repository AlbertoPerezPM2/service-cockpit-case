import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { signalTimeline } from '../src/data/evidence.ts'
import { emptyFilters, getAttentionRows, selectRows } from '../src/data/selectors.ts'
import type { CockpitData } from '../src/types.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))

test('all four persistent-signal timelines use the 14 actual dated July observations', () => {
  const expectedDates = Array.from({ length: 14 }, (_, index) => `2026-07-${17 + index}`)
  const attention = data.attentionItems.filter(item => item.queue === 'technician_review')
  assert.equal(attention.length, 4)
  for (const item of attention) {
    const unit = data.units.find(unit => unit.unitId === item.unitId)!
    const before = JSON.stringify(unit.recentReadings)
    const days = signalTimeline(unit.recentReadings, 'ALM_HP_LOWFLOW', data.meta.snapshotDate)
    assert.equal(days.length, 30)
    assert.equal(days[0].date, '2026-07-01')
    assert.equal(days.at(-1)?.date, '2026-07-30')
    assert.deepEqual(days.filter(day => day.state === 'signal_recorded').map(day => day.date), expectedDates)
    assert.equal(JSON.stringify(unit.recentReadings), before)
  }
})

test('a missing reading is distinct from a reporting day without the target signal', () => {
  const unit = data.units.find(unit => unit.unitId === 'TH-02312')!
  const days = signalTimeline(unit.recentReadings, 'ALM_HP_LOWFLOW', data.meta.snapshotDate)
  assert.equal(days.find(day => day.date === '2026-07-13')?.state, 'no_reading')
  assert.equal(days.find(day => day.date === '2026-07-14')?.state, 'other_reporting_day')
  assert.equal(days.find(day => day.date === '2026-07-17')?.state, 'signal_recorded')
  const differentSignal = [{ ...unit.recentReadings[0], rawSignal: 'ALM_SM_LINK' }]
  assert.equal(signalTimeline(differentSignal, 'ALM_HP_LOWFLOW', data.meta.snapshotDate)[0].state, 'other_reporting_day')
})

test('calendar projection handles a month boundary and never fabricates observations', () => {
  const days = signalTimeline([], 'ALM_HP_LOWFLOW', '2026-08-01')
  assert.equal(days[0].date, '2026-07-03')
  assert.equal(days.at(-1)?.date, '2026-08-01')
  assert.ok(days.every(day => day.state === 'no_reading'))
  const unit = data.units.find(unit => unit.unitId === 'TH-02312')!
  const outsideWindow = [{ ...unit.recentReadings[0], date: '2026-06-30', rawSignal: 'ALM_HP_LOWFLOW' }]
  assert.ok(signalTimeline(outsideWindow, 'ALM_HP_LOWFLOW', data.meta.snapshotDate).every(day => day.state === 'no_reading'))
})

test('service data conflicts do not change attention membership, queue, or ordering', () => {
  const originalRows = getAttentionRows(data)
  const unflaggedRows = originalRows.map(row => ({ ...row, unit: { ...row.unit, dataQualityFlags: [] } }))
  assert.ok(originalRows.find(row => row.unit.unitId === 'TH-02312')?.unit.dataQualityFlags.includes('service_date_conflict'))
  for (const queue of ['technician_review', 'data_connectivity_review'] as const) {
    const sort = { key: 'default', direction: 'asc' } as const
    assert.deepEqual(selectRows(originalRows, queue, emptyFilters, sort).map(row => row.attention),
      selectRows(unflaggedRows, queue, emptyFilters, sort).map(row => row.attention))
  }
})

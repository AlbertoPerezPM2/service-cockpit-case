import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import type { CockpitData, UnitSelection } from '../src/types.ts'
import { selectUnit } from '../src/data/allUnits.ts'
import { recentUnitTrend } from '../src/data/unitTelemetry.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))
let server: ViteDevServer
let AllUnitsPage: typeof import('../src/pages/AllUnitsPage.tsx').AllUnitsPage
let NeedsAttentionPage: typeof import('../src/pages/NeedsAttentionPage.tsx').NeedsAttentionPage
let UnitDrawer: typeof import('../src/components/UnitDrawer.tsx').UnitDrawer
let AllUnitsTable: typeof import('../src/components/AllUnitsTable.tsx').AllUnitsTable
let BriefingConfirmation: typeof import('../src/briefing/BriefingConfirmation.tsx').BriefingConfirmation
let AppShell: typeof import('../src/components/AppShell.tsx').AppShell
import { createBriefingDraft } from '../src/briefing/briefing.ts'

// Inline modal contents for SSR assertions; production retains MUI portals.
const inlineModalTheme = createTheme({ components: { MuiModal: { defaultProps: { disablePortal: true } } } })
function drawerMarkup(selected: UnitSelection): string {
  return renderToStaticMarkup(createElement(ThemeProvider, { theme: inlineModalTheme }, createElement(UnitDrawer, {
    selected, data, onClose() {}, onPrepareBriefing() {},
  })))
}
before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false, hmr: false, watch: null }, appType: 'custom' })
  AllUnitsPage = (await server.ssrLoadModule('/src/pages/AllUnitsPage.tsx')).AllUnitsPage
  NeedsAttentionPage = (await server.ssrLoadModule('/src/pages/NeedsAttentionPage.tsx')).NeedsAttentionPage
  UnitDrawer = (await server.ssrLoadModule('/src/components/UnitDrawer.tsx')).UnitDrawer
  AllUnitsTable = (await server.ssrLoadModule('/src/components/AllUnitsTable.tsx')).AllUnitsTable
  BriefingConfirmation = (await server.ssrLoadModule('/src/briefing/BriefingConfirmation.tsx')).BriefingConfirmation
  AppShell = (await server.ssrLoadModule('/src/components/AppShell.tsx')).AppShell
})
after(async () => { await server?.close() })

test('All Units renders derived fleet counts, all filters, and the first Unit ID page', () => {
  const html = renderToStaticMarkup(createElement(AllUnitsPage, { data, active: true, briefingVisible: false, onGenerateBriefing() {} }))
  for (const text of ['All Units', '400 resolved units monitored', '268 with telemetry', 'Data state', 'Service tier', 'OEM', 'Region', 'Search unit or customer', 'TH-02001', 'TH-02025', 'Ordered by Unit ID']) assert.ok(html.includes(text), `Missing: ${text}`)
  assert.ok(!html.includes('TH-02026'))
  assert.ok(!html.includes('Review queues'))
  const smallerSnapshot = { ...data, units: data.units.slice(0, 10) }
  const smallHtml = renderToStaticMarkup(createElement(AllUnitsPage, { data: smallerSnapshot, active: true, briefingVisible: false, onGenerateBriefing() {} }))
  assert.ok(smallHtml.includes('10 resolved units monitored'))
  assert.ok(smallHtml.includes(`${smallerSnapshot.units.filter(unit => unit.hasTelemetry).length} with telemetry`))
})

test('normal units use the shared drawer without a briefing CTA and with exactly one relevant chart', () => {
  for (const oem of ['A', 'B', 'C'] as const) {
    const unit = data.units.find(unit => unit.oem === oem && !selectUnit(data, unit.unitId)?.attention && recentUnitTrend(unit, data.meta.snapshotDate).kind === 'measurements')!
    const html = drawerMarkup(selectUnit(data, unit.unitId)!)
    for (const text of [unit.unitId, 'No active attention signals', 'Latest values', 'Recent trend', 'Service context', 'Data limitations']) assert.ok(html.includes(text), `Missing ${text} for OEM ${oem}`)
    assert.equal((html.match(/role="img"/g) ?? []).length, 1)
    assert.ok(!html.includes('Prepare Technical Visit Briefing'))
    assert.ok(!html.includes('Recent evidence'))
    assert.ok(html.includes(oem === 'A' ? 'Flow temperature + Return temperature' : oem === 'B' ? 'Compressor starts' : 'DHW temperature'))
    assert.ok(html.includes('Reported values only. Gaps remain unconnected; -999 values are omitted from charts pending source validation.'))
  }
})

test('normal drawer distinguishes no telemetry, missing latest data, and suspected sentinels', () => {
  const noTelemetry = data.units.find(unit => !unit.hasTelemetry)!
  const absent = drawerMarkup(selectUnit(data, noTelemetry.unitId)!)
  assert.ok(absent.includes('No readings in the supplied period.'))
  assert.ok(absent.includes('Telemetry availability'))
  assert.ok(absent.includes('0 / 14 reporting days'))
  const sparse = drawerMarkup(selectUnit(data, 'TH-02292')!)
  assert.ok(sparse.includes('Unavailable in latest reading'))
  assert.ok(sparse.includes('Telemetry availability'))
  assert.ok(sparse.includes('raw OEM value'))
  const sentinel = drawerMarkup(selectUnit(data, 'TH-02009')!)
  assert.ok(sentinel.includes('Unavailable · suspected sentinel (−999)'))
  assert.ok(!sentinel.includes('-999 °C'))
  assert.ok(!sentinel.includes('Invalid reading'))
})

test('existing attention drawers retain their evidence/CTA behavior when selected through All Units', () => {
  const technician = drawerMarkup(selectUnit(data, 'TH-02312')!)
  for (const text of ['ALM_HP_LOWFLOW', 'Observed on 14 reporting days', 'Recent evidence', 'Prepare Technical Visit Briefing', 'Last service visit predates commissioning date.']) assert.ok(technician.includes(text), `Missing: ${text}`)
  assert.ok(!technician.includes('Recent trend'))
  assert.ok(!technician.includes('Latest values'))
  assert.ok(!technician.includes('No active attention signals'))
  assert.ok(technician.includes('Dispatch remains a planner decision.'))
  const connectivity = drawerMarkup(selectUnit(data, 'TH-02023')!)
  assert.ok(connectivity.includes('Investigate telemetry or integration issues before considering field service.'))
  assert.ok(!connectivity.includes('Prepare Technical Visit Briefing'))
  assert.ok(!connectivity.includes('Recent trend'))
})

test('default worklist explains evidence ordering and separates technical review from dispatch', () => {
  const html = renderToStaticMarkup(createElement(NeedsAttentionPage, { data, active: true, briefingVisible: false, onGenerateBriefing() {} }))
  assert.ok(html.includes('Ordered by observed evidence; service tier is shown for context and does not affect default priority.'))
  assert.ok(html.includes('Repeated equipment signals that merit technical review. Dispatch remains a planner decision.'))
  assert.ok(!html.includes('Ordered by tier'))
  const unitIds = ['TH-02298', 'TH-02312', 'TH-02395', 'TH-02398']
  for (let i = 1; i < unitIds.length; i++) assert.ok(html.indexOf(unitIds[i - 1]) < html.indexOf(unitIds[i]))
})

test('table shows actual dates without redundant Current age text and preserves no-readings copy', () => {
  const snapshotDay = data.units.find(unit => unit.dataState === 'current' && unit.daysSinceLastReading === 0)!
  const previousDay = data.units.find(unit => unit.dataState === 'current' && unit.daysSinceLastReading === 1)!
  const stale = data.units.find(unit => unit.dataState === 'stale')!
  const noTelemetry = data.units.find(unit => !unit.hasTelemetry)!
  const html = renderToStaticMarkup(createElement(AllUnitsTable, { units: [snapshotDay, previousDay, stale, noTelemetry], onSelect() {}, onClear() {} }))
  for (const text of ['Current', '30 Jul 2026', '29 Jul 2026', '20 Jul 2026', 'Stale · 10d', 'No telemetry', 'No readings', `Inspect ${previousDay.unitId}`]) assert.ok(html.includes(text))
  for (const text of ['On snapshot date', 'before snapshot', 'Latest 29 Jul', 'Latest 30 Jul']) assert.ok(!html.includes(text))
})

test('confirmation keeps the required reason and uses the approved copy refinements', () => {
  const selected = selectUnit(data, 'TH-02312')!
  const html = renderToStaticMarkup(createElement(ThemeProvider, { theme: inlineModalTheme }, createElement(BriefingConfirmation, {
    open: true, row: { unit: selected.unit, attention: selected.attention! }, draft: createBriefingDraft(), documentVisible: false,
    onCancel() {}, onChange() {}, onGenerate() {},
  })))
  assert.ok(html.includes('Reason for visit and known data-quality conflicts are always included.'))
  assert.ok(html.includes('Latest available telemetry'))
  assert.ok(html.includes('Persistent OEM signal — ALM_HP_LOWFLOW'))
  assert.ok(!html.includes('Available OEM telemetry'))
})

test('navigation keeps Needs Attention primary and exposes All Units as the secondary view', () => {
  for (const view of ['attention', 'all_units'] as const) {
    const html = renderToStaticMarkup(createElement(AppShell, { children: 'Worklist', attentionCount: 7, view, onNavigate() {} }))
    assert.ok(html.indexOf('Needs Attention') < html.indexOf('All Units'))
    const activeLinks = html.match(/<a\b[^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/g) ?? []
    assert.equal(activeLinks.length, 1)
    assert.ok(activeLinks[0].includes(view === 'attention' ? 'Needs Attention' : 'All Units'))
    assert.ok(html.includes('Primary navigation'))
    assert.ok(html.includes('href="/service-cockpit-case/case-study"'))
    assert.ok(html.includes('Case study ↗'))
    assert.ok(!activeLinks[0].includes('Case study'))
  }
})

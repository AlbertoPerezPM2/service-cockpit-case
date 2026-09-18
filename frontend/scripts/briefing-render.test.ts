import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import type { CockpitData } from '../src/types.ts'
import { buildBriefing, createBriefingDraft, briefingSections } from '../src/briefing/briefing.ts'

const data: CockpitData = JSON.parse(readFileSync(new URL('../public/data/cockpit.json', import.meta.url), 'utf8'))
let server: ViteDevServer
let DocumentView: typeof import('../src/briefing/TechnicalVisitBriefing.tsx').TechnicalVisitBriefing

before(async () => {
  // Transform TSX for component rendering only. No HTTP or WebSocket listener.
  server = await createServer({ server: { middlewareMode: true, ws: false, hmr: false, watch: null }, appType: 'custom' })
  const module = await server.ssrLoadModule('/src/briefing/TechnicalVisitBriefing.tsx')
  DocumentView = module.TechnicalVisitBriefing
})
after(async () => { await server?.close() })

test('generated document renders evidence, service conflict, timeline, and print/back controls', () => {
  const briefing = buildBriefing(data, 'TH-02312', createBriefingDraft())
  const html = renderToStaticMarkup(createElement(DocumentView, { briefing, onBack() {} }))
  for (const text of ['TH-02312', 'Thorsten Oestreich', 'Care Plus', 'Persistent OEM signal — ALM_HP_LOWFLOW',
    'First observed', '17 Jul 2026', 'Last observed', '30 Jul 2026', 'Source data conflict',
    'Last service visit predates commissioning date.', '3 Aug 2024', '9 Jul 2024', 'Latest available telemetry',
    'Current', 'Data limitations', 'Print briefing', 'Back to unit']) {
    assert.ok(html.includes(text), `Missing document content: ${text}`)
  }
  assert.ok(html.includes('role="img"'))
  assert.ok(html.includes('ALM_HP_LOWFLOW: 14 reporting days, 17 Jul–30 Jul'))
  assert.ok(!html.includes('Planner note'))
  assert.ok(!html.includes('Search unit or customer'))
  assert.ok(!html.includes('<nav'))
  assert.equal((html.match(/Meaning not validated\./g) ?? []).length, 1)
  assert.ok(html.includes('<dt>Persistence</dt><dd>14 reporting days</dd>'))
  assert.ok(!html.includes('<dt>Raw OEM signal</dt>'))
  assert.ok(!html.includes('Latest reading:'))
  assert.ok(!html.includes('Only available values from this reading are included.'))
  assert.ok(html.includes('Raw OEM energy / status semantics require validation.'))
  assert.ok(!html.includes('raw OEM value'))
  assert.ok(html.includes('<footer class="briefing-footer">TH-02312 · Technical Visit Briefing</footer>'))
})

test('unselected sections are absent from document while core evidence and conflicting dates remain', () => {
  const draft = createBriefingDraft()
  for (const section of briefingSections) draft.sections[section.id] = false
  const html = renderToStaticMarkup(createElement(DocumentView, { briefing: buildBriefing(data, 'TH-02312', draft), onBack() {} }))
  for (const title of ['Signal history', 'Latest telemetry status', 'Latest available telemetry', 'Data limitations', 'Service context']) {
    assert.ok(!html.includes(`<h2>${title}</h2>`))
  }
  assert.ok(html.includes('Reason for visit'))
  assert.ok(html.includes('Last service visit predates commissioning date.'))
  assert.ok(html.includes('3 Aug 2024'))
  assert.ok(html.includes('9 Jul 2024'))

  // The values still need their reading date when the separate status section is omitted.
  const telemetryOnly = createBriefingDraft()
  telemetryOnly.sections.telemetryStatus = false
  const telemetryHtml = renderToStaticMarkup(createElement(DocumentView, { briefing: buildBriefing(data, 'TH-02312', telemetryOnly), onBack() {} }))
  assert.ok(telemetryHtml.includes('Reading: 30 Jul 2026'))
  assert.ok(!telemetryHtml.includes('<h2>Latest telemetry status</h2>'))
})

test('OEM semantics caveat only names energy/status when those values are included', () => {
  const briefing = buildBriefing(data, 'TH-02312', createBriefingDraft())
  for (const [key, caveat] of [
    ['outdoor_temp_c', null],
    ['electrical_energy_kwh', 'Raw OEM energy semantics require validation.'],
    ['status_raw', 'Raw OEM status semantics require validation.'],
  ] as const) {
    const selectedFields = briefing.oemTelemetry!.fields.filter(field => field.key === key)
    assert.ok(selectedFields.length)
    const html = renderToStaticMarkup(createElement(DocumentView, { briefing: {
      ...briefing, oemTelemetry: { ...briefing.oemTelemetry!, fields: selectedFields },
    }, onBack() {} }))
    if (caveat) assert.ok(html.includes(caveat))
    else assert.ok(!html.includes('semantics require validation.'))
  }
})

test('planner note is rendered as literal escaped text and never executable markup', () => {
  const draft = { ...createBriefingDraft(), plannerNote: '<script>alert("test")</script>\nCustomer note: A & B.' }
  const html = renderToStaticMarkup(createElement(DocumentView, { briefing: buildBriefing(data, 'TH-02312', draft), onBack() {} }))
  assert.ok(html.includes('Planner note'))
  assert.ok(html.includes('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;'))
  assert.ok(html.includes('\nCustomer note: A &amp; B.'))
  assert.ok(!html.includes('<script>'))
})

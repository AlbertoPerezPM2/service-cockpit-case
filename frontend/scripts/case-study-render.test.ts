import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'

let server: ViteDevServer
let CaseStudySlide: typeof import('../src/pages/CaseStudyPage.tsx').CaseStudySlide
let CaseStudyPage: typeof import('../src/pages/CaseStudyPage.tsx').CaseStudyPage
let App: typeof import('../src/App.tsx').default
let CustomGptSetupDialog: typeof import('../src/pages/CustomGptSetup.tsx').CustomGptSetupDialog

before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false, hmr: false, watch: null }, appType: 'custom' })
  const module = await server.ssrLoadModule('/src/pages/CaseStudyPage.tsx')
  CaseStudySlide = module.CaseStudySlide
  CaseStudyPage = module.CaseStudyPage
  App = (await server.ssrLoadModule('/src/App.tsx')).default
  CustomGptSetupDialog = (await server.ssrLoadModule('/src/pages/CustomGptSetup.tsx')).CustomGptSetupDialog
})
after(async () => { await server?.close() })

test('ten case-study slides retain the supplied questions, facts, and uncertainty wording', () => {
  const expected = [
    ['What problem am I solving?', 'Service triage is fragmented across incomplete tools.', 'Planners lack a trusted fleet-wide view of which units need attention.', 'Technicians can arrive on site without enough context.', 'Problem statement', 'Primary use case', 'Service teams need a faster, more reliable way to turn heterogeneous heat-pump data into actionable service decisions before dispatch.'],
    ['Why start with the service planner?', 'Assumption', 'Improving planner triage creates greater near-term operational leverage than optimizing one technician case at a time.', 'A technician-first solution improves one case at a time; planner-first can shape many downstream technician hours.', 'The key trade-off is that this choice prioritizes operational leverage over diagnostic depth in v1.'],
    ['What did the data tell me?', '400', '268', 'resolved units after identity cleanup and deduplication.', 'Cross-OEM energy values are not directly comparable from the supplied data.', 'Hypothesis to validate', 'Some recurring raw signals are useful for prioritization even before their technical meaning is fully documented.', 'View EDA notebook on GitHub ↗'],
    ['What deserves attention first?', 'Technician review', 'Data / connectivity review', '4 units', '3 units', 'ALM_HP_LOWFLOW', '14 reporting days', '10 days', 'Technical meaning not validated', 'Investigate data/integration before dispatch', 'Prioritize with explainable evidence, not a universal health or severity score.', 'Hypothesis to validate', 'Persistence + rarity can be a useful prioritization signal even before OEM code semantics are fully documented.', 'Open Service Cockpit ↗'],
    ['What did I deliberately leave out?', 'Remote control / settings changes', 'Dismiss / snooze / resolve', 'Cross-OEM efficiency scoring', 'If a capability is not required to validate planner-led triage, it stays out of v1.', 'Beyond the MVP', 'Needs attention → Reviewed → Technician assigned → En route → Resolved.', 'The case itself includes a wrong-unit reset, which makes those safeguards a prerequisite rather than an implementation detail.'],
    ['How would I validate it?', 'Historical backtest — 3 months', 'Assumption', '~300–500 historical service cases can be linked to telemetry and technician outcomes.', '≥65%', '≤20%', '≥1 day', 'Shadow mode — 2 weeks', '3 planners review the cockpit alongside the current process.', '≥75%', '≥85%', '≤10%', '&lt;5%', 'high-concern misses among planner-identified cases', 'Recommendations would be visible, but existing dispatch decisions would remain unchanged.'],
    ['What would success look like in a live pilot?', '4-week pilot', '3–5 planners + 8–12 technicians', 'Compare against a comparable baseline period', 'Success targets', '20–30%', '≥25%', '10–15%', '15–20%', '≥10%', 'Guardrails', '&lt;20%', '&lt;10%', 'unsupported diagnosis shown to planners or technicians', 'briefings generated without triggering evidence', 'The main guardrail is false confidence.'],
    ['How did I use AI?', 'Wattson McStudyson — Custom GPT', 'GPT-5.6 Sol', 'View Custom GPT setup ↗', 'Codex CLI', 'GPT-6 Astra — High reasoning', 'case framing and assumption challenge', 'iterative implementation with review gates between phases', 'My role: I owned the decision-making and orchestration: first exploring the problem and data, then locking a product spec, then using agents to implement against that spec.'],
    ['What did AI get wrong?', 'the visit occurred before commissioning.', 'What I changed', 'Source data conflict', 'did not guess which date was correct', 'did not let the inconsistency affect equipment prioritization', 'Why it mattered', 'Data-quality issues should be visible, but kept separate from equipment health.'],
    ['How much time did I spend?', '~4h30 focused working time', 'Spread across two evenings', '20 min', '60 min', '35 min', '45 min', '70 min', '40 min', 'I slightly exceeded the suggested four-hour timebox. The additional time went into validating data consistency and making the prototype demo-ready rather than expanding scope.'],
  ]
  expected.forEach((phrases, index) => {
    const html = renderToStaticMarkup(createElement(CaseStudySlide, { index }))
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
    for (const phrase of phrases) assert.ok(html.includes(phrase), `Slide ${index + 1}: missing ${phrase}`)
    assert.ok(html.includes('aria-roledescription="slide"'))
    assert.ok(!html.includes('role="img"'), 'No decorative charts')
    assert.ok(!html.includes('🟡'), 'Slide assumption labels must be plain text')
    assert.ok(!html.includes('What is the MVP?'), 'The live prototype replaces the former MVP slide')
    assert.equal(html.includes('Open Service Cockpit ↗'), index === 3)
    if (index === 2) {
      assert.match(html, /<a\b[^>]*href="https:\/\/github.com\/AlbertoPerezPM2\/service-cockpit-case\/blob\/main\/notebooks\/01_eda.ipynb"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>View EDA notebook on GitHub ↗<\/a>/)
    }
    if (index === 3) assert.match(html, /<a\b[^>]*href="\/service-cockpit-case\/"[^>]*>Open Service Cockpit ↗<\/a>/)
    if (index === 5) assert.equal((html.match(/>Assumption<\/span>/g) ?? []).length, 2)
    if (index === 6) assert.equal((html.match(/<strong>0<\/strong>/g) ?? []).length, 2)
  })
})

test('case-study entry shows one slide, bounded initial controls, and a cockpit return link', () => {
  const html = renderToStaticMarkup(createElement(CaseStudyPage, { onBack() {} }))
  assert.ok(html.includes('What problem am I solving?'))
  assert.ok(!html.includes('Why start with the service planner?'))
  assert.ok(html.includes('1 / 10'))
  assert.ok(html.includes('Slide navigation'))
  assert.match(html, /<button\b[^>]*disabled=""[^>]*>[\s\S]*?Previous<\/button>/)
  const next = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)?.find(button => button.includes('Next'))
  assert.ok(next && !next.includes('disabled=""'))
  assert.match(html, /<a\b[^>]*href="\/service-cockpit-case\/"[^>]*>[\s\S]*?Back to Service Cockpit<\/a>/)
})

test('direct case-study URLs render independently of telemetry loading and root keeps the cockpit default', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  try {
    for (const pathname of ['/service-cockpit-case/case-study', '/service-cockpit-case/case-study/', '/service-cockpit-case/']) {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { pathname } } })
      const html = renderToStaticMarkup(createElement(App))
      assert.ok(html.includes('Needs Attention'))
      assert.ok(html.includes('href="/service-cockpit-case/case-study"'))
      if (pathname === '/service-cockpit-case/') {
        assert.ok(!html.includes('What problem am I solving?'))
        assert.ok(!html.includes('class="cockpit-workspace" hidden=""'))
      } else {
        assert.ok(html.includes('What problem am I solving?'))
        assert.ok(html.includes('class="cockpit-workspace" hidden=""'))
        assert.ok(html.includes('1 / 10'))
      }
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('setup dialog preserves literal configuration text and provides a close action without navigation', () => {
  const theme = createTheme({ components: { MuiModal: { defaultProps: { disablePortal: true } } } })
  const suppliedConfiguration = readFileSync(new URL('../src/pages/wattson-configuration.txt', import.meta.url), 'utf8')
  for (const configuration of [suppliedConfiguration, 'Configuration fixture\n\n  Keep indentation & <literal text>.\nDo not change wording.']) {
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(CustomGptSetupDialog, {
      open: true, onClose() {}, configuration,
    })))
    assert.ok(html.includes('Wattson McStudyson — Custom GPT setup'))
    assert.ok(html.includes('role="dialog"'))
    const displayedText = html.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/)?.[1]
    const expectedText = renderToStaticMarkup(createElement('pre', null, configuration)).slice('<pre>'.length, -'</pre>'.length)
    assert.equal(displayedText, expectedText)
    assert.ok(html.includes('Close'))
    assert.ok(!html.includes('href='))
  }
})

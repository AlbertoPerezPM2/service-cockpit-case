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

test('nine assignment-first sections retain evidence, limitations, hypotheses and working product links', () => {
  const expected = [
    ['A service planner cockpit for deciding what deserves attention this morning', 'Service planner / dispatcher', 'Requirements / build order', 'Non-goals', 'Assumption', 'Starting with the planner creates more leverage'],
    ['How many heat pumps are actually in the dataset?', 'Observed', '415', '412', '400', '12 duplicate source rows', '273', '268', '132', 'TH-90000', 'TH-90004', 'do not force-match', 'View EDA notebook on GitHub ↗'],
    ['What can this dataset actually tell us?', 'Efficiency', 'Is it delivering hot water?', 'Is it heating at all?', 'Is a fault recurring or one-off?', 'Partly answers', 'Evidence / limitation', 'Product implication', 'not a formal OEM capability contract'],
    ['Tomorrow morning: what deserves review?', '4 units merit technical review', 'TH-02298', 'TH-02312', 'TH-02395', 'TH-02398', 'ALM_HP_LOWFLOW', '14', '17 Jul 2026', '30 Jul 2026', 'Medium confidence', 'Low confidence in the technical diagnosis', 'Dispatch remains a planner decision.', '3 units should go to data/connectivity investigation first', 'TH-02023', 'TH-02280', 'TH-02304', '20 Jul 2026', '10', 'High confidence that telemetry stopped; low confidence'],
    ['The most frequent signal is not necessarily the most useful one', '6021', '2,475', '98', 'E-211', '143', '46', '3104', '116', '47', '7702', '61', '50', 'E-317', '56', 'ALM_HP_LOWFLOW', 'Candidate for technical review', 'Hypothesis to validate', 'Prototype heuristic used for this dataset', 'not industry rules, OEM specifications, SLAs or validated service policy'],
    ['What did I build?', 'Detect → Inspect → Decide → Hand over', 'Needs Attention', 'Evidence drawer', 'Technical Visit Briefing', 'All Units', 'Open Service Cockpit ↗', 'Beyond MVP:'],
    ['How would I validate next?', 'Signal quality', 'Routing quality', 'Planner efficiency', 'Hypothesis to validate', 'Historical backtest → planner shadow mode → small live pilot', 'Set quantitative targets after establishing the baseline.', 'Uncertain telemetry must never become unsupported diagnosis.'],
    ['The one missing dependency I would pursue first', 'Authoritative OEM C service-code semantics', 'Open question', 'Assumption', 'Role to identify; the brief does not confirm an internal team name.', 'Medium / externally dependent.', 'First-week working message', 'I’m not asking for write access yet.'],
    ['How I built and reviewed this with AI', 'Human framing', 'AI-assisted exploration', 'Human verification', 'AI-assisted implementation', 'Independent AI review', 'Human arbitration', 'GPT-5.6 Sol', 'GPT-6 Astra — High reasoning', 'View Custom GPT setup ↗', 'critique rather than instruction', 'unsupported service-tier priority assumption', 'One concrete AI mistake I corrected', 'Source data conflict', 'Actual focused time: ~4h30.', 'exceeded the stated 4-hour cap by approximately 30 minutes.'],
  ]
  expected.forEach((phrases, index) => {
    const html = renderToStaticMarkup(createElement(CaseStudySlide, { index }))
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
    for (const phrase of phrases) assert.ok(html.includes(phrase), `Section ${index + 1}: missing ${phrase}`)
    assert.ok(html.includes('aria-roledescription="slide"'))
    assert.ok(!html.includes('role="img"'), 'No decorative charts')
    assert.ok(!html.includes('🟡'), 'Presentation labels must be plain text')
    assert.equal(html.includes('Open Service Cockpit ↗'), index === 5)
    if (index === 1) assert.match(html, /<a\b[^>]*href="https:\/\/github.com\/AlbertoPerezPM2\/service-cockpit-case\/blob\/main\/notebooks\/01_eda.ipynb"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>View EDA notebook on GitHub ↗<\/a>/)
    if (index === 5) assert.match(html, /<a\b[^>]*href="\/service-cockpit-case\/"[^>]*>Open Service Cockpit ↗<\/a>/)
    if (index === 6) {
      assert.equal((html.match(/>Hypothesis to validate<\/span>/g) ?? []).length, 3)
      assert.doesNotMatch(html, /\d\s*%|4-week|3–5 planners|acceptance criteria|Success targets/)
    }
    if ([1, 2, 4].includes(index)) assert.ok(html.includes('role="region"'), 'Tables scroll within an accessible region on tablet')
  })
})

test('case-study entry shows one slide, bounded initial controls, and a cockpit return link', () => {
  const html = renderToStaticMarkup(createElement(CaseStudyPage, { onBack() {} }))
  assert.ok(html.includes('A service planner cockpit for deciding what deserves attention this morning'))
  assert.ok(!html.includes('How many heat pumps are actually in the dataset?'))
  assert.ok(html.includes('1 / 9'))
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
        assert.ok(!html.includes('A service planner cockpit for deciding what deserves attention this morning'))
        assert.ok(!html.includes('class="cockpit-workspace" hidden=""'))
      } else {
        assert.ok(html.includes('A service planner cockpit for deciding what deserves attention this morning'))
        assert.ok(html.includes('class="cockpit-workspace" hidden=""'))
        assert.ok(html.includes('1 / 9'))
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

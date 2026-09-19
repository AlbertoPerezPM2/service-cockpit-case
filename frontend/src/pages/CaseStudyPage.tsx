import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { CustomGptSetup } from './CustomGptSetup'

const statementStyle = { fontSize: { xs: '1.0625rem', md: '1.25rem' }, lineHeight: 1.6 }

function Statements({ children }: { children: ReactNode }) {
  return <Box component="ul" sx={{ m: 0, pl: 2.75, '& li': { pl: 0.5, mb: 1.75, ...statementStyle }, '& li:last-child': { mb: 0 }, '& li::marker': { color: '#8b9caf' } }}>{children}</Box>
}

function LabeledNote({ label, children }: { label: string; children: ReactNode }) {
  return <Box component="aside" sx={{ mt: 3, pl: 2.5, maxWidth: 880, borderLeft: '2px solid', borderColor: 'divider' }}>
    <Typography variant="overline" color="text.secondary">{label}</Typography>
    <Typography sx={{ mt: 0.5, fontSize: '1.0625rem', lineHeight: 1.6 }}>{children}</Typography>
  </Box>
}

function Narrative({ children }: { children: ReactNode }) {
  return <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', maxWidth: '76ch', fontSize: '1rem', lineHeight: 1.75, '& p': { mt: 0, mb: 2 }, '& p:last-child': { mb: 0 } }}>{children}</Box>
}

const slides = [
  {
    question: 'What problem am I solving?',
    content: <>
      <Statements>
        <li>Service triage is fragmented across incomplete tools.</li>
        <li>Planners lack a trusted fleet-wide view of which units need attention.</li>
        <li>Technicians can arrive on site without enough context.</li>
      </Statements>
      <Typography component="h2" variant="overline" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Problem statement</Typography>
      <Typography sx={{ ...statementStyle, maxWidth: 880 }}>Service teams need a faster, more reliable way to turn heterogeneous heat-pump data into actionable service decisions before dispatch.</Typography>
      <Typography component="h2" variant="overline" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Primary use case</Typography>
      <Typography sx={{ maxWidth: 880, fontSize: '1.0625rem', lineHeight: 1.6 }}>As a service planner, when I start the day and review the installed fleet, I want to see a short, explainable list of units that deserve attention and understand why each surfaced, so that I can decide whether to prepare a technician handover or investigate a data/connectivity issue before dispatch.</Typography>
    </>,
  },
  {
    question: 'Why start with the service planner?',
    content: <>
      <Statements>
        <li>The planner sits upstream of dispatch and influences which cases become field work.</li>
        <li>Current planning relies on fragmented, incomplete visibility.</li>
        <li>Better triage can potentially reduce avoidable investigation and repeat visits.</li>
        <li>A technician-first solution improves one case at a time; planner-first can shape many downstream technician hours.</li>
      </Statements>
      <LabeledNote label="Assumption">Improving planner triage creates greater near-term operational leverage than optimizing one technician case at a time.</LabeledNote>
      <Narrative>
        <p>I considered two starting points: a planner-first cockpit and a technician-first diagnostic view. Both address real pain, but I prioritized the planner because the decision happens earlier in the service journey. If the planner can identify the right units, distinguish equipment-review cases from data/connectivity issues, and package useful evidence before dispatch, that can improve the quality of many downstream technician interactions.</p>
        <p>A technician-first experience would still be valuable, particularly for richer diagnosis and on-site context. However, it optimizes one case at a time and risks becoming another telemetry viewer rather than solving the upstream coordination problem.</p>
        <p>The MVP therefore starts with planner-led triage, while preserving a secondary All Units view for technicians and other users who need to look up a known installation. The attention item then becomes the handover object into the technician workflow.</p>
        <p>The key trade-off is that this choice prioritizes operational leverage over diagnostic depth in v1. I would validate the assumption by measuring avoidable dispatches, repeat visits, no-fault-found cases, and whether planners can make routing decisions without switching tools.</p>
      </Narrative>
    </>,
  },
  {
    question: 'What did the data tell me?',
    content: <>
      <Statements>
        <li><strong>400</strong> resolved units after identity cleanup and deduplication.</li>
        <li><strong>268</strong> units with telemetry in the supplied period.</li>
        <li>OEM coverage and field availability differ materially.</li>
        <li>Data freshness and source consistency are as important as raw measurements.</li>
        <li>Cross-OEM energy values are not directly comparable from the supplied data.</li>
      </Statements>
      <Typography sx={{ ...statementStyle, mt: 3 }}>The cockpit should not treat all OEM data as equally complete or equally interpretable.</Typography>
      <LabeledNote label="Hypothesis to validate">Some recurring raw signals are useful for prioritization even before their technical meaning is fully documented.</LabeledNote>
      <Button component="a" href="https://github.com/AlbertoPerezPM2/service-cockpit-case/blob/main/notebooks/01_eda.ipynb" target="_blank" rel="noopener noreferrer" size="small" sx={{ mt: 3, px: 0 }}>View EDA notebook on GitHub ↗</Button>
    </>,
  },
  {
    question: 'What deserves attention first?',
    content: <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 3, md: 5 } }}>
        <Box component="section" aria-labelledby="case-technician-review">
          <Typography component="h2" id="case-technician-review" variant="h2" sx={{ mb: 2 }}>Technician review</Typography>
          <Statements>
            <li><strong>4 units</strong></li>
            <li>Persistent OEM signal</li>
            <li><Box component="span" className="raw-signal">ALM_HP_LOWFLOW</Box></li>
            <li>Observed on <strong>14 reporting days</strong></li>
            <li>Technical meaning not validated</li>
          </Statements>
        </Box>
        <Box component="section" aria-labelledby="case-connectivity-review" sx={{ borderLeft: { sm: '1px solid' }, borderTop: { xs: '1px solid', sm: 0 }, borderColor: 'divider', pl: { sm: 4 }, pt: { xs: 3, sm: 0 } }}>
          <Typography component="h2" id="case-connectivity-review" variant="h2" sx={{ mb: 2 }}>Data / connectivity review</Typography>
          <Statements>
            <li><strong>3 units</strong></li>
            <li>Previously reporting</li>
            <li>Telemetry stopped <strong>10 days</strong> before the snapshot</li>
            <li>Investigate data/integration before dispatch</li>
          </Statements>
        </Box>
      </Box>
      <Typography sx={{ ...statementStyle, mt: 4 }}>Prioritize with explainable evidence, not a universal health or severity score.</Typography>
      <LabeledNote label="Hypothesis to validate">Persistence + rarity can be a useful prioritization signal even before OEM code semantics are fully documented.</LabeledNote>
    </>,
  },
  {
    question: 'What did I deliberately leave out?',
    content: <>
      <Statements>
        <li>Remote control / settings changes<Typography color="text.secondary">Safety, identity, permissions, auditability</Typography></li>
        <li>Technician assignment / dispatching<Typography color="text.secondary">Requires workflow ownership and integration</Typography></li>
        <li>Dismiss / snooze / resolve<Typography color="text.secondary">Requires persistent alert lifecycle</Typography></li>
        <li>Automated diagnosis / repair recommendations<Typography color="text.secondary">OEM semantics are not validated</Typography></li>
        <li>Cross-OEM efficiency scoring<Typography color="text.secondary">Energy fields are not comparable enough</Typography></li>
      </Statements>
      <Typography sx={{ ...statementStyle, mt: 3 }}>If a capability is not required to validate planner-led triage, it stays out of v1.</Typography>
      <Narrative>
        <p>The MVP deliberately stops before transactional and safety-critical workflows. Remote actions such as restart, shutdown, or settings changes are especially sensitive because they require reliable unit identity, authorization, audit trails, and validated OEM command semantics. The case itself includes a wrong-unit reset, which makes those safeguards a prerequisite rather than an implementation detail.</p>
        <p>I also excluded technician assignment, dispatching, and alert-resolution state. Those capabilities would require persistence, ownership rules, scheduling logic, and integration with existing operational systems. They are plausible next steps, but they are not necessary to test whether the cockpit improves triage quality.</p>
        <p>Automated diagnosis and repair recommendations are also out of scope. The supplied OEM codes and telemetry semantics are not documented well enough to support that level of inference safely. Likewise, I avoided a universal health score or cross-OEM efficiency ranking because it would create false precision from heterogeneous data.</p>
        <p>The scope boundary is intentional: validate attention, evidence, routing, and handover first; add workflow automation and control only once the underlying data and operational model are trusted.</p>
        <Typography component="h2" variant="overline" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Beyond the MVP</Typography>
        <p>The same attention object could evolve into a traceable service case: Needs attention → Reviewed → Technician assigned → En route → Resolved. This could start with lightweight manual status updates and later synchronize with dispatch or ticketing systems.</p>
      </Narrative>
    </>,
  },
  {
    question: 'How would I validate it?',
    content: <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
        <Box component="section" aria-labelledby="case-backtest">
          <Typography component="h2" id="case-backtest" variant="h2">Historical backtest — 3 months</Typography>
          <LabeledNote label="Assumption">~300–500 historical service cases can be linked to telemetry and technician outcomes.</LabeledNote>
          <Typography component="h3" variant="overline" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>Measures / acceptance criteria</Typography>
          <Statements>
            <li><strong>≥65%</strong> of surfaced technician-review cases judged actionable</li>
            <li><strong>≤20%</strong> false-positive rate</li>
            <li><strong>≥1 day</strong> median earlier detection for cases that later required service</li>
          </Statements>
        </Box>
        <Box component="section" aria-labelledby="case-shadow-mode">
          <Typography component="h2" id="case-shadow-mode" variant="h2">Shadow mode — 2 weeks</Typography>
          <LabeledNote label="Assumption">3 planners review the cockpit alongside the current process.</LabeledNote>
          <Typography component="h3" variant="overline" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>Measures / acceptance criteria</Typography>
          <Statements>
            <li><strong>≥75%</strong> agreement with surfaced attention items</li>
            <li><strong>≥85%</strong> agreement on technician vs data/connectivity routing</li>
            <li><strong>≤10%</strong> of data/connectivity cases escalated toward field service</li>
            <li><strong>&lt;5%</strong> high-concern misses among planner-identified cases</li>
          </Statements>
        </Box>
      </Box>
      <Narrative>
        <p>I would first validate signal quality without changing operations. A three-month historical backtest would measure whether the attention rules surface cases that later proved actionable and whether they provide meaningful lead time before service events.</p>
        <p>I would then run the cockpit in shadow mode for two weeks with a small planner group. Recommendations would be visible, but existing dispatch decisions would remain unchanged. This would let me measure planner agreement, routing quality, false positives, and missed cases before moving to a live operational pilot.</p>
      </Narrative>
    </>,
  },
  {
    question: 'What would success look like in a live pilot?',
    content: <>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography sx={{ ...statementStyle, fontWeight: 600 }}>4-week pilot</Typography>
        <Typography sx={statementStyle}>3–5 planners + 8–12 technicians</Typography>
        <Typography color="text.secondary">Compare against a comparable baseline period</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
        <Box component="section" aria-labelledby="case-pilot-targets">
          <Typography component="h2" id="case-pilot-targets" variant="h2" sx={{ mb: 2 }}>Success targets</Typography>
          <Statements>
            <li><strong>20–30%</strong> lower median planner triage time</li>
            <li><strong>≥25%</strong> fewer cases requiring another tool before routing</li>
            <li><strong>10–15%</strong> fewer repeat / no-fault-found visits</li>
            <li><strong>15–20%</strong> lower technician preparation time</li>
            <li><strong>≥10%</strong> fewer avoidable field escalations among cockpit-surfaced cases</li>
          </Statements>
        </Box>
        <Box component="section" aria-labelledby="case-pilot-guardrails">
          <Typography component="h2" id="case-pilot-guardrails" variant="h2" sx={{ mb: 2 }}>Guardrails</Typography>
          <Statements>
            <li><strong>&lt;20%</strong> false-positive technician-review rate</li>
            <li><strong>&lt;10%</strong> planner override of technician/data queue classification</li>
            <li><strong>0</strong> unsupported diagnosis shown to planners or technicians</li>
            <li><strong>0</strong> briefings generated without triggering evidence</li>
          </Statements>
        </Box>
      </Box>
      <Narrative>
        <p>In the live pilot, I would optimize for faster, better-informed routing rather than alert volume. The primary outcome is reduced triage effort; downstream metrics test whether that translates into better field-service efficiency.</p>
        <p>The main guardrail is false confidence. Data freshness must not be interpreted as equipment health, and undocumented OEM signals must not be presented as diagnosis. For that reason, I would track false positives, planner overrides, routing errors, and briefing completeness alongside the primary metrics.</p>
      </Narrative>
    </>,
  },
  {
    question: 'How did I use AI?',
    content: <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
        <Box component="section" aria-labelledby="case-custom-gpt">
          <Typography component="h2" id="case-custom-gpt" variant="h2">Wattson McStudyson — Custom GPT</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2.5 }}>GPT-5.6 Sol</Typography>
          <Statements>
            <li>case framing and assumption challenge</li>
            <li>prioritization and MVP scope</li>
            <li>metrics, risks, and trade-offs</li>
            <li>narrative refinement</li>
            <li>Codex prompt design</li>
          </Statements>
          <CustomGptSetup />
        </Box>
        <Box component="section" aria-labelledby="case-codex-cli">
          <Typography component="h2" id="case-codex-cli" variant="h2">Codex CLI</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2.5 }}>GPT-6 Astra — High reasoning</Typography>
          <Statements>
            <li>inspecting prepared data outputs</li>
            <li>implementing the React + TypeScript + MUI prototype</li>
            <li>validating joins, counts, and edge cases</li>
            <li>iterative implementation with review gates between phases</li>
          </Statements>
        </Box>
      </Box>
      <Typography color="text.secondary" sx={{ mt: 4, maxWidth: 880, lineHeight: 1.6 }}>My role: I owned the decision-making and orchestration: first exploring the problem and data, then locking a product spec, then using agents to implement against that spec. I reviewed each phase before the next, and used targeted review passes with different “hats” — product, data quality, UX, and engineering — to catch drift and correct the implementation.</Typography>
    </>,
  },
  {
    question: 'What did AI get wrong?',
    content: <>
      <Typography sx={{ ...statementStyle, maxWidth: 900 }}>The generated UI initially displayed a unit’s last service visit as normal context even though the source data showed that the visit occurred before commissioning.</Typography>
      <Typography component="h2" variant="overline" color="text.secondary" sx={{ mt: 4, mb: 1.5 }}>What I changed</Typography>
      <Statements>
        <li>surfaced it as a “Source data conflict”</li>
        <li>did not guess which date was correct</li>
        <li>did not let the inconsistency affect equipment prioritization</li>
      </Statements>
      <Typography component="h2" variant="overline" color="text.secondary" sx={{ mt: 4, mb: 1 }}>Why it mattered</Typography>
      <Typography sx={statementStyle}>Data-quality issues should be visible, but kept separate from equipment health.</Typography>
    </>,
  },
  {
    question: 'How much time did I spend?',
    content: <>
      <Typography sx={{ ...statementStyle, fontWeight: 600 }}>~4h30 focused working time</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Spread across two evenings</Typography>
      <Box component="dl" sx={{ m: 0, maxWidth: 700, '& > div': { display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }, '& dt': { fontSize: '1rem' }, '& dd': { m: 0, fontSize: '1rem', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
        <div><dt>Brief + framing</dt><dd>20 min</dd></div>
        <div><dt>Data exploration &amp; cleaning</dt><dd>60 min</dd></div>
        <div><dt>Attention logic</dt><dd>35 min</dd></div>
        <div><dt>Product definition &amp; MVP scope</dt><dd>45 min</dd></div>
        <div><dt>Prototype implementation</dt><dd>70 min</dd></div>
        <div><dt>QA, iteration &amp; screenshots</dt><dd>40 min</dd></div>
      </Box>
      <Typography color="text.secondary" sx={{ mt: 4, lineHeight: 1.6 }}>I slightly exceeded the suggested four-hour timebox. The additional time went into validating data consistency and making the prototype demo-ready rather than expanding scope.</Typography>
    </>,
  },
]

export function CaseStudySlide({ index, onOpenCockpit }: { index: number; onOpenCockpit?: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [index])
  const slide = slides[index]
  return <Box component="article" aria-labelledby="case-slide-title" aria-roledescription="slide" sx={{ flex: 1, pb: 5 }}>
    <Typography component="h1" id="case-slide-title" ref={heading} tabIndex={-1} variant="h1"
      sx={{ fontSize: { xs: '1.875rem', md: '2.375rem' }, lineHeight: 1.2, mb: { xs: 4, md: 5 }, maxWidth: 940, '&:focus': { outline: 'none' } }}>{slide.question}</Typography>
    {slide.content}
    {index === 3 && <Button component="a" href={import.meta.env.BASE_URL} variant="outlined" sx={{ mt: 4 }} onClick={event => {
      if (!onOpenCockpit || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault(); onOpenCockpit()
    }}>Open Service Cockpit ↗</Button>}
  </Box>
}

export function CaseStudyPage({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0)
  const lastIndex = slides.length - 1
  function previous() { setIndex(current => Math.max(0, current - 1)) }
  function next() { setIndex(current => Math.min(lastIndex, current + 1)) }

  return <Box sx={{ minHeight: '100dvh', bgcolor: 'background.paper' }}
    onKeyDown={event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous() }
      if (event.key === 'ArrowRight') { event.preventDefault(); next() }
    }}>
    <Box sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 3, md: 6 }, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Stack component="header" direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="overline" color="text.secondary">Service Cockpit · Case study</Typography>
        <Button component="a" href={import.meta.env.BASE_URL} size="small" startIcon={<ArrowBack />} onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault(); onBack()
        }}>Back to Service Cockpit</Button>
      </Stack>
      <Box component="main" sx={{ display: 'flex', flexDirection: 'column', flex: 1, pt: { xs: 4, md: 6 }, minHeight: { md: 580 } }}>
        <CaseStudySlide index={index} onOpenCockpit={onBack} />
      </Box>
      <Stack component="nav" aria-label="Slide navigation" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={previous} disabled={index === 0} startIcon={<ArrowBack />}>Previous</Button>
        <Typography variant="body2" color="text.secondary" aria-live="polite" aria-atomic="true" sx={{ fontVariantNumeric: 'tabular-nums' }}>{index + 1} / {slides.length}</Typography>
        <Button onClick={next} disabled={index === lastIndex} endIcon={<ArrowForward />}>Next</Button>
      </Stack>
    </Box>
  </Box>
}

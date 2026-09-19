import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { CustomGptSetup } from './CustomGptSetup'
import { caseStudyEvidence as evidence } from '../data/caseStudyEvidence'
import { formatDate } from '../data/formatters'

const statementStyle = { fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6 }
const columns = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 3, md: 5 } }
const facts = evidence.reconciliation
const technical = evidence.cohorts.technician_review
const connectivity = evidence.cohorts.data_connectivity_review
const signal = technical[0].signals[0]
const heuristic = evidence.methodology

function Statements({ children, ordered = false }: { children: ReactNode; ordered?: boolean }) {
  return <Box component={ordered ? 'ol' : 'ul'} sx={{ m: 0, pl: 2.5, '& li': { pl: 0.5, mb: 0.75, ...statementStyle }, '& li:last-child': { mb: 0 }, '& li::marker': { color: '#738397' } }}>{children}</Box>
}
function Label({ children }: { children: ReactNode }) {
  return <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{children}</Typography>
}
function Subheading({ children }: { children: ReactNode }) {
  return <Typography component="h2" variant="h3" sx={{ mb: 1.5 }}>{children}</Typography>
}
function LabeledNote({ label, children }: { label: string; children: ReactNode }) {
  return <Box component="aside" sx={{ mt: 3, pl: 2.5, maxWidth: '80ch', borderLeft: '2px solid', borderColor: 'divider' }}>
    <Label>{label}</Label><Typography sx={statementStyle}>{children}</Typography>
  </Box>
}
function EvidenceTable({ headers, rows, label }: { headers: string[]; rows: ReactNode[][]; label: string }) {
  return <TableContainer tabIndex={0} role="region" aria-label={label} sx={{ mb: 2, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
    <Table size="small" sx={{ minWidth: 660, '& th, & td': { verticalAlign: 'top', py: 1.5, px: 1.5, fontSize: '0.875rem', lineHeight: 1.6 }, '& th': { fontWeight: 600 } }}>
      <TableHead><TableRow>{headers.map(header => <TableCell key={header} scope="col">{header}</TableCell>)}</TableRow></TableHead>
      <TableBody>{rows.map((row, index) => <TableRow key={index}>{row.map((cell, column) => <TableCell key={column} component={column === 0 ? 'th' : 'td'} scope={column === 0 ? 'row' : undefined}>{cell}</TableCell>)}</TableRow>)}</TableBody>
    </Table>
  </TableContainer>
}

const slides = [
  {
    question: 'A service planner cockpit for deciding what deserves attention this morning',
    content: <>
      <Label>Primary user</Label><Typography sx={{ ...statementStyle, mb: 2 }}>Service planner / dispatcher</Typography>
      <Label>Problem statement</Label>
      <Typography sx={{ ...statementStyle, maxWidth: '80ch', mb: 2 }}>The service team currently has fragmented information and cannot reliably turn fleet telemetry into a short list of units worth investigating before a technician is sent.</Typography>
      <Label>Primary use case</Label>
      <Typography sx={{ maxWidth: '85ch', lineHeight: 1.7, mb: 4 }}>As a service planner, when I start the day and review the installed fleet, I want to see a short, explainable list of units that deserve attention and understand why each surfaced, so that I can decide whether to prepare a technician handover or investigate a data/connectivity issue before dispatch.</Typography>
      <Box sx={columns}>
        <Box><Subheading>Requirements / build order</Subheading><Statements ordered>
          <li>Resolve a trustworthy fleet identity and show data freshness.</li>
          <li>Produce a small, explainable morning attention list.</li>
          <li>Let the planner inspect the underlying evidence.</li>
          <li>Separate equipment review from data/connectivity investigation.</li>
          <li>Support known-unit lookup across the installed base.</li>
          <li>Prepare a technician handoff only after the planner decides a visit may be warranted.</li>
        </Statements></Box>
        <Box><Subheading>Non-goals</Subheading><Statements>
          <li>Remote settings / reset / write actions.</li>
          <li>Automatic diagnosis or repair recommendations.</li>
          <li>Universal cross-OEM health / severity score.</li>
          <li>Persistent dispatch / case-management workflow.</li>
          <li>Cross-OEM efficiency benchmarking.</li>
        </Statements><Typography color="text.secondary" sx={{ mt: 2 }}>These require safety controls, workflow state, OEM semantics, integrations, or data contracts that the supplied dataset does not support.</Typography></Box>
      </Box>
      <LabeledNote label="Assumption">Starting with the planner creates more leverage than a technician-first interface because improving the upstream decision can prevent or better prepare downstream field visits.</LabeledNote>
      <Typography color="text.secondary" sx={{ mt: 2, maxWidth: '85ch' }}>The planner sits upstream of dispatch. Technician-first improves one case at a time; planner-first may influence many downstream technician interactions.</Typography>
    </>,
  },
  {
    question: 'How many heat pumps are actually in the dataset?',
    content: <>
      <Label>Observed</Label>
      <EvidenceTable label="Fleet reconciliation" headers={['Source / reconciliation', 'Count', 'Interpretation']} rows={[
        [<code>installation_base.csv</code>, facts.sourceInstallationRows, 'Source rows'],
        ['Resolvable installation rows', facts.resolvableInstallationRows, `${facts.canonicalInstalledUnits} unique canonical heat-pump references; ${facts.duplicateSourceRows} duplicate source rows after reconciliation`],
        ['Unresolved installation rows', facts.unresolvedInstallationRows, 'No usable reference number; cannot safely link'],
        ['Canonical telemetry references', facts.canonicalTelemetryReferences, `${facts.telemetryOnlyReferences.length} do not occur in the installation base`],
        ['Installed units with matched telemetry', facts.matchedTelemetryUnits, `Of ${facts.canonicalInstalledUnits} resolved installed units`],
        ['Installed units without matched telemetry', facts.installedUnitsWithoutTelemetry, 'Visible in All Units; no readings'],
      ]} />
      <Label>Telemetry-only references — retained as exceptions</Label>
      <Typography className="unit-id" sx={{ ...statementStyle, overflowWrap: 'anywhere' }}>{facts.telemetryOnlyReferences.join(' · ')}</Typography>
      <LabeledNote label="Product decision">I use the {facts.canonicalInstalledUnits} canonical installation records as the cockpit fleet. I do not force-match the {facts.unresolvedInstallationRows} reference-less installation rows or the {facts.telemetryOnlyReferences.length} telemetry-only references; I treat them as data-quality exceptions.</LabeledNote>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>Source: installation_base.csv, canonical prepared outputs and the committed frontend snapshot. Reconciliation is checked against the saved analysis; unresolved records are not silently counted as installed units.</Typography>
      <Button component="a" href="https://github.com/AlbertoPerezPM2/service-cockpit-case/blob/main/notebooks/01_eda.ipynb" target="_blank" rel="noopener noreferrer" size="small" sx={{ mt: 2, px: 0 }}>View EDA notebook on GitHub ↗</Button>
    </>,
  },
  {
    question: 'What can this dataset actually tell us?',
    content: <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Observed measurements support investigation. They do not establish a universal equipment verdict.</Typography>
      <EvidenceTable label="Dataset capabilities and limitations" headers={['Question', 'Answer', 'Evidence / limitation', 'Product implication']} rows={[
        ['Efficiency', 'Partly answers', <>
          OEM A contains electrical and thermal energy. OEM B and C lack comparable thermal-energy coverage.<br />
          The case warns that electrical-energy semantics differ between vendors. A fleet-wide comparable efficiency / COP metric is unsupported.
        </>, 'Do not put cross-OEM efficiency on the front page. Explore within-OEM or within-unit trends only after field semantics are validated.'],
        ['Is it delivering hot water?', 'Partly answers', <>
          OEM A has useful DHW-temperature coverage; OEM C is intermittent; OEM B does not provide the field.<br />
          A daily temperature statistic does not prove delivery at the tap when requested.
        </>, 'Use DHW data as supporting evidence where present, not as a universal fleet-status flag.'],
        ['Is it heating at all?', 'Partly answers', <>
          OEM A has stronger flow / return temperature, operating-state and energy evidence. OEM B and C have weaker, incomplete temperature coverage.<br />
          Daily telemetry cannot prove that a building received the requested space heat.
        </>, <>Show observed operating evidence, but avoid a universal “heating / not heating” verdict.</>],
        ['Is a fault recurring or one-off?', 'Partly answers', <>
          Dates and <code>error_code_raw</code> show repeated raw signals. No authoritative code semantics are supplied.<br />
          Raw-signal recurrence is observable; recurrence of a confirmed technical fault is not.
        </>, <>Say “repeated raw signal”, not “confirmed recurring fault”.</>],
      ]} />
      <Typography variant="body2" color="text.secondary">Field availability describes the supplied extract, not a formal OEM capability contract.</Typography>
    </>,
  },
  {
    question: 'Tomorrow morning: what deserves review?',
    content: <Box sx={columns}>
      <Box><Subheading>{technical.length} units merit technical review</Subheading>
        <Typography className="unit-id" sx={{ mb: 2, lineHeight: 1.8 }}>{technical.map(row => row.unitId).join(' · ')}</Typography>
        <Label>Observed</Label><Statements>
          <li>All four are OEM C units.</li>
          <li>Each shows raw signal <code>{signal.rawSignal}</code> on {signal.persistenceDays} observed days.</li>
          <li>Observed period: {formatDate(signal.firstObserved ?? null)} – {formatDate(signal.lastObserved ?? null)}.</li>
          <li>The code is concentrated in these four reporting OEM C units rather than being widespread across the OEM population.</li>
        </Statements>
        <Typography sx={{ ...statementStyle, mt: 3 }}>Medium confidence that these four deserve technical review. Low confidence in the technical diagnosis or whether a field visit is required.</Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>The recurrence and rarity are supported by the supplied data. The meaning of <code>ALM_HP_LOWFLOW</code> is not documented in the case, so the cockpit must not translate the code into a diagnosis or automatically dispatch a technician.</Typography>
        <Typography sx={{ mt: 2, fontWeight: 600 }}>Dispatch remains a planner decision.</Typography>
      </Box>
      <Box sx={{ borderLeft: { md: '1px solid' }, borderColor: { md: 'divider' }, pl: { md: 4 } }}><Subheading>{connectivity.length} units should go to data/connectivity investigation first</Subheading>
        <Typography className="unit-id" sx={{ mb: 2, lineHeight: 1.8 }}>{connectivity.map(row => row.unitId).join(' · ')}</Typography>
        <Label>Observed</Label><Statements>
          <li>Each previously reported telemetry.</li>
          <li>Each stops reporting on {formatDate(connectivity[0].latestReading)}.</li>
          <li>Dataset snapshot runs through {formatDate(evidence.snapshotDate)}; gap = {connectivity[0].daysStale} days.</li>
          <li>Units span different OEMs.</li>
        </Statements>
        <Typography sx={{ ...statementStyle, mt: 3 }}>High confidence that telemetry stopped; low confidence that the heat pump itself needs a field visit.</Typography>
        <Typography sx={{ mt: 2, fontWeight: 600 }}>Investigate data/connectivity before considering field service.</Typography>
      </Box>
    </Box>,
  },
  {
    question: 'The most frequent signal is not necessarily the most useful one',
    content: <>
      <Label>Observed</Label>
      <EvidenceTable label="Raw signal frequency" headers={['OEM', 'Raw signal', 'Observations', 'Reporting units', 'MVP interpretation']} rows={evidence.signalFrequency.slice(0, 6).map(row => [
        row.oem, <code>{row.rawSignal}</code>, row.observations.toLocaleString('en'), row.reportingUnitsWithSignal,
        row.rawSignal === 'ALM_HP_LOWFLOW' ? 'Candidate for technical review' : row.rawSignal === '6021' ? 'Keep off front page' : 'Keep off front page by default',
      ])} />
      <Typography variant="body2" color="text.secondary">Source: error_code_summary.csv. “Reporting units” counts units with that raw signal; observations are not confirmed faults.</Typography>
      <Typography sx={{ ...statementStyle, mt: 3, maxWidth: '85ch' }}>I do not suppress code <code>6021</code> because I know it is harmless. I suppress it because it appears on essentially every reporting OEM B unit and there is no supplied code dictionary explaining its meaning. It is therefore not discriminating enough for a short attention list.</Typography>
      <Typography sx={{ ...statementStyle, mt: 2, maxWidth: '85ch' }}>I surface <code>ALM_HP_LOWFLOW</code> as a raw signal, not a diagnosis, because its combination of recurrence, recency and low prevalence makes it more useful for prioritization.</Typography>
      <LabeledNote label="Hypothesis to validate">Recent, repeated, low-prevalence raw signals are more useful for initial planner triage than ubiquitous undocumented signals.</LabeledNote>
      <LabeledNote label="Hypothesis to validate">A multi-day telemetry gap on a unit that previously reported is worth data/connectivity investigation.</LabeledNote>
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Label>{heuristic.label}</Label>
        <Typography variant="body2" color="text.secondary">Persistent raw signal: ≥{heuristic.minimumReportingDays} reporting days; &lt;{heuristic.maximumOemPrevalenceExclusivePercent}% of reporting units within that OEM; last observed ≤{heuristic.recentWindowDaysInclusive} days before the snapshot.</Typography>
        <Typography variant="body2" color="text.secondary">Stale telemetry: previously reporting; latest reading ≥{heuristic.staleDaysInclusive} days before the snapshot.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Dataset-specific heuristics, not industry rules, OEM specifications, SLAs or validated service policy.</Typography>
      </Box>
    </>,
  },
  {
    question: 'What did I build?',
    content: <>
      <Typography sx={{ fontSize: { xs: '1.375rem', md: '1.875rem' }, fontWeight: 600, mb: 4 }}>Detect → Inspect → Decide → Hand over</Typography>
      <Statements>
        <li><strong>Needs Attention</strong> — short explainable worklist.</li>
        <li><strong>Evidence drawer</strong> — why the unit surfaced and how current the data is.</li>
        <li><strong>Technical Visit Briefing</strong> — structured evidence handover after planner review.</li>
        <li><strong>All Units</strong> — secondary known-unit lookup.</li>
      </Statements>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, maxWidth: '85ch' }}>Beyond MVP: evolve the attention item into a persistent service case so planners can see whether a unit is already reviewed, assigned, en route or resolved. Start with lightweight manual state; later synchronize with dispatch / ticketing systems.</Typography>
    </>,
  },
  {
    question: 'How would I validate next?',
    content: <>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box><Subheading>Signal quality</Subheading><Label>Hypothesis to validate</Label>
          <Typography sx={statementStyle}>The four surfaced technical-review units correspond more often to genuine service needs than a random or high-frequency-code baseline.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Historical backtest: link surfaced cases to service outcomes if available; evaluate actionability, false positives and lead time before eventual service events.</Typography>
        </Box>
        <Box><Subheading>Routing quality</Subheading><Label>Hypothesis to validate</Label>
          <Typography sx={statementStyle}>Separating telemetry/data issues from equipment review reduces avoidable field investigation.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Track planners’ decisions on connectivity cases, unnecessary truck rolls and no-fault-found visits where the source problem was data rather than equipment.</Typography>
        </Box>
        <Box><Subheading>Planner efficiency</Subheading><Label>Hypothesis to validate</Label>
          <Typography sx={statementStyle}>A short explainable list reduces planner triage effort without hiding important cases.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Planner shadow mode: measure triage time, tool switching, actionability of surfaced items and missed high-concern cases.</Typography>
        </Box>
      </Box>
      <Typography sx={{ ...statementStyle, fontWeight: 600, mt: 4 }}>Historical backtest → planner shadow mode → small live pilot</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Set quantitative targets after establishing the baseline.</Typography>
      <LabeledNote label="Guardrail">Uncertain telemetry must never become unsupported diagnosis.</LabeledNote>
    </>,
  },
  {
    question: 'The one missing dependency I would pursue first',
    content: <>
      <Typography sx={{ ...statementStyle, fontWeight: 600, mb: 3 }}>Authoritative OEM C service-code semantics for <code>error_code_raw</code>, especially <code>ALM_HP_LOWFLOW</code>.</Typography>
      <Statements>
        <li>The strongest technical-review cohort in the supplied data is driven by this OEM C raw signal.</li>
        <li>Today the product can describe its recurrence, recency, and rarity.</li>
        <li>It cannot confidently explain the signal’s technical meaning.</li>
        <li>Valid service-code semantics could make the planner / technician handoff materially more actionable without jumping prematurely to remote control.</li>
      </Statements>
      <LabeledNote label="Open question">What does <code>ALM_HP_LOWFLOW</code> officially mean in OEM C service documentation?</LabeledNote>
      <LabeledNote label="Assumption">Thermondo has an internal owner of the OEM C integration or vendor relationship who can obtain or validate OEM C technical service-code documentation.</LabeledNote>
      <Box sx={{ ...columns, mt: 3 }}>
        <Box><Subheading>Who would need to deliver it</Subheading><Typography>Thermondo's OEM C integration / vendor owner together with the OEM C technical or service contact.</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Role to identify; the brief does not confirm an internal team name.</Typography></Box>
        <Box><Subheading>Difficulty: Medium / externally dependent.</Subheading><Typography color="text.secondary">The information likely exists on the manufacturer side, but access, versioning, and permission to operationalize it may require vendor coordination.</Typography></Box>
      </Box>
      <Box component="blockquote" sx={{ mx: 0, mt: 4, mb: 0, pl: 2.5, borderLeft: '2px solid', borderColor: 'divider', maxWidth: '85ch' }}>
        <Label>First-week working message</Label>
        <Typography sx={{ lineHeight: 1.7 }}>Hi — I’m validating a service-triage rule using OEM C telemetry. Four units repeatedly emit <code>ALM_HP_LOWFLOW</code>, but we do not have an authoritative mapping for <code>error_code_raw</code>, so I don’t want to turn the label into a diagnosis. Could you share the current OEM C service-code documentation for this signal — ideally code meaning and whether it normally requires service action — or connect me to the technical owner who can validate it? A partial answer for this code is enough for the first version. I’m not asking for write access yet.</Typography>
      </Box>
    </>,
  },
  {
    question: 'How I built and reviewed this with AI',
    content: <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Approximate retrospective breakdown · 4h30 total</Typography>
      <Box sx={columns}>
        <Box><Subheading>1 · Human framing</Subheading><Label>~40 min</Label><Typography>I defined the primary user, problem / JTBD, non-goals, acceptance criteria and evidence-vs-diagnosis rule.</Typography></Box>
        <Box><Subheading>2 · AI-assisted exploration</Subheading><Label>~55 min</Label><Typography>Wattson McStudyson — Custom GPT</Typography><Typography variant="body2" color="text.secondary">GPT-5.6 Sol</Typography><Typography sx={{ mt: 1 }}>Challenge assumptions; structure the case; pressure-test prioritization; refine metrics and trade-offs; prepare implementation prompts.</Typography><CustomGptSetup /></Box>
        <Box><Subheading>3 · Human verification</Subheading><Label>~65 min</Label><Typography>I manually checked joins, unit reconciliation, OEM counts, telemetry coverage, raw-signal recurrence, attention cohorts, exclusions and whether interpretations were supported by source data.</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Unsupported semantic conclusions were rejected.</Typography></Box>
        <Box><Subheading>4 · AI-assisted implementation</Subheading><Label>~70 min</Label><Typography>Codex CLI</Typography><Typography variant="body2" color="text.secondary">GPT-6 Astra — High reasoning</Typography><Typography sx={{ mt: 1 }}>Inspect prepared outputs; implement the constrained React + TypeScript + MUI application; create deterministic checks; iterate through review gates.</Typography></Box>
        <Box><Subheading>5 · Independent AI review</Subheading><Label>~20 min</Label><Typography>I added an independent review pass using a separate AI agent to challenge the completed solution from a fresh perspective — looking for unsupported assumptions, missing assignment questions, product-logic inconsistencies and overclaiming.</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>I treated its output as critique rather than instruction: each recommendation was checked against the source data, the assignment and the product decisions before being accepted or rejected.</Typography></Box>
        <Box><Subheading>6 · Human arbitration</Subheading><Label>~20 min</Label><Typography>Accepted changes were resolved one by one before implementation.</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>I also removed my unsupported service-tier priority assumption: the case defines no SLA order. Tier remains context and an explicit sort option.</Typography></Box>
      </Box>
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', maxWidth: '85ch' }}>
        <Subheading>One concrete AI mistake I corrected</Subheading>
        <Typography sx={{ mb: 2 }}>The generated UI initially displayed a unit’s last service visit as normal context even though the source data showed that the visit occurred before commissioning.</Typography>
        <Statements><li>Surfaced it as a “Source data conflict”.</li><li>Did not guess which date was correct.</li><li>Kept the conflicting field out of prioritization.</li></Statements>
        <Typography sx={{ mt: 2 }}>The useful signal is not that AI made no mistakes. It is that the workflow made mistakes detectable, reviewable and correctable before they became product logic.</Typography>
      </Box>
      <Box sx={{ mt: 4, maxWidth: '85ch' }}><Subheading>Actual time</Subheading>
        <Typography sx={{ fontWeight: 600 }}>Actual focused time: ~4h30. This exceeded the stated 4-hour cap by approximately 30 minutes.</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>The overrun came from additional data validation and demo QA. Under a strict 4-hour stop, I would cut presentation polish and secondary validation detail before cutting the checks that establish whether the cockpit is showing the correct units.</Typography>
      </Box>
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
    {index === 5 && <Button component="a" href={import.meta.env.BASE_URL} variant="outlined" sx={{ mt: 4 }} onClick={event => {
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

# Service Cockpit — planner review prototype

Local React / TypeScript / MUI prototype for planner-led service triage.

## Run

Use Node 22.18+ (or a current Node 24/26 release) and Python 3.

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL at `/service-cockpit-case/`.

The prepared JSON is included. No backend, credentials, persistence, browser storage,
or API integrations are required. All interaction state lives in React memory.

```sh
npm run prepare:data  # regenerate static JSON from ../outputs/ only
npm run check:data    # check source consistency and snapshot expectations, no writes
npm test              # data contract and filtering/sorting regression checks
npm run build
npm run lint
```

## Implemented scope

- Needs Attention is the default worklist.
- Queue tabs, case-insensitive unit/customer search, immediate OEM/region/tier/reason filters.
- Dense worklist with raw signals, prepared persistence evidence, actual latest dates and ages.
- Evidence-only default ordering, explicit OEM/region/tier/latest-data sorting, and reset.
- Shared drawer foundation with identity, attention, data state, service context, and limitations.
- Service-date ordering conflicts shown as source data observations without changing either date.
- Thirty-day persistent OEM signal timeline distinguishing observed signals, other reporting days,
  and missing telemetry. Only shown for technician-review persistent-signal cases.
- Technical Visit Briefing for technician review: a compact confirmation with a fixed reason,
  five preselected evidence sections, an optional planner note, and a dedicated printable document.
- Back to unit restores the same worklist, selected unit, filters, sorting, and in-memory draft.
- Secondary All Units lookup with derived fleet counts, unit/customer search, immediate
  OEM/data-state/region/service-tier filters, Unit ID ordering, and compact pagination.
- The same drawer opens from either list. Units without attention show basic latest values and
  one OEM-appropriate recent trend, with telemetry availability as the fallback and no briefing CTA.
- Keyboard-accessible unit buttons, MUI modal focus management, Escape/backdrop closing.
- Responsive controls, horizontally scrollable table, full-width drawer below 900px.
- Loading, fetch-error/retry, and empty/clear-filter states.
- Secondary `/case-study` view with nine assignment-first case-study sections, previous/next controls,
  slide count, left/right keyboard navigation, and a return link to the preserved cockpit state.

The approved Needs Attention and technician evidence/briefing layouts remain in place.

## All Units

All 400 canonical units are searchable, including the 132 without telemetry. Fleet counts describe
the full supplied snapshot; the footer shows the filtered result count. Pagination starts at 25 units
and resets on search/filter changes. Ordering is always Unit ID, independent of service tier or attention.
Navigation preserves each list's local filters and selection. A briefing opened from All Units returns
to that same list and unit. Needs Attention remains the initial screen.

Normal-unit drawers use the actual latest reading without substituting older values into missing fields.
Recent trends cover the last 14 calendar days of the supplied snapshot: flow/return temperature for OEM A,
compressor starts for OEM B, and DHW temperature for OEM C. Display assumption: a series needs at least
two real numeric observations to appear as a trend. When no requested series meets that condition,
the drawer shows reporting-day availability. Gaps stay unconnected and suspected sentinels stay excluded.
Energy is shown only as a raw OEM value where relevant, never as a cross-vendor comparison.

## Technical Visit Briefing

The existing drawer CTA opens a MUI confirmation dialog. The core reason is fixed to the
prepared attention trigger. Supporting sections can be deselected, while identity, trigger,
first/last observed dates, persistence, and source data conflicts always remain in the handover.
Conflicting service dates remain visible even when the optional service-context section is omitted.
All five supporting sections are included by default.

The document uses only prepared data. Telemetry comes from the actual latest reading, excludes
unavailable and suspected-sentinel values, and retains raw OEM energy/status semantics. Missing,
intermittent, and unsupported fields remain distinct. It adds no diagnosis, scoring, or repair advice.
The planner note is plain text. Blank notes are omitted.

Print briefing opens the browser print dialog. A4 print styles hide application controls and
the worklist, keep evidence blocks together, and allow long notes to paginate. No PDF service,
share integration, backend, or persistent storage is used. The worklist remains mounted while
the document is visible, and drafts are isolated by unit in React memory.

## Data provenance and transformations

`scripts/prepare_data.py` reads only these prepared outputs:

| Source | Use |
| --- | --- |
| `units_clean.csv` | Canonical fleet, service metadata, existing freshness and coverage values |
| `attention_list.csv` | Exact attention membership, queues, and signals |
| `unit_error_recurrence.csv` | First/last observations and reporting-day counts for selected signals |
| `telemetry_clean.csv` | Latest readings, recent evidence, and observed field presence |

It writes `public/data/cockpit.json`, including source SHA-256 hashes.
It never reads raw data, executes notebooks, reconciles identities, or selects attention candidates.
Missing dates stay null; explicit ISO and German date formats become ISO date strings.
Region values and raw OEM code/status strings retain their source meaning.

Snapshot assertions: 400 resolved units (A 140, B 150, C 110), 268 with telemetry,
and seven attention items split 4 technician / 3 data-connectivity.
These are validation expectations only: visible fleet and queue counts come from JSON arrays.
The three unresolved installations are absent from the prepared fleet, and the twelve duplicate
source rows have already been reconciled. Five telemetry-only IDs (135 readings) are excluded
by the canonical fleet join and recorded in JSON metadata.

## Presentation semantics

- Snapshot: 30 July 2026. Reading ages come from prepared values, never the current clock.
- No telemetry: `has_telemetry=false`. Stale: the exported stale flag. Current: remaining
  reporting units. The adapter checks agreement with the notebook's existing two-day window;
  it does not create or reroute attention. Six units last reported on 29 July and remain Current.
- `-999` temperature readings are suspected sentinels. Their original values are retained,
  while chart values become null. They are never classified as confirmed invalid readings.
- Zero DHW and negative electrical energy remain raw, unvalidated observations.
- OEM field availability describes only the supplied resolved-fleet extract: no observations
  means `unsupported`, partial presence means `intermittent`, and otherwise `observed`.
  None of these labels claims a formal capability contract. For an observed/intermittent field,
  no readings for an individual unit means `missing_for_unit`; a gap in its latest observation
  is separately `missing_reading`. Unsupported fields do not create incomplete-data flags.
- The existing `connectivity_conflict` field produces a connectivity source-conflict flag.
  A separate service-context flag observes when both supplied dates exist and last service
  precedes commissioning. Dates remain unchanged; the flag does not influence attention.
- Recent evidence includes the last 30 snapshot days, with null measurements and no invented
  readings. The persistent-signal timeline keeps absent reporting days distinct from readings
  without the selected raw OEM signal. No diagnosis or severity is inferred.
- Queue membership never changes. Default ordering uses persistence then recency for technician review, and stale days
  for data/connectivity review; Unit ID breaks ties. Service tier never affects default priority.
  It remains visible, filterable and explicitly sortable; no SLA ordering is implied.
- Filters persist when switching queues; counts on tabs describe full queue membership.
- All numeric energy values keep raw OEM semantics; no cross-OEM comparison or diagnosis.

## Architecture

`src/pages/NeedsAttentionPage.tsx` and `src/pages/AllUnitsPage.tsx` own their local list state. Reusable UI is in
`src/components/`. Pure filtering/sorting and formatting helpers are in `src/data/`.
`src/types.ts` describes the static JSON contract. The theme and minimal global CSS
provide the shared visual foundation. `src/briefing/` contains the confirmation, pure evidence
projection, document view, and print styles. `App.tsx` switches document visibility without
unmounting either list's state. `src/data/allUnits.ts` handles fleet lookup/filtering and
`src/data/unitTelemetry.ts` projects existing readings into the small normal-unit trends.
`src/pages/CaseStudyPage.tsx` contains the static presentation copy and local slide index.
The AI-use slide opens a scrollable MUI dialog with the author's verbatim Custom GPT configuration
from `src/pages/wattson-configuration.txt`. The dialog does not navigate or change the slide.
The header link uses the browser History API for `/case-study`; direct loading and browser
back/forward are supported without a routing or presentation library. Internal URLs are relative
to Vite's configured base, `/service-cockpit-case/`. The production build also copies its HTML
entry to `dist/case-study/index.html`, so GitHub Pages serves direct case-study links and refreshes
without SPA rewrites. Both entry points load the same app, assets, and prepared JSON.

## GitHub Pages deployment

The expected public URL is `https://albertoperezpm2.github.io/service-cockpit-case/`.
The direct case-study URL is `https://albertoperezpm2.github.io/service-cockpit-case/case-study/`.
GitHub Pages redirects the directory URL without a trailing slash to this entry point.

After approving and pushing the changes, select **Settings → Pages → Build and deployment →
Source: GitHub Actions** in the repository. The `Deploy frontend to GitHub Pages` workflow runs
on frontend/workflow changes pushed to `main`, or manually from the Actions tab. Deployment
is restricted to `main`. Set Pages visibility to public if a visibility selector is available;
the app has no authentication or runtime credentials.

The workflow uses Node 24 and the runner's Python 3, installs locked dependencies with `npm ci`,
runs tests and lint, and builds the app. Only `frontend/dist` is uploaded. Notebooks, raw CSVs,
analysis outputs, and repository source files are not part of the Pages artifact. The committed
frontend JSON is used as-is; deployment does not regenerate data.

Internal links and JSON requests use Vite's `BASE_URL`. External GitHub notebook links and the
browser-based Technical Visit Briefing print flow are unchanged. The two supported page paths
have actual HTML entries; arbitrary unknown paths retain GitHub Pages' normal 404 behavior.

To check the production build locally, run `npm run build` and `npm run preview`, then open
`/service-cockpit-case/` or `/service-cockpit-case/case-study/` at the preview server URL.

## Case-study evidence

`src/data/caseStudyEvidence.ts` exposes a small presentation-only snapshot generated by
`scripts/prepare_case_study_evidence.py`. It copies signal frequencies from the saved summary,
projects the prepared cohorts, and counts the installed/telemetry sets. Installation source
rows are counted read-only; identity decisions remain in the saved EDA and canonical exports.
Only aggregate reconciliation facts and cohort IDs enter the new snapshot, never raw contact data.
The cockpit does not depend on this presentation module.

Run `python3 scripts/prepare_case_study_evidence.py` only when deliberately refreshing presentation
evidence. The normal test suite compares it with the source files and asserts the approved
reconciliation, cohort IDs, signal frequencies and notebook heuristic predicates. No analytical
pipeline or frontend telemetry JSON is regenerated during deployment.

The case study separates observations, assumptions, hypotheses and open questions. Validation
uses backtest → shadow mode → pilot, with quantitative targets deferred until a baseline exists.
The Custom GPT configuration remains a verbatim source document in its modal, including its
original labeling examples; case-study presentation labels use plain text.

## Verification for this delivery

Snapshot validation, thirteen Python checks, forty-five TypeScript evidence/selector/briefing/All Units/case-study checks,
production build, and lint pass. Component rendering checks cover the document, shared drawer variants,
latest values, fallback charts, derived fleet counts, navigation, table dates, and confirmation copy.
Interactive/visual browser QA could not run because this session has no connected browser.
Print pagination and browser Back-to-unit/focus interactions still require a browser check.

Vite reports a non-blocking bundle-size warning for the current MUI-based application bundle.

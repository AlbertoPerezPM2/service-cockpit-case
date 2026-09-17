# Service Cockpit MVP — Product Specification

## 1. Purpose

Build a clickable MVP for a planner-first Service Cockpit for heat-pump service operations.

The MVP should help a service planner:

**detect → inspect → decide → hand over**

The product should make it easy to identify a short list of units that deserve attention, understand why they surfaced, distinguish technical-review cases from data/connectivity cases, inspect supporting evidence, and prepare a structured Technical Visit Briefing when technician review is justified.

This is not a generic telemetry dashboard, ticketing tool, or remote-control interface.

## 2. Product rationale

### Primary use case
The primary use case is **planner-led service triage before dispatch**.

The planner needs to answer:
1. Which units need attention now?
2. Why did each unit surface?
3. Is this an equipment-review issue or a data/connectivity issue?
4. Is there enough evidence to prepare a technician handover?
5. Can the relevant context be assembled without opening multiple tools?

Planner triage sits upstream of dispatch and can influence many downstream technician hours.

The MVP therefore focuses only on the minimum workflow required to support the planner’s decision and handover.

**🟡 Assumption:** improving planner triage creates greater near-term operational leverage than optimizing one technician case at a time.

### Secondary use case
Technicians and other internal users may need to look up any known unit and inspect current available data.

This is supported through a secondary **All Units** view.

## 3. Users

### Primary user
**Service planner / dispatcher**

Primary job:
> Identify units that require attention, understand the evidence, and determine the appropriate next step before dispatch.

### Secondary user
**Service technician**

Secondary job:
> Find a known unit and inspect current context and available telemetry before or during service preparation.

### Future users, out of MVP
- subcontracted service partners
- installers
- support agents performing remote actions
- service managers configuring prioritization or rules

## 4. Product principles

1. **Evidence before diagnosis** — show observable signals, not inferred technical root causes.
2. **Attention before exhaustiveness** — default to a short, actionable worklist rather than the full installed base.
3. **Data trust is separate from equipment health** — “Current” means telemetry is recent, not that the unit is healthy.
4. **Avoid false precision** — no synthetic health score, severity score, or numeric confidence score.
5. **Different OEMs have different capabilities** — missing-by-design fields must not look like degraded data quality.
6. **Do not turn every signal into a truck roll** — data/connectivity issues remain distinct from technician-review cases.
7. **Desktop-first, tablet-friendly** — the primary interaction is a dense worklist with fast drill-down.

## 5. Working data model

Use the prepared analysis outputs as source of truth for the prototype.

Working fleet:
- 400 confidently identifiable resolved units
- 3 additional unresolved installation records retained separately
- 268 resolved units with telemetry in the supplied period

Important data constraints:
- OEM telemetry coverage differs materially.
- Some fields are unavailable by OEM rather than missing unexpectedly.
- Energy semantics differ across vendors and should not be compared across OEMs without documentation.
- Raw OEM error/status values are not fully documented.
- The current dataset supports a small set of explainable attention candidates rather than a broad diagnostic model.

**🟡 Assumption:** recurring `TH-xxxxx-1` references represent malformed versions of canonical `TH-xxxxx` references, based on corroborating identity and telemetry evidence.

**🟡 Assumption:** installation-level `connectivity` is directionally useful but is not authoritative live-status truth.

**🟡 Assumption:** service-tier priority order is `care_plus > care > optimize > free`.

**🧪 Hypothesis requiring validation:** recurring signals and freshness patterns can later be mapped to calibrated actionability/confidence using historical service outcomes, technician findings, and false-positive rates.

## 6. Attention model

Do not use a universal health score.

Attention is represented as explicit, explainable signals.

### Queue 1 — Technician review
Current prototype signal:

**Persistent OEM signal**

Example:
> `Persistent OEM signal · ALM_HP_LOWFLOW`  
> `Observed on 14 reporting days`

The raw OEM code should be visible directly in the main worklist.

Do not relabel undocumented raw signals as fault, critical, broken, failure, or root cause.

### Queue 2 — Data / connectivity review
Current prototype signal:

**Telemetry stopped**

Example:
> `Telemetry stopped · Last reading 10 days ago`

These cases should not automatically become technician work.

### Current candidate examples
Technician-review cohort:
- TH-02298
- TH-02312
- TH-02395
- TH-02398

Data/connectivity-review cohort:
- TH-02023
- TH-02280
- TH-02304

The frontend should consume the prepared attention output rather than recompute prioritization logic.

## 7. Data-state model

Data state describes telemetry trust/freshness, not equipment condition.

### Mutually exclusive primary state
- **Current**
- **Stale**
- **No telemetry**

Do not use “Offline”.

### Optional data-quality flags
- **Incomplete data**
- **Invalid reading**
- **Conflicting source data**

These are additive flags, not top-level mutually exclusive states.

### Field-level availability
Use:
> `Not available from OEM`

when a field is unsupported by that OEM.

Do not classify unsupported-by-design fields as incomplete.

A unit may be:
> Data state: `Current`

and simultaneously:
> Attention: `Persistent OEM signal`

These concepts must remain visually separate.

## 8. Information architecture

Primary navigation:
- **Needs Attention**
- **All Units**

Default landing page:
**Needs Attention**

## 9. Screen 1 — Needs Attention

### Purpose
Help the planner immediately understand the review workload and scan the most relevant evidence.

### Header
Show:
- `Needs Attention`
- `7 units require review`
- `400 units monitored`
- `Last telemetry snapshot: 30 Jul 2026`

Do not add fleet-health KPIs.

### Queue tabs
- `Technician review (4)`
- `Data / connectivity (3)`

Queue is a workflow distinction, not just another filter.

### Search
One search box:
> `Search unit or customer`

Searches:
- Unit ID
- Customer name

### Filters
- OEM
- Region
- Tier
- Reason

Filters update immediately. No Apply button.

### Table columns
Desktop order:
1. Unit ID
2. Customer
3. OEM
4. Reason + evidence
5. Latest data
6. Tier
7. Region

`Reason + evidence` should be the widest column.

### Sorting
Default:
1. queue
2. service tier
3. evidence persistence / recency

Allow user sorting on Tier, Latest data, Region, and OEM.

Do not use a synthetic priority score.

### Service-tier styling
Use compact categorical chips.

Avoid traffic-light semantics.

Use a non-red/amber/green palette such as blue, purple, teal, and gray.

Tier must not visually resemble technical severity.

### Interaction
Clicking a row opens a **right-side drawer**.

On narrow/tablet layouts, the drawer may become full-screen.

**🟡 Assumption:** the planner typically reviews multiple candidate units per session, so preserving list context improves efficiency.

## 10. Screen 2 — Unit detail drawer

The same drawer component is used from both Needs Attention and All Units.

### Shared header
Show:
- Unit ID
- Customer
- OEM
- Tier
- Region

### Attention unit sections

#### ATTENTION
Show:
- attention label
- raw OEM signal if applicable
- recurrence/persistence
- first observed
- last observed

Example:
> Persistent OEM signal  
> Raw signal: ALM_HP_LOWFLOW  
> Observed on 14 reporting days  
> First seen: 17 Jul  
> Last seen: 30 Jul  
> Meaning not validated

#### DATA STATE
Show:
- Current / Stale / No telemetry
- latest telemetry date
- continuity/reporting context
- data-quality flags when present

#### SERVICE CONTEXT
Show:
- commissioning date
- last service visit

#### RECENT EVIDENCE
Show one small chart relevant to the attention trigger.

For persistent OEM signal:
- occurrence timeline over recent history

For stale telemetry:
- telemetry-availability timeline ending where reporting stopped

Do not show a generic dashboard chart when the unit has an active attention trigger.

#### DATA LIMITATIONS
Show important OEM-specific or field-specific limitations.

### CTA behavior

For **Technician review**:
- show primary CTA: `Prepare Technical Visit Briefing`

For **Data / connectivity review**:
- show no primary CTA

The data/connectivity drawer is informational and should reinforce:
> review telemetry/integration before dispatch

### No mutable alert state
Do not include:
- dismiss
- snooze
- resolve
- assign technician
- change queue

## 11. Drawer behavior for normal units

For a unit opened from All Units with no active signal:

Show:
> `No active attention signals`

Then display basic orientation data.

### OEM A
Latest values may include:
- Outdoor temperature
- Flow temperature
- Return temperature
- DHW temperature
- Compressor starts

Recent chart:
- Flow vs return temperature over the last ~14 days

### OEM B
Latest values may include:
- Outdoor temperature
- Compressor starts
- Electrical energy as a raw OEM value
- Status where useful

Recent chart:
- Compressor starts over the last ~14 days

Limitations:
- DHW temperature not available
- Thermal energy not available
- Flow/return may be intermittent

### OEM C
Latest values may include:
- Outdoor temperature
- DHW temperature where available
- Electrical energy as a raw OEM value

Recent chart:
- DHW temperature over available recent readings

Limitations:
- Return temperature not available
- Compressor starts not available
- Thermal energy not available
- Flow temperature may be intermittent

### Fallback chart
If no useful OEM-specific trend is available:
- show telemetry availability/reporting days

Do not visually compare energy values across OEMs.

**🟡 Assumption:** basic recent trends are useful orientation for a known unit even when no active attention signal exists.

## 12. Technical Visit Briefing flow

### Entry point
From a Technician-review drawer:
> `Prepare Technical Visit Briefing`

### Lightweight confirmation
Show a compact form/panel.

#### Reason for visit
Preselect the current attention trigger when clear.

Example:
> ☑ Persistent OEM signal — ALM_HP_LOWFLOW

#### Include in briefing
Preselect relevant evidence:
- ☑ Signal history
- ☑ Latest telemetry status
- ☑ Available OEM telemetry
- ☑ Data limitations
- ☑ Service context

#### Planner note
Optional free-text field.

#### Primary action
> `Generate briefing`

The core trigger should be preselected and should not be easy to omit accidentally.

**🟡 Assumption:** preselecting evidence directly tied to the trigger reduces handover omissions without removing planner control.

## 13. Generated Technical Visit Briefing

Use a dedicated print/share-style view.

True PDF generation is not required in the MVP.

### Include
- Unit ID
- Customer
- OEM
- Service tier
- Region
- Reason for visit
- Raw attention signal
- Evidence summary
- First/last observed
- Relevant recent telemetry
- Data state
- Data limitations
- Service context
- Planner note if entered

### Exclude
Do not include:
- probable root cause
- recommended repair
- component replacement
- expected technician duration
- recommended technician action
- unvalidated diagnosis

The briefing is a structured evidence handover, not a repair instruction.

**🟡 Assumption:** a structured pre-visit evidence package reduces re-investigation and improves technician preparation.

## 14. All Units

### Purpose
Support known-unit lookup and inspection.

This is a secondary utility, not a second prioritization surface.

### Header
Show:
- `All Units`
- `400 resolved units monitored`
- `268 with telemetry`

### Search
> `Search unit or customer`

### Filters
- OEM
- Data state
- Region
- Service tier

### Table columns
1. Unit
2. Customer
3. OEM
4. Data state
5. Latest data
6. Tier
7. Region

Default sort:
- Unit ID or Customer

Do not reuse attention-specific prioritization.

### Interaction
Click row → same shared right-side drawer.

If there is no active attention signal:
- show inspection-only state
- do not show Technical Visit Briefing CTA

**🟡 Assumption:** full-fleet access is necessary, but it does not need equal prominence with the primary triage workflow.

## 15. Success metrics

### Primary product outcome
> Reduce the time and uncertainty required to decide which units deserve service attention and what evidence should accompany the handover.

This is a target outcome, not a claimed prototype result.

### User metrics
Planner:
- time to review morning attention list
- % of surfaced units where routing decision can be made without another tool
- % of generated briefings accepted without additional manual information gathering

Technician:
- % of visits where briefing was opened before arrival
- perceived usefulness of pre-visit context

### Operational metrics
- avoidable truck rolls
- repeat visits per case/unit
- “no fault found” visits
- time from detectable issue to service review
- technician preparation time

**🟡 Assumption:** better triage and structured handover can reduce unnecessary field work and repeat investigation.

### Quality / guardrails
- false-positive attention rate
- % of surfaced signals later judged non-actionable
- stale/invalid-data cases incorrectly interpreted as equipment faults
- number of units hidden by unresolved identity/data issues
- briefing generation with missing critical context

Avoid vanity metrics such as alert volume or dashboard views.

## 16. Prototype success criteria

The prototype succeeds if a planner can:
1. open the cockpit and immediately see the short attention list
2. understand why each unit surfaced
3. distinguish technician-review from data/connectivity-review
4. inspect evidence without losing the list
5. prepare a Technical Visit Briefing from a justified technician-review case
6. search the full fleet when they already know the unit

## 17. MVP non-goals

Deliberately exclude:

### Remote control / settings changes
No heating-curve changes, restart, shutdown, or bulk commands.

Reason:
requires identity safeguards, permissions, auditability, validated OEM command semantics, and safety controls.

### Technician assignment / dispatching
No scheduling or assignment workflow.

### Alert lifecycle
No dismiss, snooze, resolve, or manual queue changes.

### Automated diagnosis
No root-cause inference or repair recommendation.

### Global health / severity / confidence score
No synthetic score.

### Cross-OEM efficiency comparison
No COP/energy ranking across vendors.

### Ticketing / CRM replacement
The cockpit supports triage and handover only.

### Installer / subcontractor access management
RBAC and partner access are future scope.

### Every telemetry field in the main table
Detailed telemetry belongs in the drawer.

### Bulk actions
Especially restart/shutdown.

Future remote control should require strong identity confirmation, permissions, auditability, safe defaults, and command-level safeguards.

## 18. MVP scope rationale

The MVP revolves around the primary planner use case.

Because the selected job is:

> detect → inspect → decide → hand over

the MVP includes only capabilities required to prove that workflow.

Adjacent features are deferred unless they directly improve that sequence.

**🟡 Assumption:** the highest-value near-term step is improving service triage before adding transactional or remote-control capabilities.

## 19. Prototype showcase states

Build exactly four primary showcase states:

### 1. Needs Attention — default home
Demonstrates:
- lean workload header
- queue split
- filters
- short explainable attention list

### 2. Needs Attention + unit drawer
Demonstrates:
- persistent OEM signal
- evidence
- data state
- service context
- recent evidence chart
- Technical Visit Briefing CTA

### 3. Technical Visit Briefing
Demonstrates:
- lightweight confirmation
- preselected evidence
- generated print/share handover

### 4. All Units
Demonstrates:
- full-fleet lookup
- search/filter
- normal unit with no attention signal
- same drawer pattern
- OEM-appropriate basic data

Do not create separate standalone pages for every interaction state.

## 20. Technical implementation

### Stack
- React
- TypeScript
- MUI

### State management
Use React local state and derived state.

Do not add Redux.

**🟡 Assumption:** local React state is sufficient for the MVP.

### Data input
Frontend consumes prepared JSON derived from analyzed outputs.

Do not reimplement raw-data cleaning or attention logic in the browser.

Recommended pipeline:

`raw CSVs → EDA / cleaning → attention logic → prepared frontend JSON → React app`

**🟡 Assumption:** frontend consumes prepared JSON rather than parsing/reconciling raw CSVs in-browser.

### Persistence
None required.

Briefing form state may remain in browser memory/session state.

**🟡 Assumption:** no persistence beyond the current browser session is required for the prototype.

### Backend
None required for MVP.

Mock:
- APIs
- persistence
- authentication
- RBAC
- dispatch integration

**🟡 Assumption:** authentication, RBAC, backend APIs, and real operational integrations are outside prototype scope.

### Responsiveness
- desktop-first
- tablet-friendly
- right-side drawer on desktop
- full-screen detail panel acceptable on narrow widths

**🟡 Assumption:** desktop/tablet fidelity matters more than native mobile behavior for this cockpit.

## 21. Suggested component structure

- `AppShell`
- `PrimaryNav`
- `NeedsAttentionPage`
- `AllUnitsPage`
- `QueueTabs`
- `SearchAndFilters`
- `UnitTable`
- `DataStateBadge`
- `DataQualityFlag`
- `TierChip`
- `AttentionReasonCell`
- `UnitDrawer`
- `AttentionEvidenceChart`
- `GenericUnitTrendChart`
- `BriefingConfirmation`
- `TechnicalVisitBriefing`

Reuse components across Needs Attention and All Units.

## 22. Suggested frontend data objects

```ts
type Unit = {
  unitId: string;
  customerName: string;
  oem: "A" | "B" | "C";
  region: string;
  serviceTier: "care_plus" | "care" | "optimize" | "free";
  commissioningDate?: string;
  lastServiceVisit?: string;
  connectivity?: string;
  dataState: "current" | "stale" | "no_telemetry";
  dataQualityFlags: Array<
    "incomplete_data" | "invalid_reading" | "source_conflict"
  >;
  latestTelemetryDate?: string;
};

type AttentionItem = {
  unitId: string;
  queue: "technician_review" | "data_connectivity_review";
  reasonType: "persistent_oem_signal" | "telemetry_stopped";
  reasonLabel: string;
  rawSignal?: string;
  firstObserved?: string;
  lastObserved?: string;
  persistenceDays?: number;
  daysStale?: number;
};

type TechnicalVisitBriefing = {
  unitId: string;
  reasonForVisit: string;
  rawSignal?: string;
  selectedEvidence: string[];
  plannerNote?: string;
};
```

These types are guidance only; adapt them to the prepared JSON.

## 23. Interaction details

### Filters
Apply immediately.

### Search
Case-insensitive match on:
- unit ID
- customer name

### Drawer
Open on row click.

### Briefing
Only available for `technician_review`.

### Data/connectivity review
No primary CTA.

### Normal unit
No briefing CTA unless an active technician-review signal exists.

### Empty state
If no rows match:
> `No units match the current filters.`

Provide:
> `Clear filters`

### Loading state
Show a simple skeleton/table loading state.

### Error state
Show:
> `Service data could not be loaded.`

and a lightweight retry action if practical.

## 24. Visual direction

Use MUI with restrained styling.

Priorities:
- scan speed
- clarity
- density
- consistent spacing
- readable typography

Avoid:
- large KPI cards
- traffic-light severity everywhere
- decorative charts
- oversized whitespace
- visually dominant health scores

### Table
Dense but readable.

### Drawer
Clear section hierarchy.

### Tier chips
Categorical color treatment, not severity semantics.

### Status chips
Use semantic labeling carefully:
- Current
- Stale
- No telemetry

Do not imply equipment health.

## 25. Copy rules

Prefer factual phrasing.

Use:
- `Persistent OEM signal`
- `Telemetry stopped`
- `Observed on 14 reporting days`
- `Last reading 10 days ago`
- `Meaning not validated`
- `Not available from OEM C`

Avoid:
- `Critical fault`
- `Likely pump failure`
- `Broken sensor`
- `Unit offline`
- `82% confidence`
- `Healthy`

unless later validated.

## 26. Open questions for production follow-up

❓ What is the real service-tier priority / SLA order?

❓ What constitutes “current” vs “stale” telemetry operationally?

❓ Which raw OEM codes are technically meaningful and actionable?

❓ Which telemetry fields are officially supported per OEM?

❓ Which service outcomes can be joined to telemetry for validation?

❓ What is the authoritative unit identity across current service tools?

❓ Which user roles require cockpit access?

❓ What audit and confirmation controls are required before remote actions?

❓ What existing ticketing/dispatch system should receive the Technical Visit Briefing?

❓ Which planner decisions should eventually persist as workflow state?

## 27. Validation plan after prototype

### Planner usability
Test whether planners can:
- identify the next unit to review
- explain why it surfaced
- distinguish technical vs data/connectivity cases
- prepare a briefing without another tool

Measure:
- task completion time
- external-tool switching
- confusion about status semantics

### Signal validation
Join surfaced attention items to:
- ticket outcomes
- technician findings
- repeat visits
- no-fault-found outcomes
- avoided dispatches

Use this to estimate:
- actionability
- false-positive rate
- potential confidence calibration

### Data-state validation
Confirm with OEM/integration owners:
- freshness expectations
- unsupported fields
- sentinel values
- connectivity semantics

### Rollout approach
Before automated actions:
- historical backtest
- shadow mode
- planner pilot
- limited rollout
- monitored expansion

## 28. Build guardrails for the coding model

The implementation agent should:
1. use the prepared product logic as given
2. not invent new prioritization rules
3. not reinterpret raw OEM codes as diagnoses
4. not add a health score
5. not add dismiss/snooze/resolve
6. not add dispatching
7. not add remote control
8. not compare OEM energy values
9. keep Needs Attention as the default landing view
10. reuse the same drawer across Needs Attention and All Units
11. use attention-specific evidence charts for surfaced units
12. use OEM-appropriate generic trends for normal units
13. preserve the distinction between equipment attention and data state
14. keep the prototype desktop-first and tablet-friendly
15. favor product clarity over visual polish

## 29. One-line product definition

> **Service Cockpit helps planners turn heterogeneous heat-pump telemetry into a short, explainable service-attention worklist and a structured technician handover—without pretending to diagnose the unit.**

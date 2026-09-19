# Service Cockpit — Senior Product Manager Case Study

A planner-first service cockpit for turning heterogeneous heat-pump telemetry into explainable service attention and structured technician handovers.

## Live prototype

[Open Service Cockpit →](https://albertoperezpm2.github.io/service-cockpit-case/)

## Case study

[Read the case study →](https://albertoperezpm2.github.io/service-cockpit-case/case-study)

## Analysis

[View EDA notebook →](https://github.com/AlbertoPerezPM2/service-cockpit-case/blob/main/notebooks/01_eda.ipynb)

## Product approach

The MVP focuses on:

**Detect → Inspect → Decide → Hand over**

The primary user is the service planner / dispatcher.

The cockpit helps planners:

- identify a short list of units that deserve attention
- understand why each unit surfaced
- distinguish technician-review from data/connectivity cases
- inspect supporting evidence without losing worklist context
- prepare a structured Technical Visit Briefing when field service is justified

A secondary **All Units** view supports known-unit lookup and basic telemetry inspection.

## What the MVP deliberately avoids

The prototype does not include:

- remote control or settings changes
- technician assignment or dispatching
- dismiss / snooze / resolve workflows
- automated diagnosis or repair recommendations
- universal health or severity scores
- cross-OEM efficiency comparison

These capabilities introduce safety, workflow, persistence, integration, or data-semantic dependencies that are not required to validate the primary planner workflow.

## Data approach

The analysis pipeline:

1. reconciles installation identities
2. cleans and validates telemetry
3. identifies explainable attention signals
4. exports prepared frontend data
5. keeps analytical logic separate from UI implementation

Current resolved fleet:

- 400 units
- 268 with telemetry
- 7 attention items in the prototype
  - 4 technician review
  - 3 data / connectivity review

## Prototype stack

- React
- TypeScript
- MUI
- Vite

## Repository structure

```text
data/         Raw case inputs
notebooks/    EDA and attention logic
outputs/      Prepared analysis outputs
frontend/     React prototype
docs/         Product specification
```

## AI-assisted workflow

AI was used as an implementation and reasoning accelerator.

### Wattson McStudyson — Custom GPT

**Model:** GPT-5.6 Sol

Used for:

- case framing
- assumption challenge
- prioritization
- MVP scope
- metrics and trade-offs
- narrative refinement
- Codex prompt design

### Codex CLI

**Model:** GPT-6 Astra — High reasoning

Used for:

- data-output inspection
- React / TypeScript / MUI implementation
- validation of joins, counts, and edge cases
- iterative implementation with review gates

### My role

I owned the decision-making and orchestration: first exploring the problem and data, then locking a product spec, then using agents to implement against that spec. I reviewed each phase before the next, and used targeted review passes with different “hats” — product, data quality, UX, and engineering — to catch drift and correct the implementation.

## One concrete AI correction

The generated UI initially displayed a unit’s last service visit as normal context even though the source data showed that the visit occurred before commissioning.

I corrected this by:

- surfacing it as a **Source data conflict**
- not guessing which date was correct
- ensuring the inconsistency did not affect equipment prioritization

This reinforced a core product principle:

> **Data-quality issues should be visible, but kept separate from equipment health.**

## Time spent

Approximately **4h30 of focused working time**, spread across two evenings.

Breakdown:

- Brief + framing — 20 min
- Data exploration & cleaning — 60 min
- Attention logic — 35 min
- Product definition & MVP scope — 45 min
- Prototype implementation — 70 min
- QA, iteration & screenshots — 40 min

I slightly exceeded the suggested four-hour timebox. The additional time went into validating data consistency and making the prototype demo-ready rather than expanding scope.

## Notes

This repository was created for a Senior Product Manager take-home case study.

The prototype is intended to demonstrate:

- product reasoning
- prioritization
- data interpretation
- workflow design
- scope discipline
- AI-assisted product development

It is not intended to represent a production-ready service platform.
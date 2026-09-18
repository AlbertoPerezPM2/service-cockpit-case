import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Box, Button } from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import PrintOutlined from '@mui/icons-material/PrintOutlined'
import type { Briefing } from './briefing'
import { PersistentSignalTimeline } from '../components/PersistentSignalTimeline'
import { formatDate, readingAge, tierLabels } from '../data/formatters'
import './print.css'

function Section({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`briefing-section ${className}`}><h2>{title}</h2>{children}</section>
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>
}
function Limitation({ label, items }: { label: string; items: string[] }) {
  return items.length ? <div className="briefing-limitation"><strong>{label}</strong><p>{items.join(' · ')}</p></div> : null
}
const stateLabels = { current: 'Current', stale: 'Stale', no_telemetry: 'No telemetry' }

export function TechnicalVisitBriefing({ briefing, onBack }: { briefing: Briefing; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  const { unit, telemetryStatus, oemTelemetry, serviceContext, dataLimitations } = briefing
  const rawSemantics = [
    oemTelemetry?.fields.some(field => field.key === 'electrical_energy_kwh' || field.key === 'thermal_energy_kwh') ? 'energy' : null,
    oemTelemetry?.fields.some(field => field.key === 'status_raw') ? 'status' : null,
  ].filter(Boolean).join(' / ')

  return <main className="technical-visit-briefing">
    <Box className="briefing-toolbar" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={onBack}>Back to unit</Button>
      <Button variant="contained" startIcon={<PrintOutlined />} onClick={() => window.print()}>Print briefing</Button>
    </Box>
    <article className="briefing-document" aria-labelledby="briefing-title">
      <header className="briefing-header">
        <p className="briefing-eyebrow">Service Cockpit · {unit.unitId}</p>
        <h1 id="briefing-title" ref={heading} tabIndex={-1}>Technical Visit Briefing</h1>
        <p className="briefing-muted">Telemetry snapshot: {formatDate(briefing.snapshotDate)} · Evidence handover</p>
        <dl className="briefing-fields briefing-identity">
          <Field label="Unit ID"><span className="unit-id">{unit.unitId}</span></Field>
          <Field label="Customer">{unit.customerName}</Field>
          <Field label="OEM">OEM {unit.oem}</Field>
          <Field label="Service tier">{tierLabels[unit.serviceTier]}</Field>
          <Field label="Region">{unit.region}</Field>
        </dl>
      </header>

      <Section title="Reason for visit">
        {briefing.signals.map((signal, index) => <div className="briefing-trigger" key={signal.rawSignal}>
          <p className="briefing-reason">{briefing.reasons[index]}</p>
          <dl className="briefing-fields briefing-evidence-summary">
            <Field label="First observed">{formatDate(signal.firstObserved)}</Field>
            <Field label="Last observed">{formatDate(signal.lastObserved)}</Field>
            <Field label="Persistence">{signal.persistenceDays} reporting days</Field>
          </dl>
        </div>)}
        <p className="briefing-muted">Meaning not validated.</p>
      </Section>

      {briefing.signalHistory && <Section title="Signal history" className="briefing-history">
        {briefing.signals.map(signal => <div className="briefing-timeline" key={signal.rawSignal}>
          <PersistentSignalTimeline readings={briefing.signalHistory!} rawSignal={signal.rawSignal} snapshotDate={briefing.snapshotDate} />
        </div>)}
      </Section>}

      {telemetryStatus && <Section title="Latest telemetry status">
        <dl className="briefing-fields">
          <Field label="Data state">{stateLabels[telemetryStatus.dataState]}</Field>
          <Field label="Latest reading">{formatDate(telemetryStatus.latestReading)}</Field>
          <Field label="Reading age">{readingAge(telemetryStatus.daysSinceLastReading)}</Field>
        </dl>
        <p>{telemetryStatus.reportingDays} / {telemetryStatus.periodDays} reporting days{telemetryStatus.coveragePercent !== null ? ` · ${telemetryStatus.coveragePercent}% coverage` : ''}</p>
        <p className="briefing-muted">Telemetry recency, not equipment condition.</p>
      </Section>}

      {oemTelemetry && <Section title="Latest available telemetry">
        {(!telemetryStatus || telemetryStatus.latestReading !== oemTelemetry.readingDate) && <p className="briefing-muted">Reading: {formatDate(oemTelemetry.readingDate)}</p>}
        {oemTelemetry.fields.length ? <table className="briefing-measurements">
          <thead><tr><th scope="col">Measurement</th><th scope="col">Value</th></tr></thead>
          <tbody>{oemTelemetry.fields.map(field => <tr key={field.key}>
            <th scope="row">{field.label}</th><td>{String(field.value)}{field.unit && field.unit !== 'raw OEM value' ? ` ${field.unit}` : ''}</td>
          </tr>)}</tbody>
        </table> : <p>No usable values in the latest reading.</p>}
        {rawSemantics && <p className="briefing-muted">Raw OEM {rawSemantics} semantics require validation.</p>}
      </Section>}

      {serviceContext && <Section title="Service context">
        <dl className="briefing-fields">
          <Field label="Commissioning date">{formatDate(serviceContext.commissioningDate)}</Field>
          <Field label="Last service visit">{formatDate(serviceContext.lastServiceVisit)}</Field>
        </dl>
      </Section>}

      {!!briefing.conflicts.length && <Section title="Data-quality conflicts">
        {briefing.conflicts.map(conflict => <div key={conflict.detail} className="briefing-conflict">
          <p><strong>{conflict.title}:</strong> {conflict.detail}</p>
          {!serviceContext && conflict.commissioningDate && <p className="briefing-muted">
            Commissioning: {formatDate(conflict.commissioningDate)} · Last service visit: {formatDate(conflict.lastServiceVisit ?? null)}
          </p>}
        </div>)}
      </Section>}

      {dataLimitations && <Section title="Data limitations">
        <div className="briefing-limitations">
          <Limitation label={`Not available in OEM ${unit.oem} extract`} items={dataLimitations.unsupported} />
          <Limitation label={`Intermittent in OEM ${unit.oem} extract`} items={dataLimitations.intermittent} />
          <Limitation label="Missing for this unit" items={dataLimitations.missingForUnit} />
          <Limitation label="Missing in latest reading" items={dataLimitations.missingLatest} />
          <Limitation label="Unavailable — suspected sentinel (−999)" items={dataLimitations.suspectedSentinel} />
        </div>
        <p className="briefing-muted">Field support: supplied extract only; OEM validation required. OEM energy values are not comparable across vendors.</p>
      </Section>}

      {briefing.plannerNote && <Section title="Planner note" className="briefing-note-section">
        <p className="briefing-planner-note">{briefing.plannerNote}</p>
      </Section>}
      <footer className="briefing-footer">{unit.unitId} · Technical Visit Briefing</footer>
    </article>
  </main>
}

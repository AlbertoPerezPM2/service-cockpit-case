import { useId } from 'react'
import type { ReactNode } from 'react'
import { Alert, Box, Button, Chip, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import Close from '@mui/icons-material/Close'
import type { CockpitData, FieldKey, UnitSelection } from '../types'
import { formatDate, queueLabels, readingAge } from '../data/formatters'
import { DataStateBadge, TierChip } from './Badges'
import { PersistentSignalTimeline } from './PersistentSignalTimeline'
import { UnitLatestValues } from './UnitLatestValues'
import { GenericUnitTrend } from './GenericUnitTrend'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Box component="section" sx={{ py: 2.5 }}>
    <Typography component="h3" variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>{title}</Typography>
    {children}
  </Box>
}
function Detail({ label, value }: { label: string; value: string }) {
  return <Box><Typography component="dt" variant="body2" color="text.secondary">{label}</Typography><Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.25, fontWeight: 500 }}>{value}</Typography></Box>
}
function LimitationGroup({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return <Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
    <Typography variant="body2" color="text.secondary">{items.join(' · ')}</Typography>
  </Box>
}

export function UnitDrawer({ selected, data, onClose, onPrepareBriefing, suppressed = false }: {
  selected: UnitSelection | null; data: CockpitData; onClose: () => void
  onPrepareBriefing: () => void; suppressed?: boolean
}) {
  const titleId = useId()
  const unit = selected?.unit
  const attention = selected?.attention
  const fields = unit ? data.oemFields[unit.oem] : null
  const definitions = fields ? Object.entries(fields) as [FieldKey, (typeof fields)[FieldKey]][] : []
  const unsupported = definitions.filter(([, field]) => field.availability === 'unsupported').map(([, field]) => field.label)
  const intermittent = definitions.filter(([, field]) => field.availability === 'intermittent').map(([, field]) => field.label)
  const missing = definitions.filter(([key]) => unit?.latestMeasurements[key].availability === 'missing_for_unit').map(([, field]) => field.label)
  const sentinel = definitions.filter(([key]) => unit?.latestMeasurements[key].suspectedSentinel).map(([, field]) => field.label)
  return (
    <Drawer anchor="right" open={!!selected && !suppressed} onClose={onClose} ModalProps={{ keepMounted: true }}
      slotProps={{ paper: {
        role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId,
        sx: { width: { xs: '100%', md: 540 }, maxWidth: '100%', border: 0, boxShadow: '-8px 0 40px #172c4320' },
      }, backdrop: { sx: { bgcolor: 'rgba(23,44,67,0.18)' } } }}>
      {unit && selected && <>
        <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Unit details</Typography>
              <Typography id={titleId} variant="h2" className="unit-id" sx={{ mt: 0.5 }}>{unit.unitId}</Typography>
              <Typography sx={{ mt: 0.5 }}>{unit.customerName}</Typography>
            </Box>
            <IconButton aria-label="Close unit details" onClick={onClose} autoFocus><Close /></IconButton>
          </Stack>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 1.75 }}>
            <Typography variant="body2" color="text.secondary">OEM {unit.oem}</Typography>
            <TierChip tier={unit.serviceTier} />
            <Typography variant="body2" color="text.secondary">Region {unit.region}</Typography>
          </Stack>
        </Box>
        <Box sx={{ px: 3, pb: 3, flex: '1 0 auto' }}>
          <Section title="Attention">
            {!attention && <Typography variant="body2" color="text.secondary">No active attention signals</Typography>}
            {attention && attention.queue !== 'technician_review' && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{queueLabels[attention.queue]}</Typography>}
            {attention?.signals.map(signal => <Box key={signal.type} sx={{ mb: 1 }}>
              <Typography variant="h3">{signal.label}</Typography>
              {signal.type === 'persistent_oem_signal' ? <>
                <Box sx={{ bgcolor: '#f3f6fa', border: '1px solid #e3e9f1', borderRadius: 1, p: 1.5, my: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Raw signal</Typography>
                  <Typography className="raw-signal" variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{signal.rawSignal}</Typography>
                </Box>
                <Typography variant="body2">Observed on {signal.persistenceDays} reporting days</Typography>
                <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, my: 1.5 }}>
                  <Detail label="First seen" value={formatDate(signal.firstObserved)} />
                  <Detail label="Last seen" value={formatDate(signal.lastObserved)} />
                </Box>
                <Typography variant="body2" color="text.secondary">Meaning not validated</Typography>
              </> : <>
                <Typography variant="body2" sx={{ mt: 1 }}>Last reading {signal.daysStale} days before the snapshot.</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Reporting stopped after {formatDate(signal.lastReading)}.</Typography>
              </>}
            </Box>)}
            {attention?.queue === 'technician_review' && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Dispatch remains a planner decision.</Typography>}
            {attention?.queue === 'data_connectivity_review' && <Alert severity="info" sx={{ mt: 2 }}>Investigate telemetry or integration issues before considering field service.</Alert>}
          </Section>
          <Divider />
          <Section title="Data state">
            <DataStateBadge state={unit.dataState} />
            <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, my: 1.5 }}>
              <Detail label="Latest reading" value={formatDate(unit.latestReading)} />
              <Detail label="Reading age" value={readingAge(unit.daysSinceLastReading)} />
            </Box>
            <Typography variant="body2">{unit.reportingDays} / {data.meta.periodDays} reporting days{unit.coveragePercent !== null ? ` · ${unit.coveragePercent}% coverage` : ''}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Data state reflects telemetry recency, not equipment condition.</Typography>
            {unit.dataState === 'stale' && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Latest reading is outside the {data.meta.freshnessWindowDays}-day freshness window.</Typography>}
            {unit.dataQualityFlags.includes('source_conflict') && <Chip size="small" variant="outlined" label="Conflicting source data" sx={{ mt: 1.5 }} />}
          </Section>
          <Divider />
          <Section title="Service context">
            <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, m: 0 }}>
              <Detail label="Commissioning date" value={formatDate(unit.commissioningDate)} />
              <Detail label="Last service visit" value={formatDate(unit.lastServiceVisit)} />
            </Box>
            {unit.dataQualityFlags.includes('service_date_conflict') && <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f5f7fa', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Source data conflict</Typography>
              <Typography variant="body2" color="text.secondary">Last service visit predates commissioning date.</Typography>
            </Box>}
          </Section>
          <Divider />
          {attention?.queue === 'technician_review' && attention.signals.some(signal => signal.type === 'persistent_oem_signal') && <>
            <Section title="Recent evidence">
              <Stack spacing={2}>
                {attention.signals.filter(signal => signal.type === 'persistent_oem_signal').map(signal => <PersistentSignalTimeline
                  key={signal.rawSignal} rawSignal={signal.rawSignal} readings={unit.recentReadings} snapshotDate={data.meta.snapshotDate} />)}
              </Stack>
            </Section>
            <Divider />
          </>}
          {!attention && fields && <>
            <Section title="Latest values"><UnitLatestValues unit={unit} fields={fields} /></Section>
            <Divider />
            <Section title="Recent trend"><GenericUnitTrend unit={unit} data={data} /></Section>
            <Divider />
          </>}
          <Section title="Data limitations">
            <Stack spacing={1.25}>
              <LimitationGroup label={`Not available in OEM ${unit.oem} extract`} items={unsupported} />
              <LimitationGroup label={`Intermittent in OEM ${unit.oem} extract`} items={intermittent} />
              <LimitationGroup label="Missing for this unit" items={missing} />
              <LimitationGroup label="Unavailable — suspected sentinel (−999)" items={sentinel} />
              <Typography variant="body2" color="text.secondary">OEM energy values are not comparable across vendors.</Typography>
              <Typography variant="caption" color="text.secondary">Field support is based on the supplied extract and requires OEM validation.</Typography>
            </Stack>
          </Section>
        </Box>
        {attention?.queue === 'technician_review' && <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', p: 2.5, flexShrink: 0 }}>
          <Button variant="contained" fullWidth onClick={onPrepareBriefing}>Prepare Technical Visit Briefing</Button>
        </Box>}
      </>}
    </Drawer>
  )
}

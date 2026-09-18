import { Chip, Tooltip } from '@mui/material'
import type { DataState, Tier } from '../types'
import { tierLabels } from '../data/formatters'

const tierColors: Record<Tier, { background: string; text: string }> = {
  care_plus: { background: '#eee9f7', text: '#624889' },
  care: { background: '#e5edf8', text: '#355e92' },
  optimize: { background: '#e2efef', text: '#326b6c' },
  free: { background: '#edf0f3', text: '#596574' },
}
export function TierChip({ tier }: { tier: Tier }) {
  const colors = tierColors[tier]
  return <Chip size="small" label={tierLabels[tier]} sx={{ bgcolor: colors.background, color: colors.text, height: 25 }} />
}

const stateLabels: Record<DataState, string> = { current: 'Current', stale: 'Stale', no_telemetry: 'No telemetry' }
const stateDescriptions: Record<DataState, string> = {
  current: 'Within the snapshot freshness window. Describes telemetry recency, not equipment condition.',
  stale: 'Previously reported telemetry is outside the snapshot freshness window.',
  no_telemetry: 'No telemetry in the supplied period.',
}
export function DataStateBadge({ state, daysStale }: { state: DataState; daysStale?: number | null }) {
  const label = state === 'stale' && typeof daysStale === 'number'
    ? `${stateLabels[state]} · ${daysStale}d`
    : stateLabels[state]
  return (
    <Tooltip title={stateDescriptions[state]}>
      <Chip size="small" variant="outlined" label={label}
        sx={{ height: 25, bgcolor: state === 'stale' ? '#f9f2e7' : '#f4f6f8',
          borderColor: state === 'stale' ? '#e4d3b5' : '#d9e0e8', color: state === 'stale' ? '#795b29' : '#516477' }} />
    </Tooltip>
  )
}

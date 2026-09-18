import { useId } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Reading } from '../types'
import { signalTimeline } from '../data/evidence'
import { formatDate, formatShortDate } from '../data/formatters'

const labels = {
  signal_recorded: 'Signal recorded',
  other_reporting_day: 'Other reporting day',
  no_reading: 'No reading',
}
const colors = { signal_recorded: '#355e92', other_reporting_day: '#dce4ed', no_reading: '#ffffff' }

export function PersistentSignalTimeline({ readings, rawSignal, snapshotDate }: {
  readings: Reading[]; rawSignal: string; snapshotDate: string
}) {
  const id = useId()
  const days = signalTimeline(readings, rawSignal, snapshotDate)
  const occurrences = days.filter(day => day.state === 'signal_recorded')
  const missing = days.filter(day => day.state === 'no_reading')
  const first = occurrences[0]
  const last = occurrences.at(-1)
  const firstIndex = first ? days.findIndex(day => day.date === first.date) : -1
  const lastIndex = last ? days.findIndex(day => day.date === last.date) : -1
  const plotX = 4
  const step = 15.2
  const cellWidth = 12.2
  const center = (index: number) => plotX + index * step + cellWidth / 2
  const ticks = [...new Set([0, 7, firstIndex >= 0 ? firstIndex : 15, 22, 29])].sort((a, b) => a - b)
  const range = first && last ? `${formatShortDate(first.date)}–${formatShortDate(last.date)}` : ''

  return <Box component="figure" sx={{ m: 0 }}>
    <Typography component="figcaption" variant="body2" className="raw-signal" sx={{ fontWeight: 600 }}>{rawSignal}</Typography>
    <Typography variant="caption" color="text.secondary">
      {formatShortDate(days[0].date)}–{formatDate(snapshotDate)} · Signal occurrence by reporting day
    </Typography>
    <Box component="svg" viewBox="0 0 464 114" role="img" aria-labelledby={`${id}-title ${id}-description`}
      sx={{ width: '100%', height: 'auto', display: 'block', mt: 1 }}>
      <title id={`${id}-title`}>{`${rawSignal}: ${occurrences.length} reporting days${range ? `, ${range}` : ''}`}</title>
      <desc id={`${id}-description`}>
        Each cell represents one calendar day. Filled blue cells show the raw signal recorded in telemetry.
        Gray cells show a reading without this signal recorded. Hatched cells show no reading.
        {missing.length ? ` Missing readings: ${missing.map(day => formatShortDate(day.date)).join(', ')}.` : ' All days have readings.'}
      </desc>
      <defs>
        <pattern id={`${id}-missing`} width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#fff" />
          <path d="M-1 1L1-1M0 5L5 0M4 6L6 4" stroke="#bac6d4" strokeWidth="1" />
        </pattern>
      </defs>
      {first && last && <g fill="#355e92" stroke="#355e92">
        <text x={(center(firstIndex) + center(lastIndex)) / 2} y="16" textAnchor="middle" stroke="none" fontSize="13" fontWeight="600">{range}</text>
        <path d={`M${center(firstIndex)} 33V26H${center(lastIndex)}V33`} fill="none" strokeWidth="1" />
      </g>}
      {days.map((day, index) => <g key={day.date}>
        <title>{`${formatDate(day.date)}: ${labels[day.state]}`}</title>
        <rect x={plotX + index * step} y="43" width={cellWidth} height="29" rx="2"
          fill={day.state === 'no_reading' ? `url(#${id}-missing)` : colors[day.state]}
          stroke={day.state === 'no_reading' ? '#bac6d4' : 'none'} />
      </g>)}
      {ticks.map(index => <text key={index} x={index === 0 ? plotX : index === 29 ? 460 : center(index)} y="96"
        textAnchor={index === 0 ? 'start' : index === 29 ? 'end' : 'middle'} fill="#5f6b7a" fontSize="12">
        {formatShortDate(days[index].date)}
      </text>)}
    </Box>
    <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap' }}>
      {(Object.keys(labels) as Array<keyof typeof labels>).map(state => <Stack key={state} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Box aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: colors[state],
          border: state === 'no_reading' ? '1px solid #bac6d4' : 'none',
          backgroundImage: state === 'no_reading' ? 'repeating-linear-gradient(135deg, transparent, transparent 2px, #bac6d4 2px, #bac6d4 3px)' : 'none' }} />
        <Typography variant="caption" color="text.secondary">{labels[state]}</Typography>
      </Stack>)}
    </Stack>
  </Box>
}

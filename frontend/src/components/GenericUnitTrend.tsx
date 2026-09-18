import { useId } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { CockpitData, Unit } from '../types'
import { recentUnitTrend } from '../data/unitTelemetry'
import { formatDate, formatShortDate } from '../data/formatters'

const colors = ['#426c94', '#7a728f']

export function GenericUnitTrend({ unit, data }: { unit: Unit; data: CockpitData }) {
  const id = useId()
  const trend = recentUnitTrend(unit, data.meta.snapshotDate)
  const fields = data.oemFields[unit.oem]
  const first = trend.days[0].date
  const last = trend.days.at(-1)!.date
  const reportingDays = trend.days.filter(day => day.reporting).length
  if (trend.kind === 'availability') return <Box component="figure" sx={{ m: 0 }}>
    <Typography component="figcaption" variant="body2" sx={{ fontWeight: 600 }}>Telemetry availability</Typography>
    <Typography variant="caption" color="text.secondary">{formatShortDate(first)}–{formatDate(last)} · {reportingDays} / {trend.days.length} reporting days</Typography>
    <Box component="svg" viewBox="0 0 460 70" role="img" aria-labelledby={`${id}-title ${id}-desc`} sx={{ display: 'block', width: '100%', mt: 1 }}>
      <title id={`${id}-title`}>{`Telemetry availability: ${reportingDays} of ${trend.days.length} reporting days`}</title>
      <desc id={`${id}-desc`}>{trend.days.map(day => `${formatDate(day.date)}: ${day.reporting ? 'Reading received' : 'No reading'}`).join('; ')}</desc>
      {trend.days.map((day, index) => <rect key={day.date} x={index * 33} y={4} width={29} height={26} rx={3}
        fill={day.reporting ? '#7b91a6' : '#f2f4f7'} stroke={day.reporting ? '#7b91a6' : '#d6dfe8'}>
        <title>{`${formatDate(day.date)}: ${day.reporting ? 'Reading received' : 'No reading'}`}</title>
      </rect>)}
      <text x={0} y={52} fontSize={12} fill="#5f6b7a">{formatShortDate(first)}</text>
      <text x={458} y={52} textAnchor="end" fontSize={12} fill="#5f6b7a">{formatShortDate(last)}</text>
    </Box>
    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
      <Legend color="#7b91a6" label="Reading received" /><Legend color="#f2f4f7" label="No reading" />
    </Stack>
    <Typography variant="caption" color="text.secondary">Insufficient recent measurements for an OEM-specific trend.</Typography>
  </Box>

  const values = trend.series.flatMap(series => series.values.filter((value): value is number => value !== null))
  const low = Math.min(...values)
  const high = Math.max(...values)
  const padding = Math.max((high - low) * 0.1, 1)
  const min = low - padding
  const max = high + padding
  const x = (index: number) => 48 + index * (400 / 13)
  const y = (value: number) => 150 - ((value - min) / (max - min)) * 130
  const caption = trend.series.map(series => fields[series.key].label).join(' + ')
  const units = fields[trend.series[0].key].unit
  return <Box component="figure" sx={{ m: 0 }}>
    <Typography component="figcaption" variant="body2" sx={{ fontWeight: 600 }}>{caption}</Typography>
    <Typography variant="caption" color="text.secondary">{formatShortDate(first)}–{formatDate(last)}{units ? ` · ${units}` : ''}</Typography>
    <Box component="svg" viewBox="0 0 460 185" role="img" aria-labelledby={`${id}-title ${id}-desc`} sx={{ display: 'block', width: '100%', mt: 1 }}>
      <title id={`${id}-title`}>{`${unit.unitId}: ${caption}, ${formatShortDate(first)}–${formatDate(last)}`}</title>
      <desc id={`${id}-desc`}>{trend.series.map(series => `${fields[series.key].label}: ${series.values.map((value, index) => `${formatShortDate(trend.days[index].date)} ${value === null ? 'unavailable' : `${value} ${units}`}`).join('; ')}`).join('. ')}</desc>
      {[min, (min + max) / 2, max].map(tick => <g key={tick}>
        <line x1={48} x2={448} y1={y(tick)} y2={y(tick)} stroke="#e7ebf0" />
        <text x={40} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="#5f6b7a">{Number(tick.toFixed(1))}</text>
      </g>)}
      {trend.series.map((series, seriesIndex) => <g key={series.key}>
        {series.values.map((value, index) => {
          if (value === null) return null
          const previous = index > 0 ? series.values[index - 1] : null
          return <g key={trend.days[index].date}>
            {previous !== null && <line x1={x(index - 1)} y1={y(previous)} x2={x(index)} y2={y(value)} stroke={colors[seriesIndex]} strokeWidth={1.75} />}
            <circle cx={x(index)} cy={y(value)} r={2.8} fill={colors[seriesIndex]}>
              <title>{`${formatDate(trend.days[index].date)} · ${fields[series.key].label}: ${value} ${units}`}</title>
            </circle>
          </g>
        })}
      </g>)}
      {[0, 6, 13].map(index => <text key={index} x={x(index)} y={175} textAnchor={index === 0 ? 'start' : index === 13 ? 'end' : 'middle'} fontSize={12} fill="#5f6b7a">{formatShortDate(trend.days[index].date)}</text>)}
    </Box>
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
      {trend.series.map((series, index) => <Legend key={series.key} color={colors[index]} label={fields[series.key].label} />)}
    </Stack>
    <Typography variant="caption" color="text.secondary">Reported values only. Gaps remain unconnected; -999 values are omitted from charts pending source validation.</Typography>
  </Box>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
    <Box aria-hidden="true" sx={{ width: 9, height: 9, bgcolor: color, border: '1px solid #bac6d2', borderRadius: '2px' }} />
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Stack>
}

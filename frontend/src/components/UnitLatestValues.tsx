import { Box, Typography } from '@mui/material'
import type { CockpitData, Measurement, Unit } from '../types'
import { basicFields } from '../data/unitTelemetry'
import { formatDate } from '../data/formatters'

function displayedValue(measurement: Measurement, unit: string): string {
  if (measurement.suspectedSentinel || measurement.availability === 'suspected_sentinel') return 'Unavailable · suspected sentinel (−999)'
  if (measurement.availability === 'unsupported') return 'Not available in supplied OEM extract'
  if (measurement.availability === 'missing_for_unit') return 'Missing for this unit'
  if (measurement.availability !== 'available' || measurement.value === null) return 'Unavailable in latest reading'
  return `${measurement.value}${unit ? ` ${unit}` : ''}`
}

export function UnitLatestValues({ unit, fields }: { unit: Unit; fields: CockpitData['oemFields'][Unit['oem']] }) {
  if (!unit.latestReading) return <Typography variant="body2" color="text.secondary">No readings in the supplied period.</Typography>
  return <>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Reading from {formatDate(unit.latestReading)}</Typography>
    <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75, m: 0 }}>
      {basicFields[unit.oem].map(key => <Box key={key}>
        <Typography component="dt" variant="body2" color="text.secondary">
          {fields[key].label}
        </Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.25, fontWeight: 500 }}>
          {displayedValue(unit.latestMeasurements[key], fields[key].unit)}
        </Typography>
      </Box>)}
    </Box>
  </>
}

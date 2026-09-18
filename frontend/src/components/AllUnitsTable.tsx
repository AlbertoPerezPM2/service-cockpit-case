import { Button, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { Unit } from '../types'
import { formatDate } from '../data/formatters'
import { DataStateBadge, TierChip } from './Badges'

export function AllUnitsTable({ units, onSelect, onClear, selectedId }: {
  units: Unit[]; onSelect: (unitId: string) => void; onClear: () => void; selectedId?: string
}) {
  return <TableContainer sx={{ overflowX: 'auto' }}>
    <Table aria-label="All resolved units" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '14%' }} /><col style={{ width: '23%' }} /><col style={{ width: '9%' }} />
        <col style={{ width: '16%' }} /><col style={{ width: '17%' }} /><col style={{ width: '12%' }} /><col style={{ width: '9%' }} />
      </colgroup>
      <TableHead><TableRow>
        <TableCell sortDirection="asc">Unit</TableCell><TableCell>Customer</TableCell><TableCell>OEM</TableCell>
        <TableCell>Data state</TableCell><TableCell>Latest data</TableCell><TableCell>Tier</TableCell><TableCell>Region</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {units.map(unit => <TableRow key={unit.unitId} hover selected={selectedId === unit.unitId} onClick={() => onSelect(unit.unitId)}
          sx={{ cursor: 'pointer', '& td': { py: 1.5 }, '&:last-child td': { borderBottom: 0 }, '&:focus-within': { bgcolor: '#f0f5fb' } }}>
          <TableCell><Link component="button" className="unit-id" underline="hover" aria-label={`Inspect ${unit.unitId}`}
            onClick={event => { event.stopPropagation(); onSelect(unit.unitId) }}
            sx={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{unit.unitId}</Link></TableCell>
          <TableCell>{unit.customerName}</TableCell>
          <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>OEM {unit.oem}</TableCell>
          <TableCell><DataStateBadge state={unit.dataState} daysStale={unit.daysSinceLastReading} /></TableCell>
          <TableCell>
            <Typography variant="body2" color={unit.latestReading ? 'text.primary' : 'text.secondary'}>
              {unit.latestReading ? formatDate(unit.latestReading) : 'No readings'}
            </Typography>
          </TableCell>
          <TableCell><TierChip tier={unit.serviceTier} /></TableCell><TableCell>{unit.region}</TableCell>
        </TableRow>)}
        {units.length === 0 && <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 7 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>No units match the current filters.</Typography>
          <Button size="small" onClick={onClear}>Clear filters</Button>
        </TableCell></TableRow>}
      </TableBody>
    </Table>
  </TableContainer>
}

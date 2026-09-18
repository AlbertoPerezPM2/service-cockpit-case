import { Box, Button, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from '@mui/material'
import ManageSearchOutlined from '@mui/icons-material/ManageSearchOutlined'
import type { AttentionRow } from '../types'
import type { Sort, SortKey } from '../data/selectors'
import { formatDate, formatShortDate } from '../data/formatters'
import { DataStateBadge, TierChip } from './Badges'

export function AttentionTable({ rows, sort, onSort, onSelect, onClear, selectedId }: {
  rows: AttentionRow[]; sort: Sort; onSort: (key: SortKey) => void
  onSelect: (row: AttentionRow) => void; onClear: () => void; selectedId?: string
}) {
  const sortable = (key: SortKey, label: string) => (
    <TableCell sortDirection={sort.key === key ? sort.direction : false}>
      <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.direction : 'asc'} onClick={() => onSort(key)}>{label}</TableSortLabel>
    </TableCell>
  )
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table aria-label="Units requiring review" sx={{ minWidth: 1020, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '12%' }} /><col style={{ width: '16%' }} /><col style={{ width: '8%' }} />
          <col style={{ width: '29%' }} /><col style={{ width: '17%' }} /><col style={{ width: '10%' }} /><col style={{ width: '8%' }} />
        </colgroup>
        <TableHead><TableRow>
          <TableCell>Unit ID</TableCell><TableCell>Customer</TableCell>{sortable('oem', 'OEM')}
          <TableCell>Reason + evidence</TableCell>{sortable('latest', 'Latest data')}{sortable('tier', 'Tier')}{sortable('region', 'Region')}
        </TableRow></TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.unit.unitId} hover selected={selectedId === row.unit.unitId} onClick={() => onSelect(row)}
              sx={{ cursor: 'pointer', '& td': { py: 1.8 }, '&:last-child td': { borderBottom: 0 }, '&:focus-within': { bgcolor: '#f0f5fb' } }}>
              <TableCell>
                <Link component="button" className="unit-id" underline="hover" aria-label={`Inspect ${row.unit.unitId}`}
                  onClick={event => { event.stopPropagation(); onSelect(row) }}
                  sx={{ fontSize: '0.875rem', fontWeight: 650, textAlign: 'left', whiteSpace: 'nowrap' }}>{row.unit.unitId}</Link>
              </TableCell>
              <TableCell>{row.unit.customerName}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>OEM {row.unit.oem}</TableCell>
              <TableCell>
                <Stack spacing={1}>
                  {row.attention.signals.map(signal => <Box key={signal.type}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{signal.label}</Typography>
                    {signal.type === 'persistent_oem_signal' ? <>
                      <Typography component="div" variant="body2" className="raw-signal" sx={{ mt: 0.25 }}>{signal.rawSignal}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Observed on {signal.persistenceDays} reporting days</Typography>
                    </> : <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Last reading {signal.daysStale} days ago</Typography>}
                  </Box>)}
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                  <DataStateBadge state={row.unit.dataState} daysStale={row.unit.daysSinceLastReading} />
                  <Typography variant="body2" color="text.secondary" title={formatDate(row.unit.latestReading)} sx={{ whiteSpace: 'nowrap' }}>Latest {formatShortDate(row.unit.latestReading)}</Typography>
                </Stack>
              </TableCell>
              <TableCell><TierChip tier={row.unit.serviceTier} /></TableCell>
              <TableCell>{row.unit.region}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 7 }}>
            <ManageSearchOutlined sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>No units match the current filters.</Typography>
            <Button size="small" onClick={onClear}>Clear filters</Button>
          </TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

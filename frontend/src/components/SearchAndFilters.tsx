import { Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import Close from '@mui/icons-material/Close'
import type { AttentionRow } from '../types'
import { tierLabels } from '../data/formatters'
import { emptyFilters, tierOrder } from '../data/selectors'
import type { Filters } from '../data/selectors'

export function SearchAndFilters({ filters, onChange, rows }: {
  filters: Filters; onChange: (filters: Filters) => void; rows: AttentionRow[]
}) {
  const options = [
    { key: 'oem' as const, label: 'OEM', items: [...new Set(rows.map(row => row.unit.oem))].sort().map(value => ({ value, label: `OEM ${value}` })) },
    { key: 'region' as const, label: 'Region', items: [...new Set(rows.map(row => row.unit.region))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(value => ({ value, label: value })) },
    { key: 'tier' as const, label: 'Tier', items: tierOrder.map(value => ({ value, label: tierLabels[value] })) },
    { key: 'reason' as const, label: 'Reason', items: [...new Map(rows.flatMap(row => row.attention.signals.map(signal => [signal.type, signal.label] as const))).entries()].map(([value, label]) => ({ value, label })) },
  ]
  return (
    <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center', p: 2.5 }}>
      <TextField size="small" placeholder="Search unit or customer" value={filters.search}
        onChange={event => onChange({ ...filters, search: event.target.value })}
        sx={{ flex: '1 1 250px', maxWidth: { xs: 'none', lg: 360 } }}
        slotProps={{ htmlInput: { 'aria-label': 'Search unit or customer' }, input: {
          startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
          endAdornment: filters.search ? <InputAdornment position="end"><IconButton aria-label="Clear search" size="small" onClick={() => onChange({ ...filters, search: '' })}><Close sx={{ fontSize: 17 }} /></IconButton></InputAdornment> : undefined,
        } }} />
      {options.map(({ key, label, items }) => (
        <FormControl size="small" key={key} sx={{ flex: key === 'reason' ? '1 1 190px' : '1 1 110px', maxWidth: { xs: 'none', lg: key === 'reason' ? 235 : 155 } }}>
          <InputLabel id={`${key}-filter-label`} shrink>{label}</InputLabel>
          <Select labelId={`${key}-filter-label`} id={`${key}-filter`} label={label} displayEmpty value={filters[key]}
            onChange={event => onChange({ ...filters, [key]: event.target.value })}>
            <MenuItem value="">All {key === 'oem' ? 'OEMs' : `${label.toLowerCase()}s`}</MenuItem>
            {items.map(item => <MenuItem value={item.value} key={item.value}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
      ))}
      {Object.values(filters).some(Boolean) && <Button size="small" onClick={() => onChange({ ...emptyFilters })}>Clear filters</Button>}
    </Stack>
  )
}

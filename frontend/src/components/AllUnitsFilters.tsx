import { Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import Close from '@mui/icons-material/Close'
import type { Unit } from '../types'
import { tierLabels } from '../data/formatters'
import { emptyUnitFilters } from '../data/allUnits'
import type { UnitFilters } from '../data/allUnits'

export function AllUnitsFilters({ filters, onChange, units }: {
  filters: UnitFilters; onChange: (filters: UnitFilters) => void; units: Unit[]
}) {
  const options = [
    { key: 'oem' as const, label: 'OEM', all: 'All OEMs', items: [...new Set(units.map(unit => unit.oem))].sort().map(value => ({ value, label: `OEM ${value}` })) },
    { key: 'dataState' as const, label: 'Data state', all: 'All data states', items: [
      { value: 'current', label: 'Current' }, { value: 'stale', label: 'Stale' }, { value: 'no_telemetry', label: 'No telemetry' },
    ] },
    { key: 'region' as const, label: 'Region', all: 'All regions', items: [...new Set(units.map(unit => unit.region))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(value => ({ value, label: value })) },
    { key: 'tier' as const, label: 'Service tier', all: 'All tiers', items: Object.entries(tierLabels).map(([value, label]) => ({ value, label })) },
  ]
  return <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', p: 2.5 }}>
    <TextField size="small" placeholder="Search unit or customer" value={filters.search}
      onChange={event => onChange({ ...filters, search: event.target.value })}
      sx={{ flex: '1 1 240px', maxWidth: { xs: 'none', lg: 360 } }}
      slotProps={{ htmlInput: { 'aria-label': 'Search unit or customer' }, input: {
        startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
        endAdornment: filters.search ? <InputAdornment position="end"><IconButton aria-label="Clear search" size="small" onClick={() => onChange({ ...filters, search: '' })}><Close sx={{ fontSize: 17 }} /></IconButton></InputAdornment> : undefined,
      } }} />
    {options.map(({ key, label, all, items }) => <FormControl size="small" key={key} sx={{ flex: '1 1 130px', maxWidth: { xs: 'none', lg: 170 } }}>
      <InputLabel id={`all-units-${key}-label`} shrink>{label}</InputLabel>
      <Select labelId={`all-units-${key}-label`} id={`all-units-${key}`} label={label} displayEmpty value={filters[key]}
        onChange={event => onChange({ ...filters, [key]: event.target.value })}>
        <MenuItem value="">{all}</MenuItem>
        {items.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
      </Select>
    </FormControl>)}
    {Object.values(filters).some(Boolean) && <Button size="small" onClick={() => onChange({ ...emptyUnitFilters })}>Clear filters</Button>}
  </Stack>
}

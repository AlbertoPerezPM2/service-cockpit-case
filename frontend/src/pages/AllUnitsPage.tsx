import { useMemo, useState } from 'react'
import { Box, Paper, Stack, TablePagination, Typography } from '@mui/material'
import type { CockpitData } from '../types'
import { emptyUnitFilters, selectUnit, selectUnits } from '../data/allUnits'
import type { UnitFilters } from '../data/allUnits'
import { formatDate } from '../data/formatters'
import { AllUnitsFilters } from '../components/AllUnitsFilters'
import { AllUnitsTable } from '../components/AllUnitsTable'
import { UnitDrawer } from '../components/UnitDrawer'
import { BriefingConfirmation } from '../briefing/BriefingConfirmation'
import { buildBriefing, createBriefingDraft } from '../briefing/briefing'
import type { Briefing, BriefingDraft } from '../briefing/briefing'

export function AllUnitsPage({ data, active, briefingVisible, onGenerateBriefing }: {
  data: CockpitData; active: boolean; briefingVisible: boolean; onGenerateBriefing: (briefing: Briefing) => void
}) {
  const [filters, setFilters] = useState<UnitFilters>({ ...emptyUnitFilters })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, BriefingDraft>>({})
  const units = useMemo(() => selectUnits(data.units, filters), [data.units, filters])
  const selected = selectedId ? selectUnit(data, selectedId) : null
  const suppressed = !active || briefingVisible
  function changeFilters(next: UnitFilters) { setFilters(next); setPage(0) }
  function prepareBriefing() {
    if (selected?.attention?.queue !== 'technician_review') return
    const unitId = selected.unit.unitId
    setDrafts(previous => ({ ...previous, [unitId]: previous[unitId] ?? createBriefingDraft() }))
    setConfirming(true)
  }
  function generateBriefing() {
    if (!selected || !drafts[selected.unit.unitId]) return
    const document = buildBriefing(data, selected.unit.unitId, drafts[selected.unit.unitId])
    setConfirming(false)
    onGenerateBriefing(document)
  }
  return <>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3.5 }}>
      <Box>
        <Typography variant="h1">All Units</Typography>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">{data.units.length} resolved units monitored</Typography>
          <Box aria-hidden="true" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#9aa6b5' }} />
          <Typography variant="body2" color="text.secondary">{data.units.filter(unit => unit.hasTelemetry).length} with telemetry</Typography>
        </Stack>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' }, pb: 0.25 }}>Telemetry snapshot: {formatDate(data.meta.snapshotDate)}</Typography>
    </Stack>
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <AllUnitsFilters filters={filters} onChange={changeFilters} units={data.units} />
      <AllUnitsTable units={units.slice(page * rowsPerPage, (page + 1) * rowsPerPage)} onSelect={setSelectedId}
        selectedId={selectedId ?? undefined} onClear={() => changeFilters({ ...emptyUnitFilters })} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid', borderColor: 'divider', px: 2.5 }}>
        <Typography variant="caption" color="text.secondary" aria-live="polite">{units.length} of {data.units.length} units · Ordered by Unit ID</Typography>
        <TablePagination component="div" count={units.length} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Units per page" onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={event => { setRowsPerPage(Number(event.target.value)); setPage(0) }} />
      </Box>
    </Paper>
    <UnitDrawer selected={selected} data={data} onClose={() => setSelectedId(null)} onPrepareBriefing={prepareBriefing} suppressed={suppressed} />
    {selected?.attention && drafts[selected.unit.unitId] && <BriefingConfirmation
      open={confirming && !suppressed} row={{ unit: selected.unit, attention: selected.attention }} draft={drafts[selected.unit.unitId]}
      documentVisible={briefingVisible} onCancel={() => setConfirming(false)} onGenerate={generateBriefing}
      onChange={draft => setDrafts(previous => ({ ...previous, [selected.unit.unitId]: draft }))} />}
  </>
}

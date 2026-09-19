import { useMemo, useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import type { AttentionRow, CockpitData, Queue } from '../types'
import { emptyFilters, getAttentionRows, selectRows } from '../data/selectors'
import type { Filters, Sort, SortKey } from '../data/selectors'
import { formatDate, queueLabels } from '../data/formatters'
import { SearchAndFilters } from '../components/SearchAndFilters'
import { AttentionTable } from '../components/AttentionTable'
import { UnitDrawer } from '../components/UnitDrawer'
import { BriefingConfirmation } from '../briefing/BriefingConfirmation'
import { buildBriefing, createBriefingDraft } from '../briefing/briefing'
import type { Briefing, BriefingDraft } from '../briefing/briefing'

const queues: Queue[] = ['technician_review', 'data_connectivity_review']

export function NeedsAttentionPage({ data, active, briefingVisible, onGenerateBriefing }: {
  data: CockpitData; active: boolean; briefingVisible: boolean; onGenerateBriefing: (briefing: Briefing) => void
}) {
  const [queue, setQueue] = useState<Queue>('technician_review')
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters })
  const [sort, setSort] = useState<Sort>({ key: 'default', direction: 'asc' })
  const [selected, setSelected] = useState<AttentionRow | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, BriefingDraft>>({})
  const allRows = useMemo(() => getAttentionRows(data), [data])
  const rows = useMemo(() => selectRows(allRows, queue, filters, sort), [allRows, queue, filters, sort])
  const queueCounts = Object.fromEntries(queues.map(value => [value, allRows.filter(row => row.attention.queue === value).length])) as Record<Queue, number>
  function changeSort(key: SortKey) {
    setSort(previous => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' }))
  }
  function prepareBriefing() {
    if (!selected || selected.attention.queue !== 'technician_review') return
    const unitId = selected.unit.unitId
    setDrafts(previous => ({ ...previous, [unitId]: previous[unitId] ?? createBriefingDraft() }))
    setConfirming(true)
  }
  function generateBriefing() {
    if (!selected || !drafts[selected.unit.unitId]) return
    const briefing = buildBriefing(data, selected.unit.unitId, drafts[selected.unit.unitId])
    setConfirming(false)
    onGenerateBriefing(briefing)
  }

  return <>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3.5 }}>
      <Box>
        <Typography variant="h1">Needs Attention</Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{data.attentionItems.length} units require review</Typography>
          <Box aria-hidden="true" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#9aa6b5' }} />
          <Typography variant="body2" color="text.secondary">{data.units.length} units monitored</Typography>
        </Stack>
      </Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', alignSelf: { xs: 'flex-start', md: 'flex-end' }, pb: 0.25 }}>
        <ScheduleOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">Last telemetry snapshot: <Box component="span" sx={{ color: 'text.primary' }}>{formatDate(data.meta.snapshotDate)}</Box></Typography>
      </Stack>
    </Stack>
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Tabs value={queue} onChange={(_, value: Queue) => setQueue(value)} aria-label="Review queues" variant="scrollable" scrollButtons="auto"
        sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        {queues.map(value => <Tab key={value} value={value} id={`tab-${value}`} aria-controls={`panel-${value}`}
          label={<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><span>{queueLabels[value]}</span><Chip size="small" label={queueCounts[value]} sx={{ height: 21, bgcolor: queue === value ? '#e6edf6' : '#edf0f3', color: queue === value ? 'primary.main' : 'text.secondary' }} /></Stack>} />)}
      </Tabs>
      <SearchAndFilters filters={filters} onChange={setFilters} rows={allRows} />
      <Box role="tabpanel" id={`panel-${queue}`} aria-labelledby={`tab-${queue}`}>
        <AttentionTable rows={rows} sort={sort} onSort={changeSort} onSelect={setSelected} selectedId={selected?.unit.unitId} onClear={() => setFilters({ ...emptyFilters })} />
      </Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 49, px: 2.5, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fcfdfe' }}>
        <Typography variant="caption" color="text.secondary" aria-live="polite">Showing {rows.length} of {queueCounts[queue]} units in this queue</Typography>
        {sort.key === 'default' ? <Typography variant="caption" color="text.secondary">Ordered by observed evidence; service tier is shown for context and does not affect default priority.</Typography> : <Button size="small" onClick={() => setSort({ key: 'default', direction: 'asc' })}>Reset sorting</Button>}
      </Stack>
    </Paper>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
      {queue === 'technician_review'
        ? 'Repeated equipment signals that merit technical review. Dispatch remains a planner decision. Raw OEM signal meanings have not been validated.'
        : 'Investigate telemetry or integration issues before considering field service. A stopped data stream does not establish an equipment issue.'}
    </Typography>
    <UnitDrawer selected={selected} data={data} onClose={() => setSelected(null)} onPrepareBriefing={prepareBriefing} suppressed={briefingVisible || !active} />
    {selected && drafts[selected.unit.unitId] && <BriefingConfirmation
      open={confirming && !briefingVisible && active} row={selected} draft={drafts[selected.unit.unitId]}
      documentVisible={briefingVisible} onCancel={() => setConfirming(false)} onGenerate={generateBriefing}
      onChange={draft => setDrafts(previous => ({ ...previous, [selected.unit.unitId]: draft }))} />}
  </>
}

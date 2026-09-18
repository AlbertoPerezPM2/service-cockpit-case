import type { AttentionRow, CockpitData, Queue } from '../types.ts'

export type Filters = { search: string; oem: string; region: string; tier: string; reason: string }
export const emptyFilters: Filters = { search: '', oem: '', region: '', tier: '', reason: '' }
export type SortKey = 'default' | 'tier' | 'latest' | 'region' | 'oem'
export type Sort = { key: SortKey; direction: 'asc' | 'desc' }
// Approved categorical ordering, never a priority or severity score.
export const tierOrder = ['care_plus', 'care', 'optimize', 'free'] as const
const compareText = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

export function getAttentionRows(data: CockpitData): AttentionRow[] {
  const units = new Map(data.units.map(unit => [unit.unitId, unit]))
  return data.attentionItems.map(attention => {
    const unit = units.get(attention.unitId)
    if (!unit) throw new Error('Attention item has no resolved unit')
    return { unit, attention }
  })
}

export function selectRows(rows: AttentionRow[], queue: Queue, filters: Filters, sort: Sort): AttentionRow[] {
  const search = filters.search.trim().toLocaleLowerCase('en')
  return rows.filter(({ unit, attention }) => (
    attention.queue === queue
    && (!search || unit.unitId.toLowerCase().includes(search) || unit.customerName.toLocaleLowerCase('en').includes(search))
    && (!filters.oem || unit.oem === filters.oem)
    && (!filters.region || unit.region === filters.region)
    && (!filters.tier || unit.serviceTier === filters.tier)
    && (!filters.reason || attention.signals.some(signal => signal.type === filters.reason))
  )).sort((a, b) => {
    let result = 0
    switch (sort.key) {
      case 'tier':
        result = tierOrder.indexOf(a.unit.serviceTier) - tierOrder.indexOf(b.unit.serviceTier)
        break
      case 'latest':
        // Missing dates always go last, in either direction.
        if (!a.unit.latestReading || !b.unit.latestReading) {
          return Number(!a.unit.latestReading) - Number(!b.unit.latestReading) || compareText(a.unit.unitId, b.unit.unitId)
        }
        result = compareText(a.unit.latestReading, b.unit.latestReading)
        break
      case 'region': result = compareText(a.unit.region, b.unit.region); break
      case 'oem': result = compareText(a.unit.oem, b.unit.oem); break
      case 'default':
        return tierOrder.indexOf(a.unit.serviceTier) - tierOrder.indexOf(b.unit.serviceTier)
          || (b.attention.persistenceDays ?? 0) - (a.attention.persistenceDays ?? 0)
          || compareText(b.attention.lastObserved ?? '', a.attention.lastObserved ?? '')
          || (b.attention.daysStale ?? 0) - (a.attention.daysStale ?? 0)
          || compareText(a.unit.unitId, b.unit.unitId)
    }
    return result * (sort.direction === 'asc' ? 1 : -1) || compareText(a.unit.unitId, b.unit.unitId)
  })
}

import type { CockpitData, DataState, Oem, Tier, Unit, UnitSelection } from '../types.ts'

export type UnitFilters = {
  search: string
  oem: Oem | ''
  dataState: DataState | ''
  region: string
  tier: Tier | ''
}

export const emptyUnitFilters: UnitFilters = { search: '', oem: '', dataState: '', region: '', tier: '' }

export function selectUnits(units: Unit[], filters: UnitFilters): Unit[] {
  const search = filters.search.trim().toLocaleLowerCase('en')
  return units.filter(unit => (
    (!search || unit.unitId.toLocaleLowerCase('en').includes(search) || unit.customerName.toLocaleLowerCase('en').includes(search))
    && (!filters.oem || unit.oem === filters.oem)
    && (!filters.dataState || unit.dataState === filters.dataState)
    && (!filters.region || unit.region === filters.region)
    && (!filters.tier || unit.serviceTier === filters.tier)
  )).sort((a, b) => a.unitId.localeCompare(b.unitId, 'en', { numeric: true }))
}

export function selectUnit(data: CockpitData, unitId: string): UnitSelection | null {
  const unit = data.units.find(unit => unit.unitId === unitId)
  return unit ? { unit, attention: data.attentionItems.find(item => item.unitId === unitId) ?? null } : null
}

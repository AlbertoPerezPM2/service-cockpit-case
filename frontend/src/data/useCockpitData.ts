import { useEffect, useState } from 'react'
import type { CockpitData } from '../types'
import { getAttentionRows } from './selectors'

export function useCockpitData(attempt: number) {
  const [result, setResult] = useState<{ data: CockpitData | null; failed: boolean; attempt: number }>({
    data: null, failed: false, attempt: 0,
  })
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/cockpit.json`, { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load service data')
        const data: CockpitData = await response.json()
        if (data.schemaVersion !== 1 || !Array.isArray(data.units) || !Array.isArray(data.attentionItems)
          || !data.meta?.snapshotDate || !data.oemFields) throw new Error('Unsupported service data')
        getAttentionRows(data)
        if (!controller.signal.aborted) setResult({ data, failed: false, attempt })
      } catch {
        if (!controller.signal.aborted) setResult({ data: null, failed: true, attempt })
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt])
  return result.attempt === attempt ? result : { data: null, failed: false }
}

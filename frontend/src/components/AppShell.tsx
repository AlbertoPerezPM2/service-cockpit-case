import type { ReactNode } from 'react'
import { Box, Chip, Link, Stack, Typography } from '@mui/material'
import HubOutlined from '@mui/icons-material/HubOutlined'

export type MainView = 'attention' | 'all_units'

const navLinkStyle = {
  alignItems: 'center', color: '#bacbdb', textDecoration: 'none',
  border: 0, borderBottom: '3px solid transparent', borderRadius: 0,
  bgcolor: 'transparent', boxShadow: 'none', pt: '3px', minHeight: 64,
  '&[aria-current="page"]': { color: '#fff', borderBottomColor: '#a6c4e7' },
  '&:focus-visible': { outline: 'none', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px' },
}

export function AppShell({ children, attentionCount, view, onNavigate, onOpenCaseStudy }: {
  children: ReactNode; attentionCount?: number; view: MainView; onNavigate: (view: MainView) => void; onOpenCaseStudy?: () => void
}) {
  return (
    <Box>
      <Box component="header" sx={{ bgcolor: '#172c43', color: '#fff', px: { xs: 2, md: 4 }, borderBottom: '1px solid #29435e' }}>
        <Stack direction="row" sx={{ alignItems: 'center', minHeight: 68, gap: { xs: 3, md: 6 }, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <HubOutlined sx={{ fontSize: 25, color: '#afc8e2' }} />
            <Typography component="span" sx={{ fontWeight: 650, fontSize: '1rem', letterSpacing: '-0.02em' }}>Service Cockpit</Typography>
          </Stack>
          <Box component="nav" aria-label="Primary navigation" sx={{ alignSelf: 'stretch', display: 'flex', gap: 3.5 }}>
            <Stack component="a" href="#main-content" aria-current={view === 'attention' ? 'page' : undefined} direction="row" spacing={1}
              onClick={event => { event.preventDefault(); onNavigate('attention') }}
              sx={navLinkStyle}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Needs Attention</Typography>
              {attentionCount !== undefined && <Chip label={attentionCount} size="small" sx={{ height: 21, color: '#e5edf6', bgcolor: '#314b66' }} />}
            </Stack>
            <Stack component="a" href="#main-content" aria-current={view === 'all_units' ? 'page' : undefined} direction="row"
              onClick={event => { event.preventDefault(); onNavigate('all_units') }}
              sx={navLinkStyle}>
              <Typography variant="body2" sx={{ fontWeight: view === 'all_units' ? 600 : 400 }}>All Units</Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2.5} sx={{ ml: 'auto', alignItems: 'center' }}>
            <Link href={`${import.meta.env.BASE_URL}case-study`} underline="hover" onClick={event => {
              if (!onOpenCaseStudy || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault(); onOpenCaseStudy()
            }} sx={{ color: '#bacbdb', fontSize: '0.8125rem', fontWeight: 400, whiteSpace: 'nowrap', py: 1 }}>Case study ↗</Link>
          </Stack>
        </Stack>
      </Box>
      <Box component="main" id="main-content" sx={{ maxWidth: 1680, mx: 'auto' }}>{children}</Box>
    </Box>
  )
}

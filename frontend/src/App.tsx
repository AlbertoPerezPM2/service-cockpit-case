import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Container, Skeleton, Stack, Typography } from '@mui/material'
import { AppShell } from './components/AppShell'
import type { MainView } from './components/AppShell'
import { NeedsAttentionPage } from './pages/NeedsAttentionPage'
import { AllUnitsPage } from './pages/AllUnitsPage'
import { useCockpitData } from './data/useCockpitData'
import { TechnicalVisitBriefing } from './briefing/TechnicalVisitBriefing'
import type { Briefing } from './briefing/briefing'
import { CaseStudyPage } from './pages/CaseStudyPage'

export default function App() {
  const [attempt, setAttempt] = useState(0)
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const cockpitPath = import.meta.env.BASE_URL
  const caseStudyPath = `${cockpitPath}case-study`
  const caseStudyVisible = pathname === caseStudyPath || pathname === `${caseStudyPath}/`
  const [view, setView] = useState<MainView>('attention')
  const { data, failed } = useCockpitData(attempt)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const worklistScroll = useRef({ x: 0, y: 0 })
  const caseStudyReturnScroll = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])
  function openCaseStudy() {
    caseStudyReturnScroll.current = { x: window.scrollX, y: window.scrollY }
    window.history.pushState(null, '', caseStudyPath)
    setPathname(caseStudyPath)
    window.scrollTo(0, 0)
  }
  function backToCockpit() {
    window.history.pushState(null, '', cockpitPath)
    setPathname(cockpitPath)
    requestAnimationFrame(() => window.scrollTo(caseStudyReturnScroll.current.x, caseStudyReturnScroll.current.y))
  }
  function showBriefing(document: Briefing) {
    worklistScroll.current = { x: window.scrollX, y: window.scrollY }
    setBriefing(document)
    window.scrollTo(0, 0)
  }
  function backToUnit() {
    setBriefing(null)
    requestAnimationFrame(() => window.scrollTo(worklistScroll.current.x, worklistScroll.current.y))
  }
  return (
    <>
    <div className="cockpit-workspace" hidden={!!briefing || caseStudyVisible}>
    <AppShell attentionCount={data?.attentionItems.length} view={view} onNavigate={setView} onOpenCaseStudy={openCaseStudy}>
      <Container maxWidth={false} sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 } }}>
        {data ? <>
          <div hidden={view !== 'attention'}><NeedsAttentionPage data={data} active={view === 'attention' && !caseStudyVisible} briefingVisible={!!briefing} onGenerateBriefing={showBriefing} /></div>
          <div hidden={view !== 'all_units'}><AllUnitsPage data={data} active={view === 'all_units' && !caseStudyVisible} briefingVisible={!!briefing} onGenerateBriefing={showBriefing} /></div>
        </> : failed ? (
          <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt(attempt + 1)}>Retry</Button>}>
            Service data could not be loaded.
          </Alert>
        ) : (
          <Box role="status" aria-label="Loading service data" aria-busy="true">
            <Typography variant="h1">{view === 'attention' ? 'Needs Attention' : 'All Units'}</Typography>
            <Skeleton width={330} height={32} sx={{ mt: 1, mb: 4 }} />
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={64} />
              <Skeleton variant="rounded" height={76} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Box>
        )}
      </Container>
    </AppShell>
    </div>
    {briefing && !caseStudyVisible && <TechnicalVisitBriefing briefing={briefing} onBack={backToUnit} />}
    {caseStudyVisible && <CaseStudyPage onBack={backToCockpit} />}
    </>
  )
}

import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import wattsonConfiguration from './wattson-configuration.txt?raw'

export function CustomGptSetupDialog({ open, onClose, configuration }: {
  open: boolean; onClose: () => void; configuration: string
}) {
  return <Dialog open={open} onClose={onClose} scroll="paper" fullWidth maxWidth="md"
    aria-labelledby="custom-gpt-setup-title" onKeyDown={event => event.stopPropagation()}>
    <DialogTitle id="custom-gpt-setup-title">Wattson McStudyson — Custom GPT setup</DialogTitle>
    <DialogContent dividers>
      <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '0.875rem', lineHeight: 1.7 }}>{configuration}</Box>
    </DialogContent>
    <DialogActions><Button onClick={onClose} autoFocus>Close</Button></DialogActions>
  </Dialog>
}

export function CustomGptSetup() {
  const [open, setOpen] = useState(false)
  return <>
    <Button size="small" aria-haspopup="dialog" onClick={() => setOpen(true)} sx={{ mt: 2, px: 0 }}>View Custom GPT setup ↗</Button>
    <CustomGptSetupDialog open={open} onClose={() => setOpen(false)} configuration={wattsonConfiguration} />
  </>
}

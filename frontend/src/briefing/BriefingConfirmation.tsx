import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, FormLabel, TextField, Typography } from '@mui/material'
import type { AttentionRow } from '../types'
import { briefingSections, visitReasons } from './briefing'
import type { BriefingDraft } from './briefing'

export function BriefingConfirmation({ open, row, draft, onChange, onCancel, onGenerate, documentVisible }: {
  open: boolean
  row: AttentionRow
  draft: BriefingDraft
  onChange: (draft: BriefingDraft) => void
  onCancel: () => void
  onGenerate: () => void
  documentVisible: boolean
}) {
  return <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth
    disableRestoreFocus={documentVisible} aria-labelledby="briefing-confirm-title" aria-describedby="briefing-confirm-description">
    <DialogTitle id="briefing-confirm-title" sx={{ pb: 1 }}>Prepare Technical Visit Briefing</DialogTitle>
    <DialogContent>
      <Typography id="briefing-confirm-description" variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {row.unit.unitId} · {row.unit.customerName}
      </Typography>
      <FormControl component="fieldset" fullWidth sx={{ mb: 2.5 }}>
        <FormLabel component="legend" sx={{ typography: 'body2', fontWeight: 600, color: 'text.primary' }}>Reason for visit</FormLabel>
        {visitReasons(row.attention).map(reason => <Box key={reason} sx={{ mt: 1, px: 1.25, py: 1, bgcolor: '#f5f7fa', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox checked disabled size="small" slotProps={{ input: { 'aria-label': `${reason} (required)` } }} sx={{ p: 0.25, '&.Mui-disabled': { color: 'primary.main' } }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{reason}</Typography>
          </Box>
        </Box>)}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>Reason for visit and known data-quality conflicts are always included.</Typography>
      </FormControl>
      <FormControl component="fieldset" fullWidth sx={{ mb: 2.5 }}>
        <FormLabel component="legend" sx={{ typography: 'body2', fontWeight: 600, color: 'text.primary' }}>Include in briefing</FormLabel>
        <FormGroup sx={{ mt: 0.5 }}>
          {briefingSections.map(section => <FormControlLabel key={section.id}
            label={<Typography variant="body2">{section.label}</Typography>}
            control={<Checkbox size="small" checked={draft.sections[section.id]}
              onChange={event => onChange({ ...draft, sections: { ...draft.sections, [section.id]: event.target.checked } })} />} />)}
        </FormGroup>
      </FormControl>
      <TextField label="Planner note (optional)" value={draft.plannerNote} fullWidth multiline minRows={3} maxRows={7}
        onChange={event => onChange({ ...draft, plannerNote: event.target.value })} />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="contained" onClick={onGenerate}>Generate briefing</Button>
    </DialogActions>
  </Dialog>
}

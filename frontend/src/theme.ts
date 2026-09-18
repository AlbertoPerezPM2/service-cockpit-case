import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#294e78' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#1b2939', secondary: '#5f6b7a' },
    divider: '#e1e6ed',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 650, letterSpacing: '-0.035em' },
    h2: { fontSize: '1.25rem', fontWeight: 650, letterSpacing: '-0.02em' },
    h3: { fontSize: '1rem', fontWeight: 650 },
    body1: { fontSize: '1rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: { fontSize: '0.75rem', fontWeight: 650, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiChip: { styleOverrides: { root: { borderRadius: 5, fontWeight: 600, fontSize: '0.75rem' } } },
    MuiTableCell: { styleOverrides: {
      root: { borderBottomColor: '#e7ebf0', fontSize: '0.875rem' },
      head: { background: '#f8f9fb', color: '#5f6b7a', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' },
    } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 58 } } },
    MuiOutlinedInput: { styleOverrides: { root: { background: '#fff', fontSize: '0.875rem' } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.8125rem' } } },
  },
})

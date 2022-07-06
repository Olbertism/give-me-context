import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#263238',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      main: '#ffb300',
    },
  },
  status: {
    danger: '#0052cc',
  },
  typography : {
    h1: {
      fontSize: '2.8rem',
      marginBottom: "50px"
    },
    h2: {
      fontSize: '2.3rem',
    },
    h3: {
      fontSize: '1.5rem',
      marginTop: "20px",
      marginBottom: "5px"
    },
    body1: {
      marginBottom: "5px"
    }
  }
});

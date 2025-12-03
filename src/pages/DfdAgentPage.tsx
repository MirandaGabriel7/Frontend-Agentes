import {
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  TextField,
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';

export const DfdAgentPage = () => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
        mx: 'auto',
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ mb: 4, textAlign: { xs: 'left', sm: 'center' } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analisador de DFD (em construção)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: { xs: 0, sm: 'auto' } }}>
          O agente de análise de DFD está em desenvolvimento. Em breve você poderá enviar o DFD para análise automática.
        </Typography>
      </Box>
      <Alert severity="info" sx={{ mb: 3, maxWidth: { xs: '100%', md: '800px' }, mx: 'auto' }}>
        Em breve você poderá enviar o DFD para análise automática.
      </Alert>
      <Paper sx={{ p: 3, maxWidth: { xs: '100%', md: '600px' }, mx: 'auto' }}>
        <Box sx={{ mb: 2 }}>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="dfd-file-upload"
            type="file"
            disabled
          />
          <label htmlFor="dfd-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadFile />}
              disabled
              fullWidth
            >
              Upload DFD PDF
            </Button>
          </label>
        </Box>
        <Button
          variant="contained"
          fullWidth
          disabled
        >
          Analisar DFD
        </Button>
      </Paper>
    </Box>
  );
};


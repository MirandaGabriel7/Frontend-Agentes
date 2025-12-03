import {
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  TextField,
  Container,
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';

export const DfdAgentPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Analisador de DFD (em construção)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        O agente de análise de DFD está em desenvolvimento. Em breve você poderá enviar o DFD para análise automática.
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Em breve você poderá enviar o DFD para análise automática.
      </Alert>
      <Paper sx={{ p: 3 }}>
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
    </Container>
  );
};


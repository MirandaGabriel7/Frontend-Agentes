import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import { DfdMeta, DfdAnalysis } from '../../../lib/types/dfdResult';

interface DfdMetaBarProps {
  meta: DfdMeta;
  analysis: DfdAnalysis;
}

export const DfdMetaBar: React.FC<DfdMetaBarProps> = ({ meta, analysis }) => {
  const theme = useTheme();
  const [jsonOpen, setJsonOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar download real
    console.log('Download PDF');
  };

  const handleViewJson = () => {
    setJsonOpen(true);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                display: 'block',
                mb: 0.5,
              }}
            >
              Gerado por: {meta.gerado_por}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                display: 'block',
                mb: 0.5,
              }}
            >
              Versão do motor: {meta.versao_motor}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                display: 'block',
              }}
            >
              Análise gerada em: {formatDate(meta.timestamp_geracao)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                borderColor: alpha(theme.palette.divider, 0.3),
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Baixar parecer em PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={handleViewJson}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                borderColor: alpha(theme.palette.divider, 0.3),
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Ver JSON bruto
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Dialog para JSON */}
      <Dialog
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>JSON Bruto da Análise</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.grey[900], 0.05),
              overflow: 'auto',
              maxHeight: '60vh',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
            }}
          >
            <code>{JSON.stringify(analysis, null, 2)}</code>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJsonOpen(false)} sx={{ textTransform: 'none' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


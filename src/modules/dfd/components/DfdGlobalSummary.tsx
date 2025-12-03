import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import { DfdOverview } from '../../../lib/types/dfdResult';

interface DfdGlobalSummaryProps {
  overview: DfdOverview;
}

export const DfdGlobalSummary: React.FC<DfdGlobalSummaryProps> = ({ overview }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, sm: 5 },
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: theme.palette.text.primary,
          letterSpacing: '-0.01em',
        }}
      >
        Resumo numérico global
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              {overview.total_grupos_avaliados}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Total de grupos avaliados
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              {overview.total_itens_avaliados}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Total de itens avaliados
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.error.main,
                mb: 1,
              }}
            >
              {overview.total_pendencias_relevantes}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Total de pendências relevantes
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};


import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import { DfdOverview } from '../../../lib/types/dfdResult';

interface DfdOverviewCardProps {
  overview: DfdOverview;
}

export const DfdOverviewCard: React.FC<DfdOverviewCardProps> = ({ overview }) => {
  const theme = useTheme();

  const getSemafaroColor = (semaforo: string) => {
    switch (semaforo) {
      case 'VERDE':
        return { bg: alpha(theme.palette.success.main, 0.1), text: theme.palette.success.main };
      case 'LARANJA':
        return { bg: alpha(theme.palette.warning.main, 0.1), text: theme.palette.warning.main };
      case 'VERMELHO':
        return { bg: alpha(theme.palette.error.main, 0.1), text: theme.palette.error.main };
      default:
        return { bg: alpha(theme.palette.grey[500], 0.1), text: theme.palette.grey[700] };
    }
  };

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'BAIXO':
        return 'success';
      case 'MEDIO':
        return 'warning';
      case 'ALTO':
      case 'MUITO_ALTO':
        return 'error';
      default:
        return 'default';
    }
  };

  const semaforoConfig = getSemafaroColor(overview.semaforo_global);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, sm: 5, md: 6 },
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
          mb: 4,
          color: theme.palette.text.primary,
          letterSpacing: '-0.01em',
        }}
      >
        Visão Geral da Análise
      </Typography>

      {/* Linha 1: Percentual e Chips */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1,
            }}
          >
            {overview.percentual_atendimento_global.toFixed(2).replace('.', ',')}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={`Semáforo: ${overview.semaforo_global}`}
            sx={{
              bgcolor: semaforoConfig.bg,
              color: semaforoConfig.text,
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
            }}
          />
          <Chip
            label={`Risco: ${overview.nivel_risco_global}`}
            color={getRiscoColor(overview.nivel_risco_global) as 'success' | 'warning' | 'error'}
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
            }}
          />
        </Box>
      </Box>

      {/* Barra de progresso */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={overview.percentual_atendimento_global}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: theme.palette.primary.main,
            },
          }}
        />
      </Box>

      {/* Linha 2: Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 0.5,
              }}
            >
              {overview.total_grupos_avaliados}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Grupos avaliados
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {overview.total_itens_avaliados}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Itens avaliados
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.error.main,
                mb: 0.5,
              }}
            >
              {overview.total_pendencias_relevantes}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Pendências relevantes
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Linha 3: Visão rápida */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.8,
            color: theme.palette.text.primary,
            fontSize: '0.9375rem',
          }}
        >
          {overview.visao_rapida}
        </Typography>
      </Box>
    </Paper>
  );
};


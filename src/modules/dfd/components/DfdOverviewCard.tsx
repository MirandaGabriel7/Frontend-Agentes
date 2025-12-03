import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Grid,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import { DfdOverview } from '../../../lib/types/dfdResult';
import { DonutChart, DonutChartSegment } from '../../../components/ui/DonutChart';

interface DfdOverviewCardProps {
  overview: DfdOverview;
}

export const DfdOverviewCard: React.FC<DfdOverviewCardProps> = ({ overview }) => {
  const theme = useTheme();
  const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);

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

  // Calcular dados para o gráfico donut baseado nos grupos
  // Vamos usar uma representação simplificada: atendidos vs não atendidos vs parcialmente atendidos
  // Baseado no percentual de atendimento global
  const atendidosPercent = overview.percentual_atendimento_global;
  const naoAtendidosPercent = 100 - atendidosPercent;

  const chartData: DonutChartSegment[] = [
    {
      value: atendidosPercent,
      color: theme.palette.success.main,
      label: 'Atendidos',
    },
    {
      value: naoAtendidosPercent,
      color: theme.palette.error.main,
      label: 'Não atendidos',
    },
  ];

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

      {/* Gráfico Donut e Chips */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          mb: 4,
        }}
      >
        {/* Gráfico Donut */}
        <DonutChart
          data={chartData}
          size={240}
          strokeWidth={24}
          highlightOnHover
          onSegmentHover={setHoveredSegment}
          centerContent={
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {overview.percentual_atendimento_global.toFixed(1).replace('.', ',')}%
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                }}
              >
                Atendimento
              </Typography>
            </Box>
          }
        />

        {/* Chips e informações */}
        <Stack spacing={2} sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
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

          {/* Legenda do gráfico */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 200 }}>
            {chartData.map((segment) => (
              <Box
                key={segment.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: hoveredSegment?.label === segment.label
                    ? alpha(segment.color, 0.1)
                    : 'transparent',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${
                    hoveredSegment?.label === segment.label
                      ? alpha(segment.color, 0.3)
                      : 'transparent'
                  }`,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: segment.color,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: hoveredSegment?.label === segment.label ? 600 : 400,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {segment.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                    }}
                  >
                    {segment.value.toFixed(1).replace('.', ',')}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Stack>
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


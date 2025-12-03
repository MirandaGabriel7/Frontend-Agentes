import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DfdGrupo } from '../../../lib/types/dfdResult';

interface DfdGroupsGridProps {
  grupos: DfdGrupo[];
}

export const DfdGroupsGrid: React.FC<DfdGroupsGridProps> = ({ grupos }) => {
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
        Avaliação por grupo de regras
      </Typography>

      {/* Grid de cards-resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {grupos.map((grupo) => {
          const semaforoConfig = getSemafaroColor(grupo.semaforo);
          return (
            <Grid size={{ xs: 12, md: 6 }} key={grupo.grupo_id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  bgcolor: theme.palette.background.paper,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha('#000', 0.08)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      flex: 1,
                      pr: 2,
                    }}
                  >
                    {grupo.titulo_grupo}
                  </Typography>
                  <Chip
                    label={grupo.semaforo}
                    size="small"
                    sx={{
                      bgcolor: semaforoConfig.bg,
                      color: semaforoConfig.text,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {grupo.percentual_atendimento.toFixed(2).replace('.', ',')}%
                    </Typography>
                    <Chip
                      label={grupo.nivel_risco}
                      size="small"
                      color={getRiscoColor(grupo.nivel_risco) as 'success' | 'warning' | 'error'}
                      sx={{
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={grupo.percentual_atendimento}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 2,
                    fontSize: '0.8125rem',
                  }}
                >
                  Pendências relevantes: <strong>{grupo.pendencias_relevantes}</strong>
                </Typography>

                <Tooltip title={grupo.comentario_resumo} arrow placement="top">
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.5,
                    }}
                  >
                    {grupo.comentario_resumo}
                  </Typography>
                </Tooltip>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Accordion detalhado */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 2,
            color: theme.palette.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
        >
          Detalhamento por grupo
        </Typography>
        {grupos.map((grupo) => {
          const semaforoConfig = getSemafaroColor(grupo.semaforo);
          return (
            <Accordion
              key={grupo.grupo_id}
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                    {grupo.titulo_grupo}
                  </Typography>
                  <Chip
                    label={grupo.semaforo}
                    size="small"
                    sx={{
                      bgcolor: semaforoConfig.bg,
                      color: semaforoConfig.text,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {grupo.percentual_atendimento.toFixed(2).replace('.', ',')}%
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {grupo.comentario_resumo}
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Quantitativos
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Total de itens
                        </Typography>
                        <Typography variant="h6">{grupo.quantitativo.total_itens}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Atendidos
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.success.main }}>
                          {grupo.quantitativo.itens_atendidos}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Não atendidos
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
                          {grupo.quantitativo.itens_nao_atendidos}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Parcialmente atendidos
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.warning.main }}>
                          {grupo.quantitativo.itens_parcialmente_atendidos}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
};


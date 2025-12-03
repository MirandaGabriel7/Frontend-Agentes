import React from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { TrpRun } from '../../../lib/types/trp';

interface TrpSummaryStripProps {
  run: TrpRun;
}

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    COMPLETED: 'Concluído',
    RUNNING: 'Em Processamento',
    PENDING: 'Pendente',
    FAILED: 'Falha',
  };
  return map[status] || status;
};

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'COMPLETED':
      return {
        bg: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        border: alpha(theme.palette.success.main, 0.2),
      };
    case 'RUNNING':
      return {
        bg: alpha(theme.palette.warning.main, 0.1),
        color: theme.palette.warning.main,
        border: alpha(theme.palette.warning.main, 0.2),
      };
    case 'FAILED':
      return {
        bg: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
        border: alpha(theme.palette.error.main, 0.2),
      };
    default:
      return {
        bg: alpha(theme.palette.text.secondary, 0.1),
        color: theme.palette.text.secondary,
        border: alpha(theme.palette.text.secondary, 0.2),
      };
  }
};

export const TrpSummaryStrip: React.FC<TrpSummaryStripProps> = ({ run }) => {
  const theme = useTheme();
  const campos = run.output?.campos_trp_normalizados;
  const statusColors = getStatusColor(run.status, theme);

  if (!campos) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        p: 3,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Nº Contrato
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {campos.numero_contrato}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Processo
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {campos.processo_licitatorio}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Nº NF
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {campos.numero_nf}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Valor
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {campos.valor_efetivo_formatado}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto' }}>
        <Chip
          label={getStatusLabel(run.status)}
          size="small"
          sx={{
            bgcolor: statusColors.bg,
            color: statusColors.color,
            border: `1px solid ${statusColors.border}`,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 28,
          }}
        />
      </Box>
    </Box>
  );
};


import React from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { DfdAnalysis } from '../../../lib/types/dfdResult';

interface DfdResultHeaderProps {
  analysis: DfdAnalysis;
}

export const DfdResultHeader: React.FC<DfdResultHeaderProps> = ({ analysis }) => {
  const theme = useTheme();
  const navigate = useNavigate();

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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 4,
        flexWrap: 'wrap',
        gap: 3,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/agents/dfd')}
          sx={{
            mb: 2,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.action.hover, 0.05),
            },
          }}
        >
          Voltar para Agente DFD
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          Resultado da Análise de DFD
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}
        >
          Tipo: {analysis.tipo_contratacao} • Subtipo: {analysis.subtipo}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          textAlign: { xs: 'left', sm: 'right' },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
          }}
        >
          Motor: {analysis.meta.versao_motor}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
          }}
        >
          Gerado em: {formatDate(analysis.meta.timestamp_geracao)}
        </Typography>
      </Box>
    </Box>
  );
};


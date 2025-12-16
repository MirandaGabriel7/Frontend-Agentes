import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { TrpRunResponse } from '../types/trp.types';
import { formatCondicaoPrazo, formatCondicaoQuantidade } from '../utils/formatTrpValues';

interface TrpInfoSidebarProps {
  data: TrpRunResponse;
}

export const TrpInfoSidebar: React.FC<TrpInfoSidebarProps> = ({ data }) => {
  const theme = useTheme();
  const campos = data.campos;

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: '0.8125rem',
          mb: 0.5,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 500,
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <InfoOutlinedIcon sx={{ color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Informações Estruturadas
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <InfoRow label="Número do Contrato" value={campos.numero_contrato} />
      <InfoRow label="Processo Licitatório" value={campos.processo_licitatorio} />
      <InfoRow label="Fornecedor" value={campos.fornecedor} />
      <InfoRow label="Valor" value={campos.valor} />
      <InfoRow label="Data" value={new Date(campos.data).toLocaleDateString('pt-BR')} />
      <InfoRow
        label="Condição de Prazo"
        value={formatCondicaoPrazo(campos.condicao_prazo)}
      />
      <InfoRow
        label="Condição de Quantidade"
        value={formatCondicaoQuantidade(campos.condicao_quantidade)}
      />
      {campos.observacoes && (
        <InfoRow label="Observações" value={campos.observacoes} />
      )}
    </Paper>
  );
};


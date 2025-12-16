import React from 'react';
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';
import {
  Description as ContractIcon,
  Business as SupplierIcon,
  Receipt as InvoiceIcon,
  AttachMoney as ValueIcon,
} from '@mui/icons-material';
import { TrpCamposNormalizados } from '../../../lib/types/trp';

interface TrpSummaryCardsProps {
  campos: TrpCamposNormalizados;
}

const normalizeField = (value: string | null | undefined): string => {
  // Só exibir "Não informado" se o valor for null/undefined/"" ou "NAO_DECLARADO"
  if (value === null || value === undefined || value === '' || value === 'NAO_DECLARADO') {
    return 'Não informado';
  }
  return value;
};

// Helper para obter campo do objeto snake_case
const getCampo = (campos: TrpCamposNormalizados, key: string): string | null | undefined => {
  // Acessar diretamente o objeto, sem depender do tipo
  const value = (campos as any)[key];
  // Se for number, converter para string
  if (typeof value === 'number') {
    return value.toString();
  }
  // Se for string, retornar
  if (typeof value === 'string') {
    return value;
  }
  // Se for null ou undefined, retornar null
  return value ?? null;
};

export const TrpSummaryCards: React.FC<TrpSummaryCardsProps> = ({ campos }) => {
  const theme = useTheme();

  const cards = [
    {
      label: 'CONTRATO',
      primary: normalizeField(getCampo(campos, 'numero_contrato')),
      icon: <ContractIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: 'FORNECEDOR',
      primary: normalizeField(getCampo(campos, 'contratada')),
      icon: <SupplierIcon />,
      color: theme.palette.info.main,
    },
    {
      label: 'DOCUMENTO FISCAL',
      primary: `NF: ${normalizeField(getCampo(campos, 'numero_nf'))}`,
      icon: <InvoiceIcon />,
      color: theme.palette.success.main,
    },
    {
      label: 'VALOR',
      primary: (getCampo(campos, 'valor_efetivo_formatado') as string) || 'Não informado',
      icon: <ValueIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4,
      }}
    >
      {cards.map((card, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: theme.palette.background.paper,
            boxShadow: `0 1px 2px ${alpha('#000', 0.04)}, 0 2px 8px ${alpha('#000', 0.03)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${card.color}, ${alpha(card.color, 0.6)})`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha('#000', 0.08)}, 0 8px 24px ${alpha('#000', 0.06)}`,
              transform: 'translateY(-4px)',
              borderColor: alpha(card.color, 0.3),
              '&::before': {
                opacity: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              mb: 1.25,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(card.color, 0.1),
                color: card.color,
                flexShrink: 0,
                '& svg': {
                  fontSize: '1.25rem',
                },
              }}
            >
              {card.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: theme.palette.text.primary,
                opacity: 0.7,
                flex: 1,
                lineHeight: 1.2,
              }}
            >
              {card.label}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: '1.0625rem',
              lineHeight: 1.35,
              wordBreak: 'break-word',
              pl: 5.75, // Align with icon (36px icon + 1.25 gap = ~5.75 spacing units)
            }}
          >
            {card.primary}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};


import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { TrpListItem, TrpStatus } from '../types/trp.types';

interface TrpTableProps {
  items: TrpListItem[];
  onViewDetails: (id: string) => void;
}

const getStatusColor = (status: TrpStatus, theme: any) => {
  switch (status) {
    case 'CONCLUÍDO':
      return {
        bg: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        border: alpha(theme.palette.success.main, 0.2),
      };
    case 'EM_PROCESSAMENTO':
      return {
        bg: alpha(theme.palette.warning.main, 0.1),
        color: theme.palette.warning.main,
        border: alpha(theme.palette.warning.main, 0.2),
      };
    case 'ERRO':
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

const formatStatus = (status: TrpStatus): string => {
  const map: Record<TrpStatus, string> = {
    CONCLUÍDO: 'Concluído',
    EM_PROCESSAMENTO: 'Em Processamento',
    ERRO: 'Erro',
    PENDENTE: 'Pendente',
  };
  return map[status] || status;
};

export const TrpTable: React.FC<TrpTableProps> = ({ items, onViewDetails }) => {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Nenhum TRP encontrado. Crie um novo TRP para começar.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        overflow: 'hidden',
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              '& th': {
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                py: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              },
            }}
          >
            <TableCell>Nº do Contrato</TableCell>
            <TableCell>Nº da NF</TableCell>
            <TableCell align="right">Valor Total</TableCell>
            <TableCell>Situação</TableCell>
            <TableCell>Data</TableCell>
            <TableCell align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const statusColors = getStatusColor(item.situacao, theme);
            return (
              <TableRow
                key={item.id}
                sx={{
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  },
                  '& td': {
                    py: 2.5,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {item.numeroContrato}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {item.numeroNF}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    {item.valorTotal}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={formatStatus(item.situacao)}
                    size="small"
                    sx={{
                      bgcolor: statusColors.bg,
                      color: statusColors.color,
                      border: `1px solid ${statusColors.border}`,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 26,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(item.data).toLocaleDateString('pt-BR')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onViewDetails(item.id)}
                    sx={{
                      color: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};


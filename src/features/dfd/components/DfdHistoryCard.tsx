import React, { useState, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  alpha,
  useTheme,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import {
  CheckCircle,
  Sync,
  Error as ErrorIcon,
  Description,
  Visibility,
  Download,
} from '@mui/icons-material';

export interface DfdHistoryItem {
  id: string;
  fileName: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  semaforo?: 'VERDE' | 'LARANJA' | 'VERMELHO';
  nivelRisco?: string;
  percentualAtendimento?: number;
  totalPendencias?: number;
}

interface DfdHistoryCardProps {
  items: DfdHistoryItem[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  emptyMessage?: string;
}

export const DfdHistoryCard: React.FC<DfdHistoryCardProps> = ({
  items,
  onView,
  onDownload,
  emptyMessage = 'Nenhuma análise realizada ainda.',
}) => {
  const theme = useTheme();
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular itens paginados
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Resetar para página 1 quando mudar itemsPerPage
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Resetar para página 1 quando items mudarem
  React.useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const getStatusConfig = (status: DfdHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle />,
          color: theme.palette.success.main,
          label: 'Concluído',
        };
      case 'processing':
        return {
          icon: <Sync />,
          color: theme.palette.warning.main,
          label: 'Processando',
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          color: theme.palette.error.main,
          label: 'Falhou',
        };
    }
  };

  const getSemafaroColor = (semaforo?: string) => {
    switch (semaforo) {
      case 'VERDE':
        return 'success';
      case 'LARANJA':
        return 'warning';
      case 'VERMELHO':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (items.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
          textAlign: 'center',
        }}
      >
        <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          py: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              Histórico de Análises
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {items.length} {items.length === 1 ? 'análise realizada' : 'análises realizadas'}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="items-per-page-label">Por página</InputLabel>
            <Select
              labelId="items-per-page-label"
              value={itemsPerPage}
              label="Por página"
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <List sx={{ p: 0 }}>
        {paginatedItems.map((item, index) => {
          const statusConfig = getStatusConfig(item.status);
          return (
            <React.Fragment key={item.id}>
              <ListItem
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: 3,
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 56 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(statusConfig.color, 0.12),
                      border: `1.5px solid ${alpha(statusConfig.color, 0.2)}`,
                      width: 48,
                      height: 48,
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: '0.9375rem',
                        }}
                      >
                        {item.fileName}
                      </Typography>
                      <Chip
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(statusConfig.color, 0.1),
                          border: `1px solid ${alpha(statusConfig.color, 0.3)}`,
                          color: statusConfig.color,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          height: 24,
                        }}
                      />
                      {item.semaforo && (
                        <Chip
                          label={`Semáforo: ${item.semaforo}`}
                          size="small"
                          color={getSemafaroColor(item.semaforo) as 'success' | 'warning' | 'error'}
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            height: 24,
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 1,
                          fontSize: '0.8125rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.status === 'completed' && item.percentualAtendimento !== undefined && (
                          <>
                            Atendimento: <strong>{item.percentualAtendimento.toFixed(1)}%</strong>
                            {item.totalPendencias !== undefined && (
                              <>
                                {' • '}
                                Pendências: <strong>{item.totalPendencias}</strong>
                              </>
                            )}
                            {item.nivelRisco && (
                              <>
                                {' • '}
                                Risco: <strong>{item.nivelRisco}</strong>
                              </>
                            )}
                          </>
                        )}
                        {item.status === 'processing' && 'Análise em andamento...'}
                        {item.status === 'failed' && 'Falha ao processar o documento'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            opacity: 0.7,
                          }}
                        >
                          {formatDate(item.createdAt)}
                        </Typography>
                        {item.status === 'completed' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {onView && (
                              <Button
                                size="small"
                                startIcon={<Visibility sx={{ fontSize: 16 }} />}
                                onClick={() => onView(item.id)}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  minWidth: 'auto',
                                  px: 1.5,
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  },
                                }}
                              >
                                Ver
                              </Button>
                            )}
                            {onDownload && (
                              <Button
                                size="small"
                                startIcon={<Download sx={{ fontSize: 16 }} />}
                                onClick={() => onDownload(item.id)}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  minWidth: 'auto',
                                  px: 1.5,
                                  color: theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.action.hover, 0.05),
                                  },
                                }}
                              >
                                Baixar
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < paginatedItems.length - 1 && <Divider sx={{ mx: { xs: 3, sm: 4 } }} />}
            </React.Fragment>
          );
        })}
      </List>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            py: 3,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2,
                '&.Mui-selected': {
                  fontWeight: 600,
                },
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};


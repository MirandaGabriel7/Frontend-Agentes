import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  alpha,
  useTheme,
  Select,
  FormControl,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { TrpInputForm, TrpCondicaoPrazo, TrpCondicaoQuantidade, TrpTipoBasePrazo, TrpTipoContrato } from '../../../lib/types/trp';

dayjs.locale('pt-br');

interface TrpFormCardProps {
  value: TrpInputForm;
  onChange: (next: TrpInputForm) => void;
  disabled?: boolean;
}

export const TrpFormCard: React.FC<TrpFormCardProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const updateField = (field: keyof TrpInputForm) => (newValue: unknown) => {
    onChange({ ...value, [field]: newValue });
  };

  const formatDateToDDMMYYYY = (date: Dayjs | null): string => {
    if (!date) return '';
    return date.format('DD/MM/YYYY');
  };

  const parseDateFromDDMMYYYY = (dateStr: string | undefined): Dayjs | null => {
    if (!dateStr) return null;
    // Aceita tanto DD/MM/YYYY quanto YYYY-MM-DD
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return dayjs(`${year}-${month}-${day}`);
    }
    return dayjs(dateStr);
  };

  const handleCondicaoPrazoChange = (newValue: TrpCondicaoPrazo) => {
    const updates: Partial<TrpInputForm> = { condicao_prazo: newValue };
    
    // Limpar campos condicionais se não for FORA_DO_PRAZO
    if (newValue !== 'FORA_DO_PRAZO') {
      updates.data_prevista_entrega_contrato = undefined;
      updates.data_entrega_real = undefined;
      updates.motivo_atraso = undefined;
    }
    
    onChange({ ...value, ...updates });
  };

  const handleCondicaoQuantidadeChange = (newValue: TrpCondicaoQuantidade) => {
    const updates: Partial<TrpInputForm> = { condicao_quantidade: newValue };
    
    // Limpar detalhe_pendencias se mudar para TOTAL
    if (newValue === 'TOTAL') {
      updates.detalhe_pendencias = undefined;
    }
    
    onChange({ ...value, ...updates });
  };

  const showAtrasoFields = value.condicao_prazo === 'FORA_DO_PRAZO';
  const showPendenciasFields = value.condicao_quantidade === 'PARCIAL' || value.condicao_quantidade === 'DIVERGENCIA_SUPERIOR';
  const showCompetenciaField = value.tipo_contratacao === 'SERVIÇOS';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 4px 16px ${alpha('#000', 0.06)}`,
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 4,
          color: theme.palette.text.primary,
          fontSize: '1.25rem',
        }}
      >
        2. Informações do Recebimento
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Tipo de Contrato - Campo obrigatório no início */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Tipo de contrato *
          </Typography>
          <FormControl fullWidth variant="outlined" required>
            <Select
              value={value.tipo_contratacao || ''}
              onChange={(e) => {
                const newTipo = e.target.value as TrpTipoContrato;
                const updates: Partial<TrpInputForm> = { tipo_contratacao: newTipo };
                // Limpar competência se mudar de SERVIÇOS para outro tipo
                if (newTipo !== 'SERVIÇOS') {
                  updates.competencia_mes_ano = undefined;
                }
                onChange({ ...value, ...updates });
              }}
              disabled={disabled}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>Selecione o tipo de contrato</Box>;
                }
                return selected;
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.12)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: 'background.paper',
                },
                '& .MuiSelect-select': {
                  paddingLeft: '16px',
                  paddingRight: '16px',
                },
              }}
            >
              <MenuItem value="BENS">BENS</MenuItem>
              <MenuItem value="SERVIÇOS">SERVIÇOS</MenuItem>
              <MenuItem value="OBRA">OBRA</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Campo condicional: Competência (Mês/Ano) - só aparece quando tipo == SERVIÇOS */}
        {showCompetenciaField && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              Mês/Ano de competência
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
              Relação do mês da prestação do serviço
            </Typography>
            <TextField
              value={value.competencia_mes_ano || ''}
              onChange={(e) => {
                let input = e.target.value;
                // Permitir apenas números e barra
                input = input.replace(/[^\d/]/g, '');
                // Limitar formato MM/AAAA
                if (input.length <= 7) {
                  // Adicionar barra automaticamente após 2 dígitos
                  if (input.length === 2 && !input.includes('/')) {
                    input = input + '/';
                  }
                  updateField('competencia_mes_ano')(input);
                }
              }}
              fullWidth
              variant="outlined"
              placeholder="Ex: 12/2025"
              disabled={disabled}
              InputLabelProps={{ shrink: false }}
              label=""
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: 'background.paper',
                  '& fieldset': {
                    borderColor: 'rgba(0,0,0,0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                  },
                },
                '& .MuiInputBase-input': {
                  paddingLeft: '16px',
                  paddingRight: '16px',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                },
              }}
            />
          </Box>
        )}

        {/* Campos sempre relevantes */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              Data do Recebimento *
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                value={parseDateFromDDMMYYYY(value.data_recebimento_nf_real)}
                onChange={(newValue: Dayjs | null) => {
                  updateField('data_recebimento_nf_real')(formatDateToDDMMYYYY(newValue));
                }}
                disabled={disabled}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    placeholder: 'Selecione a data',
                    InputLabelProps: { shrink: false },
                    label: '',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '999px',
                        backgroundColor: 'background.paper',
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                        },
                      },
                      '& .MuiInputBase-input': {
                        paddingLeft: '16px',
                        paddingRight: '16px',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.7,
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              Base para contagem de prazo
            </Typography>
            <FormControl fullWidth variant="outlined">
              <Select
                value={value.tipo_base_prazo || ''}
                onChange={(e) => updateField('tipo_base_prazo')(e.target.value as TrpTipoBasePrazo)}
                disabled={disabled}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>Selecione a base de contagem</Box>;
                  }
                  return selected === 'NF' 
                    ? 'NF – prazo contado a partir da Nota Fiscal'
                    : 'SERVICO – prazo contado a partir da execução/conclusão do serviço';
                }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.12)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.light',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '999px',
                    backgroundColor: 'background.paper',
                  },
                  '& .MuiSelect-select': {
                    paddingLeft: '16px',
                    paddingRight: '16px',
                  },
                }}
              >
                <MenuItem value="NF">NF – prazo contado a partir da Nota Fiscal</MenuItem>
                <MenuItem value="SERVICO">SERVICO – prazo contado a partir da execução/conclusão do serviço</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Condição do Prazo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Condição do Prazo
          </Typography>
          <FormControl fullWidth variant="outlined">
            <Select
              value={value.condicao_prazo || ''}
              onChange={(e) => handleCondicaoPrazoChange(e.target.value as TrpCondicaoPrazo)}
              disabled={disabled}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>Selecione a condição do prazo</Box>;
                }
                if (selected === 'NO_PRAZO') return 'No prazo';
                if (selected === 'FORA_DO_PRAZO') return 'Prazo de entrega atrasado';
                return 'Não se aplica';
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.12)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: 'background.paper',
                },
              }}
            >
              <MenuItem value="NO_PRAZO">No prazo</MenuItem>
              <MenuItem value="FORA_DO_PRAZO">Prazo de entrega atrasado</MenuItem>
              <MenuItem value="NAO_SE_APLICA">Não se aplica</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Campos condicionais quando FORA_DO_PRAZO */}
        {showAtrasoFields && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mb: 0.5 }}
            >
              Detalhes do atraso
            </Typography>
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                transition: 'all 0.2s ease',
                boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  mb: 3.5,
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <InfoOutlinedIcon
                  sx={{
                    color: theme.palette.info.main,
                    fontSize: 22,
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  Este bloco aparece quando você seleciona "Prazo de entrega atrasado". Preencha as informações sobre a data prevista no contrato, a data real da entrega e o motivo do atraso para documentar adequadamente a situação.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Data prevista de entrega (contrato)
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <DatePicker
                      value={parseDateFromDDMMYYYY(value.data_prevista_entrega_contrato)}
                      onChange={(newValue: Dayjs | null) => {
                        updateField('data_prevista_entrega_contrato')(formatDateToDDMMYYYY(newValue));
                      }}
                      disabled={disabled}
                      format="DD/MM/YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          placeholder: 'Selecione a data',
                          InputLabelProps: { shrink: false },
                          label: '',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '999px',
                              backgroundColor: 'background.paper',
                              '& fieldset': {
                                borderColor: 'rgba(0,0,0,0.12)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'primary.light',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                                boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                              },
                            },
                            '& .MuiInputBase-input': {
                              paddingLeft: '16px',
                              paddingRight: '16px',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'text.secondary',
                              opacity: 0.7,
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Data real da entrega
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <DatePicker
                      value={parseDateFromDDMMYYYY(value.data_entrega_real)}
                      onChange={(newValue: Dayjs | null) => {
                        updateField('data_entrega_real')(formatDateToDDMMYYYY(newValue));
                      }}
                      disabled={disabled}
                      format="DD/MM/YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          placeholder: 'Selecione a data',
                          InputLabelProps: { shrink: false },
                          label: '',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '999px',
                              backgroundColor: 'background.paper',
                              '& fieldset': {
                                borderColor: 'rgba(0,0,0,0.12)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'primary.light',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                                boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                              },
                            },
                            '& .MuiInputBase-input': {
                              paddingLeft: '16px',
                              paddingRight: '16px',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'text.secondary',
                              opacity: 0.7,
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Motivo do atraso
                  </Typography>
                  <TextField
                    value={value.motivo_atraso || ''}
                    onChange={(e) => updateField('motivo_atraso')(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Ex.: Fornecedor atrasou devido a problemas logísticos"
                    disabled={disabled}
                    InputLabelProps={{ shrink: false }}
                    label=""
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '999px',
                        backgroundColor: 'background.paper',
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                        },
                      },
                      '& .MuiInputBase-input': {
                        paddingLeft: '16px',
                        paddingRight: '16px',
                      },
                      '& .MuiInputBase-input.MuiInputBase-inputMultiline': {
                        padding: '16px',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.7,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Condição da Quantidade */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Quantidade conforme Ordem de Fornecimento
          </Typography>
          <FormControl fullWidth variant="outlined">
            <Select
              value={value.condicao_quantidade || ''}
              onChange={(e) => handleCondicaoQuantidadeChange(e.target.value as TrpCondicaoQuantidade)}
              disabled={disabled}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>Selecione a condição da quantidade</Box>;
                }
                if (selected === 'TOTAL') return 'TOTAL';
                if (selected === 'PARCIAL') return 'PARCIAL';
                return 'PARCIAL'; // DIVERGENCIA_SUPERIOR mapeado para PARCIAL conforme instruções
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.12)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: 'background.paper',
                },
              }}
            >
              <MenuItem value="TOTAL">TOTAL</MenuItem>
              <MenuItem value="PARCIAL">PARCIAL</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Campos condicionais quando PARCIAL ou DIVERGENCIA_SUPERIOR */}
        {showPendenciasFields && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mb: 0.5 }}
            >
              Detalhe das pendências / divergências
            </Typography>
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                transition: 'all 0.2s ease',
                boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  mb: 3.5,
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <InfoOutlinedIcon
                  sx={{
                    color: theme.palette.info.main,
                    fontSize: 22,
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  Este bloco aparece quando você seleciona "Quantidade inferior ao empenho" ou "Quantidade superior ao empenho". Descreva detalhadamente a divergência entre a quantidade prevista no empenho e a quantidade efetivamente recebida, incluindo informações sobre pendências ou remessas futuras, se aplicável.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  Detalhe das pendências / divergências
                </Typography>
                <TextField
                  value={value.detalhe_pendencias || ''}
                  onChange={(e) => updateField('detalhe_pendencias')(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Ex.: Foram entregues apenas 140 pares de botas de 152 empenhados; saldo será entregue em nova remessa."
                  disabled={disabled}
                  InputLabelProps={{ shrink: false }}
                  label=""
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '999px',
                      backgroundColor: 'background.paper',
                      '& fieldset': {
                        borderColor: 'rgba(0,0,0,0.12)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.light',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                      },
                    },
                    '& .MuiInputBase-input': {
                      paddingLeft: '16px',
                      paddingRight: '16px',
                    },
                    '& .MuiInputBase-input.MuiInputBase-inputMultiline': {
                      padding: '16px',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'text.secondary',
                      opacity: 0.7,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Observações adicionais */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Observações adicionais do recebimento
          </Typography>
          <TextField
            value={value.observacoes_recebimento || ''}
            onChange={(e) => updateField('observacoes_recebimento')(e.target.value)}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Descreva observações relevantes"
            disabled={disabled}
            InputLabelProps={{ shrink: false }}
            label=""
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '999px',
                backgroundColor: 'background.paper',
                '& fieldset': {
                  borderColor: 'rgba(0,0,0,0.12)',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.light',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
              },
              '& .MuiInputBase-input': {
                paddingLeft: '16px',
                paddingRight: '16px',
              },
              '& .MuiInputBase-input.MuiInputBase-inputMultiline': {
                padding: '16px',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'text.secondary',
                opacity: 0.7,
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

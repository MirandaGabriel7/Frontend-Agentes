import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  alpha,
  useTheme,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { TrpInputForm, TrpCondicaoPrazo, TrpCondicaoQuantidade, TrpTipoBasePrazo } from '../../../lib/types/trp';

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
        {/* Campos sempre relevantes */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                label="Data do Recebimento"
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
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Base para contagem de prazo</InputLabel>
              <Select
                value={value.tipo_base_prazo || 'NF'}
                onChange={(e) => updateField('tipo_base_prazo')(e.target.value as TrpTipoBasePrazo)}
                label="Base para contagem de prazo"
                disabled={disabled}
              >
                <MenuItem value="NF">NF – prazo contado a partir da Nota Fiscal</MenuItem>
                <MenuItem value="SERVICO">SERVICO – prazo contado a partir da execução/conclusão do serviço</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Condição do Prazo */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Condição do Prazo
          </Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Condição do Prazo</InputLabel>
            <Select
              value={value.condicao_prazo || 'NAO_SE_APLICA'}
              onChange={(e) => handleCondicaoPrazoChange(e.target.value as TrpCondicaoPrazo)}
              label="Condição do Prazo"
              disabled={disabled}
            >
              <MenuItem value="NO_PRAZO">No prazo</MenuItem>
              <MenuItem value="FORA_DO_PRAZO">Prazo de entrega atrasado</MenuItem>
              <MenuItem value="NAO_SE_APLICA">Não se aplica</MenuItem>
            </Select>
          </FormControl>

          {/* Campos condicionais quando FORA_DO_PRAZO */}
          {showAtrasoFields && (
            <Box
              sx={{
                mt: 3,
                p: 3.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                transition: 'all 0.2s ease',
                boxShadow: `0 1px 3px ${alpha(theme.palette.warning.main, 0.08)}`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 0.75,
                    color: theme.palette.text.primary,
                    fontSize: '0.9375rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Detalhes do atraso
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    display: 'block',
                  }}
                >
                  Preencha os detalhes sobre o atraso no recebimento
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                  <DatePicker
                    label="Data prevista de entrega (contrato)"
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
                      },
                    }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                  <DatePicker
                    label="Data real da entrega"
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
                      },
                    }}
                  />
                </LocalizationProvider>
                <TextField
                  label="Motivo do atraso"
                  value={value.motivo_atraso || ''}
                  onChange={(e) => updateField('motivo_atraso')(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Ex.: Fornecedor atrasou devido a problemas logísticos"
                  disabled={disabled}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Condição da Quantidade */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Condição da Quantidade
          </Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Condição da Quantidade</InputLabel>
            <Select
              value={value.condicao_quantidade || 'TOTAL'}
              onChange={(e) => handleCondicaoQuantidadeChange(e.target.value as TrpCondicaoQuantidade)}
              label="Condição da Quantidade"
              disabled={disabled}
            >
              <MenuItem value="TOTAL">Quantidade conforme empenho</MenuItem>
              <MenuItem value="PARCIAL">Quantidade inferior ao empenho</MenuItem>
              <MenuItem value="DIVERGENCIA_SUPERIOR">Quantidade superior ao empenho</MenuItem>
            </Select>
          </FormControl>

          {/* Campos condicionais quando PARCIAL */}
          {showPendenciasFields && (
            <Box
              sx={{
                mt: 3,
                p: 3.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.04),
                border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                transition: 'all 0.2s ease',
                boxShadow: `0 1px 3px ${alpha(theme.palette.info.main, 0.08)}`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 0.75,
                    color: theme.palette.text.primary,
                    fontSize: '0.9375rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Detalhe das pendências / divergências
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    display: 'block',
                  }}
                >
                  Informe os detalhes sobre a divergência de quantidade em relação ao empenho
                </Typography>
              </Box>
              <TextField
                label="Detalhe das pendências / divergências"
                value={value.detalhe_pendencias || ''}
                onChange={(e) => updateField('detalhe_pendencias')(e.target.value)}
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Ex.: Foram entregues apenas 140 pares de botas de 152 empenhados; saldo será entregue em nova remessa."
                disabled={disabled}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Observações adicionais */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Observações adicionais do recebimento
          </Typography>
          <TextField
            label="Observações adicionais do recebimento"
            value={value.observacoes_recebimento || ''}
            onChange={(e) => updateField('observacoes_recebimento')(e.target.value)}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Use este campo para registrar qualquer informação extra que o fiscal queira registrar (ex.: embalagem danificada, local de entrega, etc.)"
            disabled={disabled}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

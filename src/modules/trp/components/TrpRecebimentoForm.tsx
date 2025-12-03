import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { TrpInputForm } from '../../../lib/types/trp';

interface TrpRecebimentoFormProps {
  data: TrpInputForm;
  onChange: (data: TrpInputForm) => void;
}

dayjs.locale('pt-br');

export const TrpRecebimentoForm: React.FC<TrpRecebimentoFormProps> = ({
  data,
  onChange,
}) => {
  const theme = useTheme();

  const handleChange = (field: keyof TrpInputForm, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 3,
          color: theme.palette.text.primary,
        }}
      >
        Informações do Recebimento
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            label="Data do Recebimento"
            value={data.dataRecebimento ? dayjs(data.dataRecebimento) : null}
            onChange={(newValue: Dayjs | null) => {
              handleChange('dataRecebimento', newValue?.format('YYYY-MM-DD') || '');
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
              },
            }}
          />
        </LocalizationProvider>

        <TextField
          select
          label="Condição do Prazo"
          value={data.condicaoPrazo || 'NAO_DECLARADO'}
          onChange={(e) => handleChange('condicaoPrazo', e.target.value)}
          fullWidth
          variant="outlined"
        >
          <MenuItem value="NAO_DECLARADO">Não Declarado</MenuItem>
          <MenuItem value="NO_PRAZO">No Prazo</MenuItem>
          <MenuItem value="ATRASADO">Atrasado</MenuItem>
        </TextField>

        <TextField
          select
          label="Condição da Quantidade"
          value={data.condicaoQuantidade || 'NAO_DECLARADO'}
          onChange={(e) => handleChange('condicaoQuantidade', e.target.value)}
          fullWidth
          variant="outlined"
        >
          <MenuItem value="NAO_DECLARADO">Não Declarado</MenuItem>
          <MenuItem value="CONFORME_EMPENHO">Conforme Empenho</MenuItem>
          <MenuItem value="MENOR">Quantidade inferior</MenuItem>
          <MenuItem value="MAIOR">Quantidade superior</MenuItem>
        </TextField>

        <TextField
          label="Observações"
          value={data.observacoes || ''}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Adicione observações relevantes sobre o recebimento..."
        />
      </Box>
    </Paper>
  );
};


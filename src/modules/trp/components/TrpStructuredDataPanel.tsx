import React from 'react';
import {
  Box,
  Typography,
  Grid,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import { TrpCamposNormalizados } from '../../../lib/types/trp';
import { normalizeTrpValue } from '../utils/formatTrpValues';
import { organizeFieldsBySections } from '../utils/trpFieldSections';

interface TrpStructuredDataPanelProps {
  campos: TrpCamposNormalizados;
}

const normalizeField = (value: string | null | undefined): string => {
  // Só exibir "Não informado" se o valor for null/undefined/"" ou "NAO_DECLARADO"
  if (value === null || value === undefined || value === '' || value === 'NAO_DECLARADO') {
    return 'Não informado';
  }
  return value;
};

interface DataFieldProps {
  label: string;
  value: string;
}

const DataField: React.FC<DataFieldProps> = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: theme.palette.text.secondary,
          mb: 0.5,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.primary,
          fontSize: '0.9375rem',
          lineHeight: 1.6,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export const TrpStructuredDataPanel: React.FC<TrpStructuredDataPanelProps> = ({
  campos,
}) => {
  const theme = useTheme();

  // Debug temporário
  console.debug('TrpStructuredDataPanel - campos recebido:', campos);
  console.debug('TrpStructuredDataPanel - campos keys:', Object.keys(campos));
  console.debug('TrpStructuredDataPanel - vencimento_nf:', (campos as any).vencimento_nf);
  console.debug('TrpStructuredDataPanel - data_entrega:', (campos as any).data_entrega);
  console.debug('TrpStructuredDataPanel - condicao_prazo:', (campos as any).condicao_prazo);
  console.debug('TrpStructuredDataPanel - condicao_quantidade:', (campos as any).condicao_quantidade);
  console.debug('TrpStructuredDataPanel - observacoes:', (campos as any).observacoes);

  // ✅ RENDERIZAÇÃO DINÂMICA: Organizar campos por seções automaticamente
  const sectionsWithFields = organizeFieldsBySections(campos as Record<string, unknown>);
  
  // Converter para formato esperado pelo componente
  const sections = sectionsWithFields
    .filter(({ section }) => section.title !== 'ASSINATURAS') // Assinaturas não aparecem na aba de dados estruturados
    .map(({ section, fields }) => ({
      title: section.title,
      fields: fields.map((field) => {
        let displayValue = '';
        if (field.value === null || field.value === undefined || field.value === '') {
          // Tratamento especial para observações
          if (field.fieldName === 'observacoes') {
            displayValue = 'Não há observações adicionais';
          } else {
            displayValue = 'Não informado';
          }
        } else if (typeof field.value === 'string') {
          displayValue = normalizeTrpValue(field.value, field.fieldName);
        } else if (typeof field.value === 'number') {
          displayValue = field.value.toString();
        } else {
          displayValue = String(field.value);
        }
        
        return {
          label: field.label,
          value: displayValue,
        };
      }),
    }));

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Box key={section.title} sx={{ mb: sectionIndex < sections.length - 1 ? 4 : 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              fontSize: '1.125rem',
            }}
          >
            {section.title}
          </Typography>
          <Grid container spacing={3}>
            {section.fields.map((field, fieldIndex) => (
              <Grid key={fieldIndex} size={{ xs: 12, sm: 6 }}>
                <DataField label={field.label} value={field.value} />
              </Grid>
            ))}
          </Grid>
          {sectionIndex < sections.length - 1 && (
            <Divider sx={{ mt: 4, borderColor: alpha(theme.palette.divider, 0.08) }} />
          )}
        </Box>
      ))}
    </Box>
  );
};


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

interface TrpStructuredDataPanelProps {
  campos: TrpCamposNormalizados;
}

const normalizeField = (value: string | null | undefined): string => {
  if (!value || value === 'NAO_DECLARADO') return 'Não informado';
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

  const sections = [
    {
      title: 'Contrato',
      fields: [
        { label: 'Número do contrato', value: normalizeField(campos.numero_contrato) },
        { label: 'Processo licitatório', value: normalizeField(campos.processo_licitatorio) },
        { label: 'Vigência', value: normalizeField(campos.vigencia) },
        { label: 'Tipo de contrato', value: normalizeField(campos.tipo_contrato) },
        { label: 'Objeto do contrato', value: normalizeField(campos.objeto_contrato) },
      ],
    },
    {
      title: 'Fornecedor',
      fields: [
        { label: 'Contratada', value: normalizeField(campos.contratada) },
        { label: 'CNPJ', value: normalizeField(campos.cnpj) },
      ],
    },
    {
      title: 'Documento Fiscal',
      fields: [
        { label: 'Número da NF', value: normalizeField(campos.numero_nf) },
        { label: 'Vencimento da NF', value: normalizeField(campos.vencimento_nf) },
        { label: 'Número do Empenho', value: normalizeField(campos.numero_empenho) },
        {
          label: 'Valor efetivo',
          value: campos.valor_efetivo_formatado || normalizeField(campos.valor_efetivo_numero?.toString()),
        },
        { label: 'Competência (Mês/Ano)', value: normalizeField(campos.competencia_mes_ano) },
      ],
    },
    {
      title: 'Recebimento',
      fields: [
        { label: 'Regime de fornecimento', value: normalizeField(campos.regime_fornecimento) },
        { label: 'Data da entrega', value: normalizeField(campos.data_entrega) },
        { label: 'Condição do prazo', value: normalizeField(campos.condicao_prazo) },
        { label: 'Condição da quantidade', value: normalizeField(campos.condicao_quantidade) },
      ],
    },
    {
      title: 'Observações',
      fields: [
        {
          label: 'Observações',
          value: normalizeField(campos.observacoes) || 'Nenhuma observação registrada.',
        },
      ],
    },
  ];

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


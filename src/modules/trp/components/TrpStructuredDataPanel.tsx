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
import { formatCondicaoPrazo, formatCondicaoQuantidade } from '../utils/formatTrpValues';

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

  // Helper para obter campo do objeto snake_case com fallbacks
  const getCampo = (key: string): string | null | undefined => {
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

  const sections = [
    {
      title: 'Contrato',
      fields: [
        { label: 'Número do contrato', value: normalizeField(getCampo('numero_contrato')) },
        { label: 'Processo licitatório', value: normalizeField(getCampo('processo_licitatorio')) },
        { label: 'Vigência', value: normalizeField(getCampo('vigencia')) },
        { label: 'Tipo de contrato', value: normalizeField(getCampo('tipo_contrato')) },
        { label: 'Objeto do contrato', value: normalizeField(getCampo('objeto_contrato')) },
      ],
    },
    {
      title: 'Fornecedor',
      fields: [
        { label: 'Contratada', value: normalizeField(getCampo('contratada')) },
        { label: 'CNPJ', value: normalizeField(getCampo('cnpj')) },
      ],
    },
    {
      title: 'Documento Fiscal',
      fields: [
        { label: 'Número da NF', value: normalizeField(getCampo('numero_nf')) },
        { label: 'Vencimento da NF', value: normalizeField(getCampo('vencimento_nf')) },
        { label: 'Número do Empenho', value: normalizeField(getCampo('numero_empenho')) },
        {
          label: 'Valor efetivo',
          value: getCampo('valor_efetivo_formatado') as string || normalizeField(getCampo('valor_efetivo_numero')?.toString()),
        },
        { label: 'Competência (Mês/Ano)', value: normalizeField(getCampo('competencia_mes_ano')) },
      ],
    },
    {
      title: 'Recebimento',
      fields: [
        { label: 'Data da entrega', value: normalizeField(getCampo('data_entrega')) },
        { label: 'Condição do prazo', value: formatCondicaoPrazo(getCampo('condicao_prazo')) },
        { label: 'Condição da quantidade', value: formatCondicaoQuantidade(getCampo('condicao_quantidade')) },
      ],
    },
    {
      title: 'Observações',
      fields: [
        {
          label: 'Observações',
          value: (() => {
            const obs = getCampo('observacoes');
            // Só exibir "Não há observações adicionais" se o valor for null/undefined/"" ou "NAO_DECLARADO"
            if (obs === null || obs === undefined || obs === '' || obs === 'NAO_DECLARADO') {
              return 'Não há observações adicionais';
            }
            return obs;
          })(),
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


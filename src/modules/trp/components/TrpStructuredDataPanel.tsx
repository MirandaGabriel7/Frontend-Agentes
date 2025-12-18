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
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

// ✅ valores que nunca devem aparecer pro usuário (mesmo se vierem do backend/markdown)
const HIDDEN_STRINGS = new Set([
  'NAO_DECLARADO',
  'NÃO_DECLARADO',
  'NAO INFORMADO',
  'NÃO INFORMADO',
  'NAO_INFORMADO',
  'NÃO_INFORMADO',
  'Não informado',
  'Nao informado',
  'Não há observações adicionais',
]);

function isHiddenOrEmptyString(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v !== 'string') return false;

  const s = v.trim();
  if (!s) return true;
  if (HIDDEN_STRINGS.has(s)) return true;
  if (HIDDEN_STRINGS.has(s.toUpperCase())) return true;
  return false;
}

function toDisplayString(fieldName: string, raw: unknown): string {
  if (raw === null || raw === undefined) return '';

  if (typeof raw === 'string') {
    // ✅ normalizeTrpValue é o "gate" anti-enum-técnico
    const normalized = normalizeTrpValue(raw, fieldName);
    // normalize pode retornar 'Não informado' quando vier vazio -> a gente corta depois
    return normalized?.trim?.() ? normalized : '';
  }

  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }

  try {
    const str = JSON.stringify(raw);
    return str && str !== '{}' && str !== '[]' ? str : '';
  } catch {
    return String(raw);
  }
}

export const TrpStructuredDataPanel: React.FC<TrpStructuredDataPanelProps> = ({
  campos,
}) => {
  const theme = useTheme();

  // ✅ CAST CORRETO E SEGURO PARA O TYPESCRIPT (evita TS2352)
  const camposAsRecord = campos as unknown as Record<string, unknown>;

  // ✅ Organizar campos dinamicamente por seções (este util já vem filtrando/normalizando também)
  const sectionsWithFields = organizeFieldsBySections(camposAsRecord);

  const sections = sectionsWithFields
    // Assinaturas não aparecem na aba de dados estruturados
    .filter(({ section }) => section.title !== 'ASSINATURAS')
    .map(({ section, fields }) => {
      const normalizedFields = fields
        .map((field) => {
          const raw = field.value;

          // ✅ converte SEMPRE via normalizeTrpValue (anti enum técnico)
          const displayValue = toDisplayString(field.fieldName, raw);

          // ✅ regra especial: observações vazias não entram (não polui UI)
          if (field.fieldName === 'observacoes' && isHiddenOrEmptyString(displayValue)) {
            return null;
          }

          // ✅ cortar qualquer "não declarado"/vazio/placeholder
          if (isHiddenOrEmptyString(displayValue)) {
            return null;
          }

          return {
            label: field.label,
            value: displayValue,
          };
        })
        .filter(Boolean) as Array<{ label: string; value: string }>;

      return {
        title: section.title,
        fields: normalizedFields,
      };
    })
    // ❌ Não renderizar seção vazia
    .filter((section) => section.fields.length > 0);

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Box
          key={section.title}
          sx={{ mb: sectionIndex < sections.length - 1 ? 4 : 0 }}
        >
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
            <Divider
              sx={{ mt: 4, borderColor: alpha(theme.palette.divider, 0.08) }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

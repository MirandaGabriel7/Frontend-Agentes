// src/modules/trp/utils/trpFormatters.ts

import { FieldType } from '@/features/trp/config/trpFieldMap';

/** Format number to pt-BR (e.g., 1234.56 → "1.234,56") */
export function formatPtBRNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const num =
    typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Parse pt-BR number string to JS number (e.g., "1.234,56" → 1234.56) */
export function parsePtBRNumber(str: string): number | null {
  if (!str || !str.trim()) return null;
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Format ISO date or DD/MM/YYYY to DD/MM/YYYY */
export function formatPtBRDate(value: string | undefined | null): string {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

/** Parse DD/MM/YYYY back to ISO date string (YYYY-MM-DD) */
export function parsePtBRDate(str: string): string {
  if (!str || !str.trim()) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  return str;
}

// ─── Enums: espelha EXATAMENTE trpEnums.ts do backend ────────────────────────

function normEnumKey(v: string): string {
  return v.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ENUM_DISPLAY: Record<string, Record<string, string>> = {
  tipo_contrato: {
    BENS: 'Bens',
    SERVICOS: 'Serviços',
    SERVIÇOS: 'Serviços',
    SERVICOS_CONTINUOS: 'Serviços contínuos',
    SERVIÇOS_CONTINUOS: 'Serviços contínuos',
    OBRA: 'Obra',
  },
  tipo_base_prazo: {
    DATA_RECEBIMENTO: 'Data de recebimento',
    DATA_ENTREGA: 'Data de entrega',
    SERVICO: 'Conclusão do serviço',
    DATA_CONCLUSAO_SERVICO: 'Conclusão do serviço',
    NF: 'Nota Fiscal',
    INICIO_SERVICO: 'Início do serviço',
    INICIO_DO_SERVICO: 'Início do serviço',
    DATA_INICIO_SERVICO: 'Início do serviço',
  },
  condicao_prazo: {
    NO_PRAZO: 'No prazo',
    FORA_DO_PRAZO: 'Fora do prazo',
    NAO_PRAZO: 'Não se aplica',
    NAO_APLICA: 'Não se aplica',
    NAO_SE_APLICA: 'Não se aplica',
    NAO_APLICAVEL: 'Não se aplica',
    NAO_APLICÁVEL: 'Não se aplica',
  },
  condicao_quantidade_ordem: {
    TOTAL: 'Total (conforme a ordem)',
    PARCIAL: 'Parcial',
    A_MAIOR: 'A maior',
    A_MENOR: 'A menor',
    NAO_APLICAVEL: 'Não se aplica',
    NAO_APLICÁVEL: 'Não se aplica',
    NAO_APLICA: 'Não se aplica',
    NAO_SE_APLICA: 'Não se aplica',
  },
  condicao_quantidade_nf: {
    TOTAL: 'Total (conforme a NF)',
    PARCIAL: 'Parcial',
    A_MAIOR: 'A maior',
    A_MENOR: 'A menor',
    NAO_APLICAVEL: 'Não se aplica',
    NAO_SE_APLICA: 'Não se aplica',
  },
};

// Campos que são enums — usados para humanização automática no displayValue
const ENUM_FIELDS = new Set(Object.keys(ENUM_DISPLAY));

export function humanizeEnumValue(fieldId: string, value: string): string {
  const map = ENUM_DISPLAY[fieldId];
  if (!map) return value;
  const key = normEnumKey(value);
  return map[key] ?? value;
}

/** Display value for any field type (always returns a printable string) */
export function displayValue(value: any, type: FieldType, fieldId?: string): string {
  if (value === undefined || value === null || value === '') return '—';

  if (type === 'number') return formatPtBRNumber(value);
  if (type === 'date') return formatPtBRDate(String(value));

  const str = String(value).trim();

  // 1) Se o fieldId é um campo enum conhecido, humaniza diretamente
  if (fieldId && ENUM_FIELDS.has(fieldId)) {
    return humanizeEnumValue(fieldId, str);
  }

  // 2) Fallback: detecta UPPER_SNAKE_CASE genérico e tenta humanizar
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(str)) {
    // Tenta em todos os maps
    for (const map of Object.values(ENUM_DISPLAY)) {
      const key = normEnumKey(str);
      if (map[key]) return map[key];
    }
  }

  return str;
}

/** Escape a string so it's safe to embed in markdown without breaking structure */
export function escapeMarkdownValue(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/\r/g, '');
}

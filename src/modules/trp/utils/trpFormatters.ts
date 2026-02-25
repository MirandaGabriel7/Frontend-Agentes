// src/modules/trp/utils/trpFormatters.ts

import { FieldType } from '../config/trpFieldMap';

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

// ─── Humanização de enums (espelha trpEnums.ts do backend) ──────────────────
const ENUM_DISPLAY: Record<string, string> = {
  // tipo_contrato
  BENS: 'Bens',
  SERVICOS: 'Serviços',
  OBRAS: 'Obras',
  SERVICOS_ENGENHARIA: 'Serviços de Engenharia',

  // tipo_base_prazo
  DATA_RECEBIMENTO: 'Data de recebimento',
  INICIO_SERVICO: 'Início do serviço',
  SERVICO: 'Conclusão do serviço',
  ENTREGA_REAL: 'Data de entrega real',

  // condicao_prazo
  NO_PRAZO: 'No prazo',
  FORA_DO_PRAZO: 'Fora do prazo',
  ATRASADO: 'Fora do prazo',

  // condicao_quantidade_ordem
  TOTAL: 'Total (conforme a ordem)',
  PARCIAL: 'Parcial',
  MAIOR: 'Maior que a ordem',
  CONFORME_EMPENHO: 'Total (conforme a ordem)',
};

function humanizeEnumValue(value: string): string {
  const upper = value.trim().toUpperCase();
  return ENUM_DISPLAY[upper] ?? value;
}

/** Display value for any field type (always returns a printable string) */
export function displayValue(value: any, type: FieldType): string {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'number') return formatPtBRNumber(value);
  if (type === 'date') return formatPtBRDate(String(value));

  const str = String(value);
  // Se o valor parece um enum técnico (UPPER_SNAKE_CASE), humaniza
  if (/^[A-Z][A-Z0-9_]+$/.test(str.trim())) {
    return humanizeEnumValue(str);
  }

  return str;
}

/** Escape a string so it's safe to embed in markdown without breaking structure */
export function escapeMarkdownValue(value: string): string {
  // Escape pipe (table cell delimiter) and newlines
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/\r/g, '');
}
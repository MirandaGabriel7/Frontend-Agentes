/**
 * Utilitários para formatar valores do TRP para exibição na UI
 * NUNCA exibir valores técnicos internos - sempre usar textos institucionais
 *
 * ✅ REGRA-OURO:
 * - Se for "não declarado" -> retornar '' (vazio) para a UI cortar (não poluir)
 * - Se for enum técnico conhecido -> retornar texto institucional
 * - Campos numéricos (quantidade/moeda) devem ser formatados por fieldName
 */

const HIDDEN = new Set([
  '',
  'NAO_DECLARADO',
  'NÃO_DECLARADO',
  'NAO INFORMADO',
  'NÃO INFORMADO',
  'NAO_INFORMADO',
  'NÃO_INFORMADO',
  'NAO DECLARADO',
  'NÃO DECLARADO',
]);

function isHidden(v: string): boolean {
  const s = v.trim();
  if (!s) return true;
  const upper = s.toUpperCase();
  return HIDDEN.has(s) || HIDDEN.has(upper);
}

function formatNumberPtBr(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value);
  } catch {
    return String(value);
  }
}

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace(/\u00A0/g, ' ');
  } catch {
    const fixed = value.toFixed(2).replace('.', ',');
    return `R$ ${fixed}`;
  }
}

/**
 * Aceita:
 * - number
 * - "44.080,00"
 * - "44080.00"
 * - "120000"
 * - "R$ 120,00"
 * - "R$120,00"
 * - "120,00"
 */
function parsePtBrNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  // já é number
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let s = String(value).trim();
  if (!s) return null;
  if (isHidden(s)) return null;

  // ✅ remove símbolos e textos comuns (R$, espaços, etc)
  // mantém apenas dígitos, ponto, vírgula e sinal negativo
  // ex: "R$ 1.234,56" -> "1.234,56"
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[Rr]\$\s?/g, '');
  s = s.replace(/[^0-9,.\-]/g, '');

  const cleaned = s.replace(/\s+/g, '');
  if (!cleaned) return null;

  // se tem vírgula, assume pt-BR (milhar com ponto, decimal com vírgula)
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  // senão, tenta número direto (ex: "1200.50" ou "1200")
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Mapeia valores de condição de prazo para texto legível
 */
export function formatCondicaoPrazo(value: string | null | undefined): string {
  if (!value) return '';
  if (isHidden(value)) return '';

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    NO_PRAZO: 'No prazo',
    FORA_DO_PRAZO: 'Fora do prazo',
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia valores de condição de quantidade para texto legível
 */
export function formatCondicaoQuantidade(value: string | null | undefined): string {
  if (!value) return '';
  if (isHidden(value)) return '';

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    TOTAL: 'Total',
    PARCIAL: 'Parcial',
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia tipo de base de prazo para texto legível
 */
export function formatTipoBasePrazo(value: string | null | undefined): string {
  if (!value) return '';
  if (isHidden(value)) return '';

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    DATA_RECEBIMENTO: 'Data de Recebimento',
    SERVICO: 'Conclusão do Serviço',
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia tipo de contratação para texto legível
 */
export function formatTipoContratacao(value: string | null | undefined): string {
  if (!value) return '';
  if (isHidden(value)) return '';

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    BENS: 'Bens',
    SERVIÇOS: 'Serviços',
    SERVICOS: 'Serviços',
    OBRA: 'Obra',
  };

  return mapping[key] ?? value.trim();
}

/**
 * ✅ Formata quantidade/unidade/valores
 * - quantidade_recebida -> número pt-BR
 * - valor_unitario / valor_total_calculado / valor_total_geral / valor_efetivo_numero / valor_efetivo -> BRL
 *
 * Retorna:
 * - string formatada (ex: "R$ 10,00", "1.234,5")
 * - '' (vazio) se não for parseável
 * - null se não for campo tratado aqui
 */
function formatQuantidadesEValores(fieldName: string, raw: unknown): string | null {
  const key = fieldName.trim().toLowerCase();

  // ⚠️ valor_efetivo_formatado já vem pronto
  if (key === 'valor_efetivo_formatado') return null;

  // quantidade
  if (key === 'quantidade_recebida') {
    const n = parsePtBrNumber(raw);
    if (n === null) return '';
    return formatNumberPtBr(n);
  }

  // ✅ moeda (inclui valor_total_geral agora)
  if (
    key === 'valor_unitario' ||
    key === 'valor_total_calculado' ||
    key === 'valor_total_geral' ||
    key === 'valor_efetivo' ||
    key === 'valor_efetivo_numero'
  ) {
    const n = parsePtBrNumber(raw);
    if (n === null) return '';
    return formatBRL(n);
  }

  return null;
}

/**
 * Normaliza qualquer valor técnico do TRP para texto institucional
 * ✅ Se for "não declarado" retorna '' (para a UI remover)
 * ✅ Formata quantidade e moeda nos campos certos
 */
export function normalizeTrpValue(value: string | null | undefined, fieldName?: string): string {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();
  if (!raw) return '';
  if (isHidden(raw)) return '';

  // ✅ formata campos numéricos específicos (inclui valor_total_geral)
  if (fieldName) {
    const formatted = formatQuantidadesEValores(fieldName, raw);
    if (formatted !== null) return formatted;
  }

  const normalizedValue = raw.toUpperCase();

  const institutionalMappings: Record<string, string> = {
    NO_PRAZO: 'No prazo',
    FORA_DO_PRAZO: 'Fora do prazo',

    TOTAL: 'Total',
    PARCIAL: 'Parcial',

    DATA_RECEBIMENTO: 'Data de Recebimento',
    SERVICO: 'Conclusão do Serviço',

    BENS: 'Bens',
    SERVIÇOS: 'Serviços',
    SERVICOS: 'Serviços',
    OBRA: 'Obra',
  };

  if (institutionalMappings[normalizedValue]) {
    return institutionalMappings[normalizedValue];
  }

  // por campo (se precisar)
  if (fieldName === 'condicao_prazo') return formatCondicaoPrazo(raw);
  if (fieldName === 'condicao_quantidade') return formatCondicaoQuantidade(raw);
  if (fieldName === 'tipo_base_prazo' || fieldName === 'tipoBasePrazo') return formatTipoBasePrazo(raw);
  if (fieldName === 'tipo_contratacao' || fieldName === 'tipoContratacao' || fieldName === 'tipo_contrato')
    return formatTipoContratacao(raw);

  return raw;
}

/**
 * @deprecated Use normalizeTrpValue
 */
export function formatTrpEnumValue(value: string | null | undefined, fieldName?: string): string {
  return normalizeTrpValue(value, fieldName);
}

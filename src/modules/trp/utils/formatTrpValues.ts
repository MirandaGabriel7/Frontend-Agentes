/**
 * Utilitários para formatar valores do TRP para exibição na UI
 * NUNCA exibir valores técnicos internos - sempre usar textos institucionais
 *
 * ✅ REGRA-OURO:
 * - Se for "não declarado" -> retornar '' (vazio) para a UI cortar (não poluir)
 * - Se for enum técnico conhecido -> retornar texto institucional
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
 * Normaliza qualquer valor técnico do TRP para texto institucional
 * ✅ Se for "não declarado" retorna '' (para a UI remover)
 */
export function normalizeTrpValue(value: string | null | undefined, fieldName?: string): string {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();
  if (!raw) return '';
  if (isHidden(raw)) return '';

  const normalizedValue = raw.toUpperCase();

  // mapeamentos globais
  const institutionalMappings: Record<string, string> = {
    // Condição de prazo
    NO_PRAZO: 'No prazo',
    FORA_DO_PRAZO: 'Fora do prazo',

    // Condição de quantidade
    TOTAL: 'Total',
    PARCIAL: 'Parcial',

    // Tipo de base de prazo
    DATA_RECEBIMENTO: 'Data de Recebimento',
    SERVICO: 'Conclusão do Serviço',

    // Tipo de contratação / contrato
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

  // default: devolve o valor limpo (não técnico)
  return raw;
}

/**
 * @deprecated Use normalizeTrpValue
 */
export function formatTrpEnumValue(value: string | null | undefined, fieldName?: string): string {
  return normalizeTrpValue(value, fieldName);
}

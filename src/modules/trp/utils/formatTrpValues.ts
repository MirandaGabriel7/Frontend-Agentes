/**
 * Utilitários para formatar valores do TRP para exibição na UI
 */

/**
 * Mapeia valores de condição de prazo para texto legível
 */
export function formatCondicaoPrazo(value: string | null | undefined): string {
  if (!value) return 'Não informado';
  
  const mapping: Record<string, string> = {
    'NO_PRAZO': 'No prazo',
    'FORA_DO_PRAZO': 'Fora do prazo',
  };
  
  return mapping[value] || value;
}

/**
 * Mapeia valores de condição de quantidade para texto legível
 */
export function formatCondicaoQuantidade(value: string | null | undefined): string {
  if (!value) return 'Não informado';
  
  const mapping: Record<string, string> = {
    'TOTAL': 'Total',
    'PARCIAL': 'Parcial',
  };
  
  return mapping[value] || value;
}

/**
 * Formata qualquer valor enum do TRP para texto legível
 * Tenta identificar automaticamente o tipo e aplicar o mapper correto
 */
export function formatTrpEnumValue(value: string | null | undefined, fieldName?: string): string {
  if (!value) return 'Não informado';
  
  // Se o campo for especificamente condicao_prazo ou condicao_quantidade
  if (fieldName === 'condicao_prazo') {
    return formatCondicaoPrazo(value);
  }
  if (fieldName === 'condicao_quantidade') {
    return formatCondicaoQuantidade(value);
  }
  
  // Tentar detectar automaticamente pelo valor
  if (value === 'NO_PRAZO' || value === 'FORA_DO_PRAZO') {
    return formatCondicaoPrazo(value);
  }
  if (value === 'TOTAL' || value === 'PARCIAL') {
    return formatCondicaoQuantidade(value);
  }
  
  // Se não for um enum conhecido, retornar o valor original
  return value;
}

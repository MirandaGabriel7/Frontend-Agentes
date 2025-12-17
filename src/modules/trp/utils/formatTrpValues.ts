/**
 * Utilitários para formatar valores do TRP para exibição na UI
 * NUNCA exibir valores técnicos internos - sempre usar textos institucionais
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
 * Mapeia tipo de base de prazo para texto legível
 */
export function formatTipoBasePrazo(value: string | null | undefined): string {
  if (!value) return 'Não informado';
  
  const mapping: Record<string, string> = {
    'DATA_RECEBIMENTO': 'Data de Recebimento',
    'SERVICO': 'Conclusão do Serviço',
  };
  
  return mapping[value] || value;
}

/**
 * Mapeia tipo de contratação para texto legível
 */
export function formatTipoContratacao(value: string | null | undefined): string {
  if (!value) return 'Não informado';
  
  const mapping: Record<string, string> = {
    'BENS': 'Bens',
    'SERVIÇOS': 'Serviços',
    'SERVICOS': 'Serviços', // Variante sem acento
    'OBRA': 'Obra',
  };
  
  return mapping[value] || value;
}

/**
 * Normaliza qualquer valor técnico do TRP para texto institucional
 * Esta é a função principal que deve ser usada para garantir que valores técnicos
 * nunca sejam exibidos diretamente ao usuário
 */
export function normalizeTrpValue(value: string | null | undefined, fieldName?: string): string {
  if (!value) return 'Não informado';
  
  // Normalizar espaços e converter para maiúsculas para comparação
  const normalizedValue = value.trim().toUpperCase();
  
  // Mapeamentos obrigatórios (textos institucionais)
  const institutionalMappings: Record<string, string> = {
    // Condição de prazo
    'NO_PRAZO': 'No prazo',
    'FORA_DO_PRAZO': 'Fora do prazo',
    // Condição de quantidade
    'TOTAL': 'Total',
    'PARCIAL': 'Parcial',
    // Tipo de base de prazo
    'DATA_RECEBIMENTO': 'Data de Recebimento',
    'SERVICO': 'Conclusão do Serviço',
    // Tipo de contratação
    'BENS': 'Bens',
    'SERVIÇOS': 'Serviços',
    'SERVICOS': 'Serviços',
    'OBRA': 'Obra',
  };
  
  // Se encontrar mapeamento, retornar texto institucional
  if (institutionalMappings[normalizedValue]) {
    return institutionalMappings[normalizedValue];
  }
  
  // Se o campo for especificamente conhecido, usar função específica
  if (fieldName === 'condicao_prazo') {
    return formatCondicaoPrazo(value);
  }
  if (fieldName === 'condicao_quantidade') {
    return formatCondicaoQuantidade(value);
  }
  if (fieldName === 'tipo_base_prazo' || fieldName === 'tipoBasePrazo') {
    return formatTipoBasePrazo(value);
  }
  if (fieldName === 'tipo_contratacao' || fieldName === 'tipoContratacao' || fieldName === 'tipo_contrato') {
    return formatTipoContratacao(value);
  }
  
  // Se não for um valor técnico conhecido, retornar o valor original
  return value;
}

/**
 * Formata qualquer valor enum do TRP para texto legível
 * Tenta identificar automaticamente o tipo e aplicar o mapper correto
 * @deprecated Use normalizeTrpValue em vez disso para garantir normalização completa
 */
export function formatTrpEnumValue(value: string | null | undefined, fieldName?: string): string {
  // Delegar para normalizeTrpValue para manter consistência
  return normalizeTrpValue(value, fieldName);
}

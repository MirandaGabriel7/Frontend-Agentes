/**
 * Labels humanizados para campos do TRP
 * Centraliza todos os rótulos de campos para garantir consistência
 */

export const trpFieldLabels: Record<string, string> = {
  // Identificação
  numero_contrato: 'Número do Contrato',
  processo_licitatorio: 'Processo Licitatório',
  contratada: 'Contratada',
  fornecedor: 'Fornecedor',
  cnpj: 'CNPJ',
  vigencia: 'Vigência',
  tipo_contrato: 'Tipo de Contrato',
  objeto_contrato: 'Objeto do Contrato',
  
  // Regime de Fornecimento
  regime_fornecimento: 'Regime de Fornecimento',
  competencia_mes_ano: 'Competência (Mês/Ano)',
  
  // Documento Fiscal
  numero_nf: 'Número da NF',
  vencimento_nf: 'Vencimento da NF',
  numero_empenho: 'Número do Empenho',
  valor_efetivo_formatado: 'Valor Efetivo',
  valor_efetivo_numero: 'Valor Efetivo',
  
  // Condições de Recebimento
  tipo_base_prazo: 'Tipo de Base de Prazo',
  data_recebimento: 'Data de Recebimento',
  data_entrega: 'Data da Entrega',
  data_conclusao_servico: 'Data de Conclusão do Serviço',
  condicao_prazo: 'Condição do Prazo',
  condicao_quantidade: 'Condição da Quantidade',
  condicao_quantidade_ordem: 'Condição da Quantidade (Ordem)',
  condicao_quantidade_nf: 'Condição da Quantidade (NF)',
  motivo_atraso: 'Motivo do Atraso',
  comentarios_quantidade_ordem: 'Comentários sobre Quantidade (Ordem)',
  comentarios_quantidade_nf: 'Comentários sobre Quantidade (NF)',
  
  // Observações
  observacoes: 'Observações',
  observacoes_recebimento: 'Observações do Recebimento',
  
  // Assinaturas
  fiscal_contrato_nome: 'Fiscal do Contrato',
  area_demandante_nome: 'Área Demandante',
  data_assinatura: 'Data de Assinatura',
};

/**
 * Retorna o label humanizado para um campo
 */
export function getTrpFieldLabel(fieldName: string): string {
  return trpFieldLabels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

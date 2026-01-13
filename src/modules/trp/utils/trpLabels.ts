/**
 * Labels humanizados para campos do TRP
 * Centraliza todos os rótulos de campos para garantir consistência
 * Compatível com:
 * - Novo fluxo (itens_objeto)
 * - Legado
 * - camelCase (runs antigos)
 */

export const trpFieldLabels: Record<string, string> = {
  // =========================
  // Metadados
  // =========================
  fileName: "Nome do TRP",

  // =========================
  // Identificação
  // =========================
  numero_contrato: "Número do Contrato",
  processo_licitatorio: "Processo Licitatório",
  numero_ordem_compra: "Ordem de Compra",
  contratada: "Contratada",
  fornecedor: "Fornecedor",
  cnpj: "CNPJ",
  vigencia: "Vigência",
  tipo_contrato: "Tipo de Contrato",
  objeto_contrato: "Objeto do Contrato",
  competencia_mes_ano: "Competência (Mês/Ano)",

  // =========================
  // Itens do recebimento (NOVO)
  // =========================
  itens_objeto: "Itens fornecidos / serviços prestados",
  valor_total_itens: "Total dos itens",
  valor_total_geral: "Total geral",

  // =========================
  // Legado – objeto único
  // =========================
  objeto_fornecido: "Fornecimento(s) ou Serviço(s) Prestado(s)",
  unidade_medida: "Unidade de Medida",
  quantidade_recebida: "Quantidade Recebida",
  valor_unitario: "Valor Unitário",
  valor_total_calculado: "Valor Total",

  // =========================
  // Documento Fiscal
  // =========================
  numero_nf: "Número da NF",
  vencimento_nf: "Vencimento da NF",
  numero_empenho: "Número do Empenho",

  valor_efetivo: "Valor Efetivo",
  valor_efetivo_numero: "Valor Efetivo",
  valor_efetivo_formatado: "Valor Efetivo",

  // =========================
  // Condições de Recebimento
  // =========================
  tipo_base_prazo: "Base para Contagem do Prazo",
  data_recebimento: "Data de Recebimento",
  data_entrega: "Data Base (Entrega)",
  data_conclusao_servico: "Data de Conclusão do Serviço",
  data_prevista_entrega_contrato: "Data Prevista em Contrato",
  data_entrega_real: "Data de Entrega Real",

  condicao_prazo: "Condição do Prazo",
  condicao_quantidade: "Condição da Quantidade",
  condicao_quantidade_ordem: "Condição da Quantidade (Ordem)",
  condicao_quantidade_nf: "Condição da Quantidade (NF)",

  motivo_atraso: "Motivo do Atraso",
  comentarios_quantidade_ordem: "Comentários (Ordem)",
  comentarios_quantidade_nf: "Comentários (NF)",

  // =========================
  // Observações
  // =========================
  observacoes: "Observações",
  observacoes_recebimento: "Observações do Recebimento",

  // =========================
  // Assinaturas
  // =========================
  fiscal_contrato_nome: "Fiscal do Contrato",
  data_assinatura: "Data de Assinatura",

  // =========================
  // Compatibilidade camelCase
  // =========================
  numeroContrato: "Número do Contrato",
  processoLicitatorio: "Processo Licitatório",
  numeroOrdemCompra: "Ordem de Compra",
  tipoContrato: "Tipo de Contrato",
  objetoContrato: "Objeto do Contrato",
  competenciaMesAno: "Competência (Mês/Ano)",

  itensObjeto: "Itens fornecidos / serviços prestados",
  valorTotalItens: "Total dos itens",
  valorTotalGeral: "Total geral",

  objetoFornecido: "Fornecimento(s) ou Serviço(s) Prestado(s)",
  unidadeMedida: "Unidade de Medida",
  quantidadeRecebida: "Quantidade Recebida",
  valorUnitario: "Valor Unitário",
  valorTotalCalculado: "Valor Total",

  numeroNf: "Número da NF",
  vencimentoNf: "Vencimento da NF",
  numeroEmpenho: "Número do Empenho",

  tipoBasePrazo: "Base para Contagem do Prazo",
  dataRecebimento: "Data de Recebimento",
  dataEntrega: "Data Base (Entrega)",
  dataConclusaoServico: "Data de Conclusão do Serviço",
  dataPrevistaEntregaContrato: "Data Prevista em Contrato",
  dataEntregaReal: "Data de Entrega Real",

  condicaoPrazo: "Condição do Prazo",
  condicaoQuantidade: "Condição da Quantidade",
  condicaoQuantidadeOrdem: "Condição da Quantidade (Ordem)",
  condicaoQuantidadeNf: "Condição da Quantidade (NF)",

  motivoAtraso: "Motivo do Atraso",
  comentariosQuantidadeOrdem: "Comentários (Ordem)",
  comentariosQuantidadeNf: "Comentários (NF)",

  observacoesRecebimento: "Observações do Recebimento",
  fiscalContratoNome: "Fiscal do Contrato",
  dataAssinatura: "Data de Assinatura",
};

/**
 * Retorna o label humanizado para um campo
 */
export function getTrpFieldLabel(fieldName: string): string {
  return (
    trpFieldLabels[fieldName] ||
    fieldName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

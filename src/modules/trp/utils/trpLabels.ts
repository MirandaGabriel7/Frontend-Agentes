/**
 * Labels humanizados para campos do TRP
 * Centraliza todos os rótulos de campos para garantir consistência
 * ✅ Ajustado para UI enxuta (datas de cálculo + total geral)
 */

export const trpFieldLabels: Record<string, string> = {
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
  // Itens / Objeto do Recebimento
  // =========================
  itens_objeto: "Itens do Recebimento",

  objeto_fornecido: "Fornecimento(s) ou Serviço(s) Prestado(s)",
  unidade_medida: "Unidade de Medida",
  quantidade_recebida: "Quantidade Recebida",
  valor_unitario: "Valor Unitário",
  valor_total_calculado: "Valor Total",

  // Totais
  valor_total_geral: "Total Geral",
  valorTotalGeral: "Total Geral",

  // =========================
  // Documento Fiscal
  // =========================
  numero_nf: "Número da NF",
  vencimento_nf: "Vencimento da NF",
  numero_empenho: "Número do Empenho",

  valor_efetivo_formatado: "Valor Efetivo",
  valor_efetivo_numero: "Valor Efetivo",
  valor_efetivo: "Valor Efetivo",

  // =========================
  // Regime e Execução (UI ENXUTA)
  // =========================
  tipo_base_prazo: "Base para Contagem do Prazo",

  // 👉 novos campos de apresentação (vindos do Pós-PRIME)
  regime_execucao_datas_exibicao: "Datas consideradas no cálculo",
data_base_calculo: "Data base do cálculo",


  // =========================
  // Datas técnicas (mantidas para compatibilidade / histórico)
  // ⚠️ normalmente escondidas na UI quando o resumo existir
  // =========================
  data_recebimento: "Data de Recebimento",
  data_entrega: "Data Base (Entrega)",
  data_conclusao_servico: "Data de Conclusão do Serviço",
  data_prevista_entrega_contrato: "Data Prevista em Contrato",
  data_entrega_real: "Data de Entrega Real",

  // =========================
  // Condições de Recebimento
  // =========================
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
};

/**
 * Retorna o label humanizado para um campo
 * Fallback seguro para campos novos/desconhecidos
 */
export function getTrpFieldLabel(fieldName: string): string {
  return (
    trpFieldLabels[fieldName] ||
    fieldName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

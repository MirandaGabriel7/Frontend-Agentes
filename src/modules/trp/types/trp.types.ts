export type CondicaoPrazo = 'NO_PRAZO' | 'ATRASADO';
export type CondicaoQuantidade = 'CONFORME_EMPENHO' | 'MENOR' | 'MAIOR';
export type TrpStatus = 'CONCLUÍDO' | 'EM_PROCESSAMENTO' | 'ERRO' | 'PENDENTE';

export interface DadosRecebimento {
  dataRecebimento: string;
  condicaoPrazo: CondicaoPrazo;
  condicaoQuantidade: CondicaoQuantidade;

  // ✅ NOVO CAMPO (o fiscal informa manualmente)
  objetoFornecido: string;

  observacoes?: string;
}

export interface TrpRunRequest {
  fileId: string;
  dadosRecebimento: DadosRecebimento;
}

export interface TrpRunResponse {
  id: string;
  documento_markdown: string;
  campos: {
    numero_contrato: string;
    numero_nf?: string;
    processo_licitatorio: string;
    fornecedor: string;
    valor: string;
    data: string;
    condicao_prazo: CondicaoPrazo;
    condicao_quantidade: CondicaoQuantidade;
    observacoes?: string;
  };
  status: TrpStatus;
  created_at: string;
}

export interface TrpListItem {
  id: string;
  numeroContrato: string;
  numeroNF: string;
  valorTotal: string;
  situacao: TrpStatus;
  data: string;
}

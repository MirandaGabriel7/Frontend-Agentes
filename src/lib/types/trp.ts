export type TrpStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Valores permitidos pelo backend (node TDR 03)
export type TrpCondicaoPrazo = 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'NAO_SE_APLICA';

export type TrpCondicaoQuantidade = 'TOTAL' | 'PARCIAL' | 'DIVERGENCIA_SUPERIOR';

export type TrpTipoBasePrazo = 'NF' | 'SERVICO';

export interface TrpInputForm {
  // Campos sempre relevantes
  data_recebimento_nf_real?: string; // DD/MM/AAAA
  tipo_base_prazo?: TrpTipoBasePrazo; // "NF" ou "SERVICO"
  observacoes_recebimento?: string;
  
  // Condição do Prazo
  condicao_prazo?: TrpCondicaoPrazo; // "NO_PRAZO" | "FORA_DO_PRAZO" | "NAO_SE_APLICA"
  
  // Campos condicionais quando condicao_prazo = "FORA_DO_PRAZO"
  data_prevista_entrega_contrato?: string; // DD/MM/AAAA
  data_entrega_real?: string; // DD/MM/AAAA
  motivo_atraso?: string;
  
  // Condição da Quantidade
  condicao_quantidade?: TrpCondicaoQuantidade; // "TOTAL" | "PARCIAL" | "DIVERGENCIA_SUPERIOR"
  
  // Detalhe de pendências (quando há divergência: PARCIAL ou DIVERGENCIA_SUPERIOR)
  detalhe_pendencias?: string;
  
  // Campo auxiliar para upload
  arquivoTdrNome?: string;
}

export interface TrpCamposNormalizados {
  numero_contrato: string;
  processo_licitatorio: string;
  objeto_contrato: string;
  contratada: string;
  cnpj: string;
  vigencia: string;
  competencia_mes_ano: string;
  numero_nf: string;
  vencimento_nf: string;
  numero_empenho: string;
  valor_efetivo_numero: number;
  valor_efetivo_formatado: string;
  regime_fornecimento: string;
  tipo_contrato: string;
  data_entrega: string;
  condicao_prazo: string;
  condicao_quantidade: string;
  observacoes: string;
}

export interface TrpMeta {
  fileName: string;
  hash_tdr: string;
}

export interface TrpAgentOutput {
  documento_markdown_final: string;
  campos_trp_normalizados: TrpCamposNormalizados;
  meta: TrpMeta;
}

export interface TrpRun {
  id: string;
  createdAt: string;
  status: TrpStatus;
  input: TrpInputForm;
  output?: TrpAgentOutput;
  errorMessage?: string;
}


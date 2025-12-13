export type TrpStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Valores permitidos pelo backend (node TDR 03)
export type TrpCondicaoPrazo = 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'NAO_SE_APLICA';

export type TrpCondicaoQuantidade = 'TOTAL' | 'PARCIAL' | 'DIVERGENCIA_SUPERIOR';

export type TrpTipoBasePrazo = 'NF' | 'SERVICO';

export type TrpTipoContrato = 'BENS' | 'SERVIÇOS' | 'OBRA';

export interface TrpInputForm {
  // Campos sempre relevantes
  tipo_contratacao?: TrpTipoContrato; // "BENS" | "SERVIÇOS" | "OBRA" - obrigatório
  data_recebimento_nf_real?: string; // DD/MM/AAAA
  tipo_base_prazo?: TrpTipoBasePrazo; // "NF" ou "SERVICO"
  observacoes_recebimento?: string;
  
  // Campo condicional: competência (só quando tipo_contratacao == "SERVIÇOS")
  competencia_mes_ano?: string; // MM/AAAA
  
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
  numero_contrato: string | null;
  processo_licitatorio: string | null;
  objeto_contrato: string | null;
  contratada: string | null;
  cnpj: string | null;
  vigencia: string | null;
  competencia_mes_ano: string | null;
  numero_nf: string | null;
  vencimento_nf: string | null;
  numero_empenho: string | null;
  valor_efetivo_numero: number | null;
  valor_efetivo_formatado: string | null;
  regime_fornecimento: string | null;
  tipo_contrato: string | null;
  data_entrega: string | null;
  condicao_prazo: string | null;
  condicao_quantidade: string | null;
  observacoes: string | null;
}

export interface TrpMeta {
  fileName: string;
  hash_tdr: string;
}

export interface TrpAgentOutput {
  documento_markdown_final: string;
  documento_markdown_prime?: string; // Versão original do PRIME (para debug)
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


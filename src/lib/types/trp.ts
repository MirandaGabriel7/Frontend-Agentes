export type TrpStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Valores permitidos pelo backend (node TDR 03)
export type TrpCondicaoPrazo = 'NO_PRAZO' | 'FORA_DO_PRAZO';

export type TrpCondicaoQuantidade = 'TOTAL' | 'PARCIAL';

export type TrpTipoBasePrazo = 'DATA_RECEBIMENTO' | 'SERVICO';

export type TrpTipoContrato = 'BENS' | 'SERVIÇOS' | 'OBRA';

export interface TrpInputForm {
  // Campo obrigatório no início
  tipo_contratacao?: TrpTipoContrato; // "BENS" | "SERVIÇOS" | "OBRA" - obrigatório
  
  // Campo condicional: competência (só quando tipo_contratacao == "SERVIÇOS")
  competencia_mes_ano?: string; // MM/AAAA
  
  // Base para contagem de prazo
  tipo_base_prazo?: TrpTipoBasePrazo; // "DATA_RECEBIMENTO" | "SERVICO"
  
  // Data de recebimento (quando base = DATA_RECEBIMENTO)
  data_recebimento_nf_real?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Data de conclusão do serviço (quando base = SERVICO)
  data_conclusao_servico?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Datas de entrega
  data_prevista_entrega_contrato?: string; // DD/MM/AAAA ou YYYY-MM-DD
  data_entrega_real?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Condição do Prazo
  condicao_prazo?: TrpCondicaoPrazo; // "NO_PRAZO" | "FORA_DO_PRAZO"
  
  // Campos condicionais quando condicao_prazo = "FORA_DO_PRAZO"
  motivo_atraso?: string;
  detalhe_pendencias?: string; // Detalhes/evidências do atraso
  
  // Condição da Quantidade - Ordem de Fornecimento
  condicao_quantidade?: TrpCondicaoQuantidade; // "TOTAL" | "PARCIAL"
  comentarios_quantidade_ordem?: string; // Obrigatório quando PARCIAL
  
  // Condição da Quantidade - Nota Fiscal (NOVO)
  condicao_quantidade_nf?: TrpCondicaoQuantidade; // "TOTAL" | "PARCIAL"
  comentarios_quantidade_nf?: string; // Obrigatório quando PARCIAL
  
  // Observações do recebimento
  observacoes_recebimento?: string;
  
  // Assinaturas (NOVO)
  fiscal_contrato_nome?: string; // Obrigatório
  data_assinatura?: string; // DD/MM/AAAA ou YYYY-MM-DD - Obrigatório
  area_demandante_nome?: string; // Opcional
  
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


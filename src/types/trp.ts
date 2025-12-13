export type CondicaoPrazo = 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'NAO_SE_APLICA';

export type CondicaoQuantidade = 'TOTAL' | 'PARCIAL';

export type TipoBasePrazo = 'NF' | 'SERVICO';

export interface DadosRecebimentoPayload {
  // Novo campo obrigatório
  tipoContratacao?: string; // "BENS" | "SERVIÇOS" | "OBRA" - será enviado como contrato.tipo_contratacao
  
  dataRecebimento: string; // DD/MM/AAAA
  tipoBasePrazo: TipoBasePrazo;
  condicaoPrazo: CondicaoPrazo;
  condicaoQuantidade: CondicaoQuantidade;
  
  // Campo condicional (só quando tipoContratacao == "SERVIÇOS")
  competenciaMesAno?: string; // MM/AAAA - será enviado como recebimento.competencia_mes_ano
  
  dataPrevistaEntregaContrato?: string; // DD/MM/AAAA ou vazio
  dataEntregaReal?: string; // DD/MM/AAAA ou vazio
  motivoAtraso?: string;
  detalhePendencias?: string;
  observacoesRecebimento?: string;
}

export interface TrpApiResponse {
  documento_markdown_final: string;
  documento_markdown_prime: string;
  campos_trp_normalizados: {
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
  };
  meta: {
    fileName: string | null;
    hash_tdr: string | null;
  };
}


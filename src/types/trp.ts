export type CondicaoPrazo = 'NO_PRAZO' | 'FORA_DO_PRAZO';

export type CondicaoQuantidade = 'TOTAL' | 'PARCIAL';

export type TipoBasePrazo = 'DATA_RECEBIMENTO' | 'SERVICO';

export interface DadosRecebimentoPayload {
  // Campo obrigatório
  tipoContratacao: string; // "BENS" | "SERVIÇOS" | "OBRA"
  
  // Campo condicional (só quando tipoContratacao == "SERVIÇOS")
  competenciaMesAno?: string; // MM/AAAA
  
  // Base para contagem de prazo
  tipoBasePrazo: TipoBasePrazo;
  
  // Data de recebimento (quando base = DATA_RECEBIMENTO)
  dataRecebimento?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Data de conclusão do serviço (quando base = SERVICO)
  dataConclusaoServico?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Datas de entrega
  dataPrevistaEntregaContrato?: string; // DD/MM/AAAA ou YYYY-MM-DD
  dataEntregaReal?: string; // DD/MM/AAAA ou YYYY-MM-DD
  
  // Condição do Prazo
  condicaoPrazo: CondicaoPrazo;
  
  // Campos condicionais quando condicaoPrazo = "FORA_DO_PRAZO"
  motivoAtraso?: string;
  
  // Condição da Quantidade - Ordem de Fornecimento
  condicaoQuantidadeOrdem: CondicaoQuantidade;
  comentariosQuantidadeOrdem?: string; // Obrigatório quando PARCIAL
  
  
  // Observações do recebimento
  observacoesRecebimento?: string;
  
  // Nota: Assinaturas (fiscalContratoNome, dataAssinatura, areaDemandanteNome) 
  // serão preenchidas automaticamente pelo sistema a partir dos documentos
}

export interface TrpApiResponse {
  documento_markdown: string;
  campos: {
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


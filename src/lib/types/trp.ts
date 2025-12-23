// src/lib/types/trp.ts

export type TrpStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type TrpCondicaoPrazo = "NO_PRAZO" | "FORA_DO_PRAZO";
export type TrpCondicaoQuantidade = "TOTAL" | "PARCIAL";
export type TrpTipoBasePrazo = "DATA_RECEBIMENTO" | "SERVICO";
export type TrpTipoContrato = "BENS" | "SERVIÇOS" | "OBRA";

// Livre por enquanto (não travar o fiscal)
export type TrpUnidadeMedida = string;

/**
 * =========================
 * UI (Form)
 * =========================
 * O fiscal digita valor_unitario como string (ex: "12,50").
 * O total do item pode ser calculado no front.
 */
export interface TrpItemObjeto {
  descricao: string;
  unidade_medida: TrpUnidadeMedida;

  // No teu fluxo/validação você trata como obrigatório (> 0)
  quantidade_recebida: number;

  // string digitável "12,50"
  valor_unitario: string;

  // calculado no front (quantidade * valor_unitario_num)
  valor_total_calculado?: number;
}

/**
 * =========================
 * Payload (Backend)
 * =========================
 * Modelo OFICIAL para envio ao backend (n8n/Supabase-first).
 * - raw: exatamente o que o fiscal digitou
 * - num: normalizado para number (ex: 12.5)
 * - total: qtd * num
 */
export interface TrpItemObjetoPayload {
  descricao: string;
  unidade_medida: TrpUnidadeMedida;
  quantidade_recebida: number;

  valor_unitario_raw: string;
  valor_unitario_num: number;

  valor_total_calculado: number;
}

export interface TrpInputForm {
  tipo_contratacao?: TrpTipoContrato;

  // serviços
  competencia_mes_ano?: string; // MM/AAAA

  // base prazo
  tipo_base_prazo?: TrpTipoBasePrazo;
  data_recebimento?: string; // DD/MM/AAAA ou ISO
  data_conclusao_servico?: string; // DD/MM/AAAA ou ISO

  // prazo
  condicao_prazo?: TrpCondicaoPrazo;
  motivo_atraso?: string;
  data_prevista_entrega_contrato?: string;
  data_entrega_real?: string;

  // quantidade (ordem)
  condicao_quantidade_ordem?: TrpCondicaoQuantidade;
  comentarios_quantidade_ordem?: string;

  // ✅ NOVO: itens (1+)
  itens_objeto: TrpItemObjeto[];

  // total geral (opcional)
  valor_total_geral?: number;

  // observações
  observacoes_recebimento?: string;

  // assinaturas (você pode obrigar no validateForm)
  fiscal_contrato_nome?: string;
  data_assinatura?: string;
  area_demandante_nome?: string;

  // auxiliar upload
  arquivoTdrNome?: string;
}

/**
 * Payload consolidado que vai no FormData (dadosRecebimento)
 * ✅ você consegue tipar o generateTrp sem usar "any"
 */
export interface DadosRecebimentoPayload {
  tipoContratacao: TrpTipoContrato;

  // ✅ oficial
  itens_objeto: TrpItemObjetoPayload[];

  // ✅ total geral dos itens
  valor_total_geral?: number | null;

  // serviços
  competenciaMesAno?: string | null; // MM/AAAA

  // base prazo
  tipoBasePrazo: TrpTipoBasePrazo;
  dataRecebimento?: string | null;
  dataConclusaoServico?: string | null;

  // datas extras (se necessário)
  dataPrevistaEntregaContrato?: string | null;
  dataEntregaReal?: string | null;

  // prazo
  condicaoPrazo: TrpCondicaoPrazo;
  motivoAtraso?: string | null;

  // quantidade (ordem)
  condicaoQuantidadeOrdem: TrpCondicaoQuantidade;
  comentariosQuantidadeOrdem?: string | null;

  // observações
  observacoesRecebimento?: string | null;

  /**
   * ⚠️ LEGADO (compatibilidade) — manter enquanto o backend ainda aceita/gera isso
   * No novo fluxo, NÃO usar como fonte principal.
   */
  objetoFornecido?: string | null;
  unidade_medida?: string | null;
  quantidade_recebida?: number | null;
  valor_unitario?: number | null;
  valor_total_calculado?: number | null;
}

/**
 * ✅ Compatível com o TrpResultPage:
 * ele cria meta.fileName + meta.hash_tdr
 */
export interface TrpMeta {
  fileName: string;
  hash_tdr: string;
}

/**
 * ⚠️ "campos" aqui é o viewModel que você monta no front.
 * Como você ainda está mudando o formato no backend,
 * manter Record<string, any> evita quebrar componente enquanto estabiliza.
 */
export interface TrpAgentOutput {
  documento_markdown: string;
  campos: Record<string, any>;
  meta: TrpMeta;
}

/**
 * Run "do front" (se você usa em algum lugar). O backend tem outro shape (TrpRunData).
 */
export interface TrpRun {
  id: string;
  createdAt: string;
  status: TrpStatus;
  input: TrpInputForm;
  output?: TrpAgentOutput;
  errorMessage?: string;
}

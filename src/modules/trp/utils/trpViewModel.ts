/**
 * ViewModel para TRP
 * Combina dados de múltiplas fontes para criar uma única fonte de verdade para a UI
 *
 * Fontes:
 * - documento_markdown_final: texto do documento gerado pelo n8n
 * - campos_trp_normalizados: campos estruturados normalizados
 * - contexto_recebimento_raw: dados brutos do contexto de recebimento (quando disponível)
 */

import { TrpCamposNormalizados } from '../../../lib/types/trp';
import { normalizeTrpValue } from './formatTrpValues';

export interface TrpRunData {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  documento_markdown_final?: string;
  documento_markdown?: string;
  campos_trp_normalizados?: Record<string, unknown>;
  // ✅ compat: alguns lugares ainda podem enviar isso
  campos_trp?: Record<string, unknown>;
  campos?: Record<string, unknown>;
  contexto_recebimento_raw?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrpViewModel {
  documento_markdown: string;

  // ✅ já sai pronto pra UI (sem FORA_DO_PRAZO / NAO_DECLARADO)
  campos: TrpCamposNormalizados & Record<string, unknown>;

  runId: string;
  createdAt?: string;
  status: string;
}

/**
 * Regras de exibição:
 * - Não exibir NAO_DECLARADO / Não informado / vazio
 * - Não exibir placeholders técnicos (NO_PRAZO, FORA_DO_PRAZO, etc.) sem normalização
 */
const HIDDEN_VALUES = new Set([
  'NAO_DECLARADO',
  'NÃO_DECLARADO',
  'NAO INFORMADO',
  'NÃO INFORMADO',
  'NAO_INFORMADO',
  'NÃO_INFORMADO',
  'Não informado',
  'Nao informado',
  'N/A',
]);

function isMeaningfulValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return false;
    if (HIDDEN_VALUES.has(s)) return false;
    return true;
  }

  if (typeof v === 'number' || typeof v === 'boolean') return true;

  if (Array.isArray(v)) return v.length > 0;

  if (typeof v === 'object') {
    return Object.keys(v as Record<string, unknown>).length > 0;
  }

  return true;
}

/**
 * Normaliza um valor cru para algo seguro de exibir na UI.
 * - strings passam por normalizeTrpValue (converte FORA_DO_PRAZO etc.)
 * - mantém números/booleanos
 */
function normalizeUiValue(fieldName: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;

  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return '';
    // ⚠️ aqui é o ponto-chave: converte enums técnicos em texto legível
    return normalizeTrpValue(s, fieldName);
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;

  return value;
}

/**
 * Extrai informações de assinatura do markdown
 * (mantido por compatibilidade, mas não cria campos "Não declarados")
 */
function extractSignaturesFromMarkdown(markdown: string): {
  fiscal_contrato_nome?: string | null;
  area_demandante_nome?: string | null;
  data_assinatura?: string | null;
} {
  const result: {
    fiscal_contrato_nome?: string | null;
    area_demandante_nome?: string | null;
    data_assinatura?: string | null;
  } = {};

  if (!markdown) return result;

  const fiscalMatch = markdown.match(/(?:Fiscal do Contrato|Fiscal)[:\s]*([^\n]+)/i);
  if (fiscalMatch && fiscalMatch[1]) result.fiscal_contrato_nome = fiscalMatch[1].trim();

  const areaMatch = markdown.match(/(?:Área Demandante|Área)[:\s]*([^\n]+)/i);
  if (areaMatch && areaMatch[1]) result.area_demandante_nome = areaMatch[1].trim();

  const dataMatch = markdown.match(/(?:Data de Assinatura|Data)[:\s]*([^\n]+)/i);
  if (dataMatch && dataMatch[1]) result.data_assinatura = dataMatch[1].trim();

  return result;
}

/**
 * Cria um viewModel único a partir dos dados do run
 * ✅ DINÂMICO: mapeia automaticamente todos os campos do backend
 * ✅ Filtra valores não declarados
 * ✅ Normaliza valores técnicos (FORA_DO_PRAZO, NO_PRAZO, etc.) ANTES da UI
 */
export function createTrpViewModel(run: TrpRunData): TrpViewModel {
  const documento_markdown = run.documento_markdown_final ?? run.documento_markdown ?? '';

  const camposRaw = (run.campos_trp_normalizados ?? run.campos_trp ?? run.campos ?? {}) as Record<string, unknown>;
  const contextoRaw = (run.contexto_recebimento_raw || {}) as Record<string, unknown>;

  const signaturesFromMarkdown = extractSignaturesFromMarkdown(documento_markdown);

  const allFields: Record<string, unknown> = {};

  // 1) camposRaw (entra normalizado)
  for (const [key, value] of Object.entries(camposRaw)) {
    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) {
      allFields[key] = normalized;
    }
  }

  // 2) contextoRaw (sobrescreve, entra normalizado)
  for (const [key, value] of Object.entries(contextoRaw)) {
    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) {
      allFields[key] = normalized;
    }
  }

  // 3) Assinaturas: prioridade markdown (só entra se houver valor)
  if (isMeaningfulValue(signaturesFromMarkdown.fiscal_contrato_nome)) {
    allFields.fiscal_contrato_nome = String(signaturesFromMarkdown.fiscal_contrato_nome);
  }
  if (isMeaningfulValue(signaturesFromMarkdown.area_demandante_nome)) {
    allFields.area_demandante_nome = String(signaturesFromMarkdown.area_demandante_nome);
  }
  if (isMeaningfulValue(signaturesFromMarkdown.data_assinatura)) {
    allFields.data_assinatura = String(signaturesFromMarkdown.data_assinatura);
  }

  const campos = allFields as TrpViewModel['campos'];

  return {
    documento_markdown,
    campos,
    runId: run.runId,
    createdAt: run.createdAt,
    status: run.status,
  };
}

/**
 * Lista de campos para UI (cards/resumo/sidebar)
 * ✅ não cria "Não informado"
 * ✅ só retorna campos declarados
 */
export function getTrpDisplayFields(viewModel: TrpViewModel): Array<{
  fieldName: string;
  label: string;
  value: string;
  shouldDisplay: boolean;
}> {
  const { campos } = viewModel;

  const fields: Array<{
    fieldName: string;
    label: string;
    value: string;
    shouldDisplay: boolean;
  }> = [];

  const toDisplayString = (fieldName: string, value: unknown): string => {
    const normalized = normalizeUiValue(fieldName, value);
    if (!isMeaningfulValue(normalized)) return '';
    if (typeof normalized === 'string') return normalized;
    return String(normalized);
  };

  const addField = (fieldName: string, label: string, value: unknown) => {
    const displayValue = toDisplayString(fieldName, value);
    fields.push({
      fieldName,
      label,
      value: displayValue,
      shouldDisplay: isMeaningfulValue(displayValue),
    });
  };

  // Identificação
  addField('numero_contrato', 'Número do Contrato', campos.numero_contrato);
  addField('processo_licitatorio', 'Processo Licitatório', campos.processo_licitatorio);
  addField('contratada', 'Contratada', campos.contratada);
  addField('cnpj', 'CNPJ', campos.cnpj);
  addField('vigencia', 'Vigência', campos.vigencia);
  addField('tipo_contrato', 'Tipo de Contrato', campos.tipo_contrato);
  addField('objeto_contrato', 'Objeto do Contrato', campos.objeto_contrato);

  // Regime de Fornecimento
  addField('regime_fornecimento', 'Regime de Fornecimento', campos.regime_fornecimento);
  addField('competencia_mes_ano', 'Competência (Mês/Ano)', campos.competencia_mes_ano);

  // Documento Fiscal
  addField('numero_nf', 'Número da NF', campos.numero_nf);
  addField('vencimento_nf', 'Vencimento da NF', campos.vencimento_nf);
  addField('numero_empenho', 'Número do Empenho', campos.numero_empenho);
  addField('valor_efetivo_formatado', 'Valor Efetivo', campos.valor_efetivo_formatado ?? campos.valor_efetivo_numero);

  // Condições de Recebimento
  addField('tipo_base_prazo', 'Base para contagem de prazo', campos.tipo_base_prazo);
  addField('data_recebimento', 'Data de Recebimento', campos.data_recebimento);
  addField('data_entrega', 'Data da Entrega', campos.data_entrega);
  addField('condicao_prazo', 'Condição do Prazo', campos.condicao_prazo);
  addField('condicao_quantidade', 'Condição da Quantidade', campos.condicao_quantidade);
  addField('motivo_atraso', 'Motivo do Atraso', campos.motivo_atraso);
  addField('comentarios_quantidade_ordem', 'Comentários sobre Quantidade (Ordem)', campos.comentarios_quantidade_ordem);
  addField('comentarios_quantidade_nf', 'Comentários sobre Quantidade (NF)', campos.comentarios_quantidade_nf);

  // Observações
  addField('observacoes', 'Observações', campos.observacoes);
  addField('observacoes_recebimento', 'Observações do Recebimento', campos.observacoes_recebimento);

  // Assinaturas
  addField('fiscal_contrato_nome', 'Fiscal do Contrato', (campos as any).fiscal_contrato_nome);
  addField('data_assinatura', 'Data', (campos as any).data_assinatura);

  return fields.filter((f) => f.shouldDisplay);
}

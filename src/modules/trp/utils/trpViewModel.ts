// src/.../utils/trpViewModel.ts

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

  // ✅ já sai pronto pra UI
  campos: TrpCamposNormalizados & Record<string, unknown>;

  runId: string;
  createdAt?: string;
  status: string;
}

/**
 * Regras de exibição:
 * - Não exibir NAO_DECLARADO / Não informado / vazio
 * - Não exibir placeholders técnicos sem normalização
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
 * - strings passam por normalizeTrpValue (converte enums e formata números/moeda quando aplicável)
 * - numbers/booleans também passam por normalizeTrpValue (pra formatar moeda/quantidade)
 * - objetos/arrays mantêm como vieram (mas filtramos chaves estruturais)
 */
function normalizeUiValue(fieldName: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;

  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return '';
    return normalizeTrpValue(s, fieldName);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    // ✅ garante formatação BRL/quantidade via normalizeTrpValue
    return normalizeTrpValue(String(value), fieldName);
  }

  return value;
}

/**
 * Extrai informações de assinatura do markdown
 * (mantido por compatibilidade, mas não cria campos "Não declarados")
 */
function extractSignaturesFromMarkdown(markdown: string): {
  fiscal_contrato_nome?: string | null;
  data_assinatura?: string | null;
} {
  const result: {
    fiscal_contrato_nome?: string | null;
    data_assinatura?: string | null;
  } = {};

  if (!markdown) return result;

  const fiscalMatch = markdown.match(/(?:Fiscal do Contrato|Fiscal)[:\s]*([^\n]+)/i);
  if (fiscalMatch && fiscalMatch[1]) result.fiscal_contrato_nome = fiscalMatch[1].trim();

  const dataMatch = markdown.match(/(?:Data de Assinatura|Data)[:\s]*([^\n]+)/i);
  if (dataMatch && dataMatch[1]) result.data_assinatura = dataMatch[1].trim();

  return result;
}

/**
 * ✅ chaves estruturais que não devem ir para UI como texto
 * (evita OUTROS feio com JSON)
 */
const STRUCTURAL_KEYS = new Set([
  'prazos_calculados',
  'prazos',
  'prazos_calculados_raw',
]);

/**
 * ✅ NOVO (OFICIAL): campos que nunca podem sumir se existirem no payload
 * - itens_objeto: lista de itens
 * - valor_total_itens: total somado dos itens
 *
 * (mantemos também os campos legados como fallback)
 */
const ALWAYS_KEEP_FIELDS = [
  // novo oficial
  'itens_objeto',
  'valor_total_itens',

  // legado (fallback)
  'objeto_fornecido',
  'unidade_medida',
  'quantidade_recebida',
  'valor_unitario',
  'valor_total_calculado',
] as const;

type AnyObj = Record<string, any>;

function isItensObjetoArray(v: unknown): v is Array<Record<string, unknown>> {
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return false;
  // aceita objetos “soltos”, mas tenta validar o shape mínimo
  const first = v[0];
  return typeof first === 'object' && first !== null;
}

/**
 * Tenta extrair itens_objeto e normalizar o total somado.
 * - Se itens_objeto existir: calcula valor_total_itens de forma robusta.
 * - Se não existir: retorna null.
 */
function computeItensAndTotal(allFields: AnyObj): {
  itens_objeto?: Array<Record<string, unknown>>;
  valor_total_itens?: number;
} {
  const rawItens = allFields.itens_objeto;

  if (!isItensObjetoArray(rawItens)) return {};

  let total = 0;

  for (const it of rawItens) {
    // prioridade: valor_total_calculado do item
    const vtc = (it as any).valor_total_calculado;
    if (typeof vtc === 'number' && Number.isFinite(vtc)) {
      total += vtc;
      continue;
    }

    // fallback: quantidade * valor_unitario (se vierem numéricos)
    const q = (it as any).quantidade_recebida;
    const vu = (it as any).valor_unitario;

    if (typeof q === 'number' && Number.isFinite(q) && typeof vu === 'number' && Number.isFinite(vu)) {
      total += q * vu;
      continue;
    }

    // fallback 2: se valor_unitario vier string (digitável), tenta parse básico BR
    if (typeof q === 'number' && Number.isFinite(q) && typeof vu === 'string') {
      const cleaned = vu.replace(/[^\d.,]/g, '');
      const parsed = cleaned.includes(',')
        ? Number(cleaned.replace(/\./g, '').replace(',', '.'))
        : Number(cleaned);

      if (Number.isFinite(parsed)) {
        total += q * parsed;
      }
    }
  }

  const totalRounded = Number.isFinite(total) ? Number(total.toFixed(2)) : 0;

  return {
    itens_objeto: rawItens,
    valor_total_itens: totalRounded,
  };
}

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Formata itens_objeto para exibição em um campo único (texto).
 * Isso evita ter que mudar UI agora: SummaryCards/StructuredPanel continuam.
 */
function formatItensObjetoForDisplay(itens: Array<Record<string, unknown>>): string {
  const lines: string[] = [];

  itens.forEach((it, idx) => {
    const desc = String((it as any).descricao ?? '').trim();
    const un = String((it as any).unidade_medida ?? '').trim();
    const q = (it as any).quantidade_recebida;
    const vu = (it as any).valor_unitario;
    const vt = (it as any).valor_total_calculado;

    const parts: string[] = [];

    if (desc) parts.push(desc);

    const qStr = typeof q === 'number' && Number.isFinite(q) ? String(q) : '';
    const unStr = un ? un : '';
    if (qStr || unStr) parts.push(`${qStr}${unStr ? ` ${unStr}` : ''}`.trim());

    if (typeof vu === 'number' && Number.isFinite(vu)) parts.push(`Unit: ${formatBRL(vu)}`);
    else if (typeof vu === 'string' && vu.trim()) parts.push(`Unit: R$ ${vu.trim()}`);

    if (typeof vt === 'number' && Number.isFinite(vt)) parts.push(`Total: ${formatBRL(vt)}`);

    const line = parts.length ? `${idx + 1}) ${parts.join(' — ')}` : `${idx + 1}) Item`;
    lines.push(line);
  });

  return lines.join('\n');
}

/**
 * Cria um viewModel único a partir dos dados do run
 * ✅ DINÂMICO: mapeia automaticamente todos os campos do backend
 * ✅ Filtra valores não declarados
 * ✅ Normaliza valores técnicos (FORA_DO_PRAZO, NO_PRAZO, etc.) ANTES da UI
 * ✅ NOVO: suporta itens_objeto[] + valor_total_itens
 */
export function createTrpViewModel(run: TrpRunData): TrpViewModel {
  const documento_markdown = run.documento_markdown_final ?? run.documento_markdown ?? '';

  // ✅ prioridade correta
  const camposRaw = (run.campos_trp_normalizados ?? run.campos_trp ?? run.campos ?? {}) as Record<string, unknown>;
  const contextoRaw = (run.contexto_recebimento_raw || {}) as Record<string, unknown>;

  const signaturesFromMarkdown = extractSignaturesFromMarkdown(documento_markdown);

  const allFields: Record<string, unknown> = {};

  // 1) camposRaw (entra normalizado)
  for (const [key, value] of Object.entries(camposRaw)) {
    if (STRUCTURAL_KEYS.has(key)) continue;

    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) {
      allFields[key] = normalized;
    }
  }

  // 2) contextoRaw (sobrescreve, entra normalizado)
  for (const [key, value] of Object.entries(contextoRaw)) {
    if (STRUCTURAL_KEYS.has(key)) continue;

    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) {
      allFields[key] = normalized;
    }
  }

  // ✅ 3) Blindagem (não deixa sumir nunca se existir no payload)
  for (const key of ALWAYS_KEEP_FIELDS) {
    if (STRUCTURAL_KEYS.has(key)) continue;

    if (Object.prototype.hasOwnProperty.call(camposRaw, key)) {
      const normalized = normalizeUiValue(key, (camposRaw as AnyObj)[key]);
      if (normalized !== undefined && normalized !== null) {
        allFields[key] = normalized;
      }
    } else if (Object.prototype.hasOwnProperty.call(contextoRaw, key)) {
      const normalized = normalizeUiValue(key, (contextoRaw as AnyObj)[key]);
      if (normalized !== undefined && normalized !== null) {
        allFields[key] = normalized;
      }
    }
  }

  // ✅ 4) Se existir itens_objeto, calcula total e injeta (fonte oficial)
  const computed = computeItensAndTotal(allFields as AnyObj);

  if (computed.itens_objeto && computed.itens_objeto.length > 0) {
    (allFields as AnyObj).itens_objeto = computed.itens_objeto;

    // Se backend já trouxe valor_total_itens e for number, respeita; senão usa o calculado
    const rawTotal = (allFields as AnyObj).valor_total_itens;
    const total =
      typeof rawTotal === 'number' && Number.isFinite(rawTotal) ? rawTotal : computed.valor_total_itens ?? 0;

    (allFields as AnyObj).valor_total_itens = total;

    // ✅ opcional: reforça valor_efetivo_* com o total oficial dos itens
    // (mantém compatibilidade: UI já usa valor_efetivo_formatado/numero)
    if (!(allFields as AnyObj).valor_efetivo_numero) {
      (allFields as AnyObj).valor_efetivo_numero = total;
    }
    if (!(allFields as AnyObj).valor_efetivo_formatado) {
      (allFields as AnyObj).valor_efetivo_formatado = formatBRL(total);
    }
  }

  // 5) Assinaturas: prioridade markdown (só entra se houver valor)
  if (isMeaningfulValue(signaturesFromMarkdown.fiscal_contrato_nome)) {
    (allFields as AnyObj).fiscal_contrato_nome = String(signaturesFromMarkdown.fiscal_contrato_nome);
  }
  if (isMeaningfulValue(signaturesFromMarkdown.data_assinatura)) {
    (allFields as AnyObj).data_assinatura = String(signaturesFromMarkdown.data_assinatura);
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
 * ✅ NOVO: se existir itens_objeto, exibe a lista e o total
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
  addField('numero_contrato', 'Número do Contrato', (campos as any).numero_contrato);
  addField('processo_licitatorio', 'Processo Licitatório', (campos as any).processo_licitatorio);
  addField('contratada', 'Contratada', (campos as any).contratada);
  addField('cnpj', 'CNPJ', (campos as any).cnpj);
  addField('vigencia', 'Vigência', (campos as any).vigencia);
  addField('tipo_contrato', 'Tipo de Contrato', (campos as any).tipo_contrato);
  addField('numero_ordem_compra', 'Ordem de Compra', (campos as any).numero_ordem_compra);
  addField('objeto_contrato', 'Objeto do Contrato', (campos as any).objeto_contrato);
  addField('competencia_mes_ano', 'Competência (Mês/Ano)', (campos as any).competencia_mes_ano);

  // ✅ NOVO (OFICIAL): Itens do objeto
  const itens = (campos as any).itens_objeto;
  if (Array.isArray(itens) && itens.length > 0) {
    addField('itens_objeto', 'Itens fornecidos / serviços prestados', formatItensObjetoForDisplay(itens));
    addField('valor_total_itens', 'Total dos itens', (campos as any).valor_total_itens ?? (campos as any).valor_efetivo_formatado);
  } else {
    // ⚠️ LEGADO (fallback): um item “único”
    addField('objeto_fornecido', 'Fornecimento(s) ou Serviço(s) Prestado(s)', (campos as any).objeto_fornecido);
    addField('unidade_medida', 'Unidade de Medida', (campos as any).unidade_medida);
    addField('quantidade_recebida', 'Quantidade Recebida', (campos as any).quantidade_recebida);
    addField('valor_unitario', 'Valor Unitário', (campos as any).valor_unitario);
    addField('valor_total_calculado', 'Valor Total', (campos as any).valor_total_calculado);
  }

  // Documento Fiscal
  addField('numero_nf', 'Número da NF', (campos as any).numero_nf);
  addField('vencimento_nf', 'Vencimento da NF', (campos as any).vencimento_nf);
  addField('numero_empenho', 'Número do Empenho', (campos as any).numero_empenho);

  // valor efetivo: tenta formatado/numero, senão usa o string "valor_efetivo" do PRIME
  addField(
    'valor_efetivo',
    'Valor Efetivo',
    (campos as any).valor_efetivo_formatado ??
      (campos as any).valor_efetivo_numero ??
      (campos as any).valor_efetivo
  );

  // Condições de Recebimento
  addField('tipo_base_prazo', 'Base para contagem de prazo', (campos as any).tipo_base_prazo);
  addField('data_recebimento', 'Data de Recebimento', (campos as any).data_recebimento);
  addField('data_entrega', 'Data Base (Entrega)', (campos as any).data_entrega);
  addField('data_conclusao_servico', 'Data de Conclusão do Serviço', (campos as any).data_conclusao_servico);
  addField('data_prevista_entrega_contrato', 'Data Prevista em Contrato', (campos as any).data_prevista_entrega_contrato);
  addField('data_entrega_real', 'Data de Entrega Real', (campos as any).data_entrega_real);

  addField('condicao_prazo', 'Condição do Prazo', (campos as any).condicao_prazo);
  addField('condicao_quantidade_ordem', 'Condição da Quantidade (Ordem)', (campos as any).condicao_quantidade_ordem);

  // ⚠️ NF pode nem existir no fluxo novo, mas manter não quebra:
  addField('condicao_quantidade_nf', 'Condição da Quantidade (NF)', (campos as any).condicao_quantidade_nf);

  addField('motivo_atraso', 'Motivo do Atraso', (campos as any).motivo_atraso);
  addField('comentarios_quantidade_ordem', 'Comentários (Ordem)', (campos as any).comentarios_quantidade_ordem);
  addField('comentarios_quantidade_nf', 'Comentários (NF)', (campos as any).comentarios_quantidade_nf);

  // Observações
  addField('observacoes', 'Observações', (campos as any).observacoes);
  addField('observacoes_recebimento', 'Observações do Recebimento', (campos as any).observacoes_recebimento);

  // Assinaturas
  addField('fiscal_contrato_nome', 'Fiscal do Contrato', (campos as any).fiscal_contrato_nome);
  addField('data_assinatura', 'Data', (campos as any).data_assinatura);

  return fields.filter((f) => f.shouldDisplay);
}

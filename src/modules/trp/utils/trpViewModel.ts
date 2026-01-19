// src/.../utils/trpViewModel.ts

/**
 * ViewModel para TRP
 * Combina dados de múltiplas fontes para criar uma única fonte de verdade para a UI
 *
 * ✅ AJUSTE (mínimo e correto):
 * - Fonte de verdade para campos da UI = campos_trp_normalizados (backend)
 * - contexto_recebimento_raw NÃO sobrescreve campos exibidos (evita inconsistência)
 *
 * ✅ AJUSTE PRINCIPAL (datas não redundantes):
 * - Se existir data_base_calculo OU regime_execucao_datas_exibicao (novo modelo),
 *   então a UI NÃO deve exibir as datas técnicas antigas (data_recebimento, data_entrega etc.)
 * - Se NÃO existir o novo modelo, mantém fallback para runs antigos.
 */

import { TrpCamposNormalizados } from "../../../lib/types/trp";
import type { TrpRunData as ApiTrpRunData } from "../../../services/api";

export type TrpRunData = ApiTrpRunData;

export interface TrpViewModel {
  documento_markdown: string;
  campos: TrpCamposNormalizados & Record<string, unknown>;
  runId: string;
  createdAt?: string;
  status: string;
}

/**
 * Regras de exibição:
 * - Não exibir NAO_DECLARADO / Não informado / vazio
 */
const HIDDEN_VALUES = new Set([
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "Não informado",
  "Nao informado",
  "N/A",
]);

function isMeaningfulValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return false;
    if (HIDDEN_VALUES.has(s)) return false;
    return true;
  }

  if (typeof v === "number" || typeof v === "boolean") return true;

  if (Array.isArray(v)) return v.length > 0;

  if (typeof v === "object") {
    return Object.keys(v as Record<string, unknown>).length > 0;
  }

  return true;
}

/**
 * Normaliza um valor cru para algo seguro de exibir na UI.
 */
function normalizeUiValue(_fieldName: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;

  const isEnumLike =
    typeof value === "string" && /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(value.trim());

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    if (isEnumLike) return s;
    return s;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return value;
}

/**
 * Extrai informações de assinatura do markdown (compat)
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

  const fiscalMatch = markdown.match(
    /(?:Fiscal do Contrato|Fiscal)[:\s]*([^\n]+)/i,
  );
  if (fiscalMatch?.[1]) result.fiscal_contrato_nome = fiscalMatch[1].trim();

  const dataMatch = markdown.match(
    /(?:Data de Assinatura|Data)[:\s]*([^\n]+)/i,
  );
  if (dataMatch?.[1]) result.data_assinatura = dataMatch[1].trim();

  return result;
}

/**
 * chaves estruturais que não devem ir para UI como texto
 */
const STRUCTURAL_KEYS = new Set([
  "prazos_calculados",
  "prazos",
  "prazos_calculados_raw",
]);

/**
 * Campos que nunca podem sumir se existirem no payload
 */
const ALWAYS_KEEP_FIELDS = [
  "itens_objeto",
  "valor_total_itens",
  "valor_total_geral",

  // legado (fallback)
  "objeto_fornecido",
  "unidade_medida",
  "quantidade_recebida",
  "valor_unitario",
  "valor_total_calculado",
] as const;

type AnyObj = Record<string, any>;

function isItensObjetoArray(v: unknown): v is Array<Record<string, unknown>> {
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return false;
  const first = v[0];
  return typeof first === "object" && first !== null;
}

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Normaliza valor para comparação (dedupe)
 */
function normKey(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Tenta extrair itens_objeto e normalizar o total somado.
 */
function computeItensAndTotal(allFields: AnyObj): {
  itens_objeto?: Array<Record<string, unknown>>;
  valor_total_itens?: number;
} {
  const rawItens = allFields.itens_objeto;

  if (!isItensObjetoArray(rawItens)) return {};

  let total = 0;

  for (const it of rawItens) {
    const vtc = (it as any).valor_total_calculado;
    if (typeof vtc === "number" && Number.isFinite(vtc)) {
      total += vtc;
      continue;
    }

    const q = (it as any).quantidade_recebida;

    const vuNum = (it as any).valor_unitario_num;
    const vuLegacy = (it as any).valor_unitario;

    if (
      typeof q === "number" &&
      Number.isFinite(q) &&
      typeof vuNum === "number" &&
      Number.isFinite(vuNum)
    ) {
      total += q * vuNum;
      continue;
    }

    if (
      typeof q === "number" &&
      Number.isFinite(q) &&
      typeof vuLegacy === "number" &&
      Number.isFinite(vuLegacy)
    ) {
      total += q * vuLegacy;
      continue;
    }

    if (
      typeof q === "number" &&
      Number.isFinite(q) &&
      typeof vuLegacy === "string"
    ) {
      const cleaned = vuLegacy.replace(/[^\d.,]/g, "");
      const parsed = cleaned.includes(",")
        ? Number(cleaned.replace(/\./g, "").replace(",", "."))
        : Number(cleaned);

      if (Number.isFinite(parsed)) total += q * parsed;
    }

    const vuRaw = (it as any).valor_unitario_raw;
    if (
      typeof q === "number" &&
      Number.isFinite(q) &&
      typeof vuRaw === "string"
    ) {
      const cleaned = vuRaw.replace(/[^\d.,]/g, "");
      const parsed = cleaned.includes(",")
        ? Number(cleaned.replace(/\./g, "").replace(",", "."))
        : Number(cleaned);
      if (Number.isFinite(parsed)) total += q * parsed;
    }
  }

  const totalRounded = Number.isFinite(total) ? Number(total.toFixed(2)) : 0;

  return {
    itens_objeto: rawItens,
    valor_total_itens: totalRounded,
  };
}

function formatItensObjetoForDisplay(
  itens: Array<Record<string, unknown>>,
): string {
  const lines: string[] = [];

  itens.forEach((it, idx) => {
    const desc = String((it as any).descricao ?? "").trim();
    const un = String((it as any).unidade_medida ?? "").trim();
    const q = (it as any).quantidade_recebida;

    const vuNum = (it as any).valor_unitario_num;
    const vuRaw = (it as any).valor_unitario_raw;
    const vuLegacy = (it as any).valor_unitario;

    const vt = (it as any).valor_total_calculado;

    const parts: string[] = [];

    if (desc) parts.push(desc);

    const qStr = typeof q === "number" && Number.isFinite(q) ? String(q) : "";
    const unStr = un ? un : "";
    if (qStr || unStr) parts.push(`${qStr}${unStr ? ` ${unStr}` : ""}`.trim());

    if (typeof vuNum === "number" && Number.isFinite(vuNum)) {
      parts.push(`Unit: ${formatBRL(vuNum)}`);
    } else if (typeof vuRaw === "string" && vuRaw.trim()) {
      parts.push(`Unit: R$ ${vuRaw.trim()}`);
    } else if (typeof vuLegacy === "number" && Number.isFinite(vuLegacy)) {
      parts.push(`Unit: ${formatBRL(vuLegacy)}`);
    } else if (typeof vuLegacy === "string" && vuLegacy.trim()) {
      parts.push(`Unit: R$ ${vuLegacy.trim()}`);
    }

    if (typeof vt === "number" && Number.isFinite(vt)) {
      parts.push(`Total: ${formatBRL(vt)}`);
    }

    const line = parts.length
      ? `${idx + 1}) ${parts.join(" — ")}`
      : `${idx + 1}) Item`;
    lines.push(line);
  });

  return lines.join("\n");
}

export function createTrpViewModel(run: TrpRunData): TrpViewModel {
  const documento_markdown =
    run.documento_markdown_final ??
    (run as any).documento_markdown_prime ??
    run.documento_markdown ??
    "";

  const camposRaw = (run.campos_trp_normalizados ??
    (run as any).campos_trp ??
    (run as any).campos ??
    {}) as Record<string, unknown>;

  const signaturesFromMarkdown =
    extractSignaturesFromMarkdown(documento_markdown);

  const allFields: Record<string, unknown> = {};

  // 1) camposRaw (UI source of truth)
  for (const [key, value] of Object.entries(camposRaw)) {
    if (STRUCTURAL_KEYS.has(key)) continue;

    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) allFields[key] = normalized;
  }

  // 2) Blindagem: não deixa sumir se existir no payload (somente camposRaw)
  for (const key of ALWAYS_KEEP_FIELDS) {
    if (STRUCTURAL_KEYS.has(key)) continue;

    if (Object.prototype.hasOwnProperty.call(camposRaw, key)) {
      (allFields as AnyObj)[key] = (camposRaw as AnyObj)[key];
    }
  }

  // 3) Itens + total
  const computed = computeItensAndTotal(allFields as AnyObj);

  if (computed.itens_objeto && computed.itens_objeto.length > 0) {
    (allFields as AnyObj).itens_objeto = computed.itens_objeto;

    const rawTotal = (allFields as AnyObj).valor_total_itens;
    const total =
      typeof rawTotal === "number" && Number.isFinite(rawTotal)
        ? rawTotal
        : (computed.valor_total_itens ?? 0);

    (allFields as AnyObj).valor_total_itens = total;

    // compat
    if ((allFields as AnyObj).valor_efetivo_numero == null) {
      (allFields as AnyObj).valor_efetivo_numero = total;
    }
    if ((allFields as AnyObj).valor_efetivo_formatado == null) {
      (allFields as AnyObj).valor_efetivo_formatado = formatBRL(total);
    }
  }

  // 4) limpeza final
  for (const [key, value] of Object.entries(allFields)) {
    if (STRUCTURAL_KEYS.has(key)) continue;
    if (key === "itens_objeto") continue;

    const normalized = normalizeUiValue(key, value);
    if (isMeaningfulValue(normalized)) allFields[key] = normalized;
    else delete (allFields as AnyObj)[key];
  }

  // 5) assinaturas
  if (isMeaningfulValue(signaturesFromMarkdown.fiscal_contrato_nome)) {
    (allFields as AnyObj).fiscal_contrato_nome = String(
      signaturesFromMarkdown.fiscal_contrato_nome,
    );
  }
  if (isMeaningfulValue(signaturesFromMarkdown.data_assinatura)) {
    (allFields as AnyObj).data_assinatura = String(
      signaturesFromMarkdown.data_assinatura,
    );
  }

  return {
    documento_markdown,
    campos: allFields as TrpViewModel["campos"],
    runId: run.runId,
    createdAt: run.createdAt,
    status: run.status,
  };
}

function pick(campos: AnyObj, keys: string[]): unknown {
  for (const k of keys) {
    if (campos?.[k] !== undefined && campos?.[k] !== null) return campos[k];
  }
  return undefined;
}

/**
 * ✅ Normaliza e DEDUPLICA a lista de datas consideradas no cálculo.
 * - Remove entrada cuja value seja igual à data_base_calculo
 * - Remove labels genéricos "Data-base do cálculo" / "Data base do cálculo"
 * - Dedup por value
 */
function sanitizeDatasExibicao(
  value: unknown,
  baseValue: unknown,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(value) || value.length === 0) return [];

  const baseKey = normKey(baseValue);
  const seenValue = new Set<string>();
  const out: Array<{ label: string; value: string }> = [];

  for (const it of value as any[]) {
    if (!it || typeof it !== "object") continue;

    const label = String((it as any).label ?? "").trim();
    const val = String((it as any).value ?? "").trim();
    if (!label || !val) continue;

    const valKey = normKey(val);
    if (baseKey && valKey === baseKey) continue;

    const labelKey = normKey(label);
    if (labelKey === normKey("Data-base do cálculo")) continue;
    if (labelKey === normKey("Data base do cálculo")) continue;

    if (seenValue.has(valKey)) continue;
    seenValue.add(valKey);

    out.push({ label, value: val });
  }

  return out;
}

function formatDatasExibicaoList(
  list: Array<{ label: string; value: string }>,
): string {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list.map((it) => `${it.label}: ${it.value}`).join("\n");
}

export function getTrpDisplayFields(viewModel: TrpViewModel): Array<{
  fieldName: string;
  label: string;
  value: string;
  shouldDisplay: boolean;
}> {
  const campos = viewModel.campos as AnyObj;

  const fields: Array<{
    fieldName: string;
    label: string;
    value: string;
    shouldDisplay: boolean;
  }> = [];

  const MONEY_FIELDS = new Set([
    "valor_efetivo",
    "valor_efetivo_numero",
    "valor_total_itens",
    "valor_total_geral",
    "valor_unitario",
    "valor_total_calculado",
  ]);

  const toDisplayString = (value: unknown, fieldName?: string): string => {
    if (!isMeaningfulValue(value)) return "";

    if (typeof value === "number") {
      if (fieldName && MONEY_FIELDS.has(fieldName)) return formatBRL(value);
      return String(value);
    }

    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (typeof value === "string") return value;

    return String(value);
  };

  const addField = (fieldName: string, label: string, value: unknown) => {
    const displayValue = toDisplayString(value, fieldName);
    fields.push({
      fieldName,
      label,
      value: displayValue,
      shouldDisplay: isMeaningfulValue(displayValue),
    });
  };

  // =========================
  // Identificação
  // =========================
  addField(
    "numero_contrato",
    "Número do Contrato",
    pick(campos, ["numero_contrato", "numeroContrato"]),
  );
  addField(
    "processo_licitatorio",
    "Processo Licitatório",
    pick(campos, ["processo_licitatorio", "processoLicitatorio"]),
  );
  addField("contratada", "Contratada", pick(campos, ["contratada"]));
  addField("cnpj", "CNPJ", pick(campos, ["cnpj"]));
  addField("vigencia", "Vigência", pick(campos, ["vigencia"]));
  addField(
    "tipo_contrato",
    "Tipo de Contrato",
    pick(campos, ["tipo_contrato", "tipoContrato"]),
  );
  addField(
    "numero_ordem_compra",
    "Ordem de Compra",
    pick(campos, ["numero_ordem_compra", "numeroOrdemCompra"]),
  );
  addField(
    "objeto_contrato",
    "Objeto do Contrato",
    pick(campos, ["objeto_contrato", "objetoContrato"]),
  );
  addField(
    "competencia_mes_ano",
    "Competência (Mês/Ano)",
    pick(campos, ["competencia_mes_ano", "competenciaMesAno"]),
  );

  // =========================
  // Itens / Totais
  // =========================
  const itens = campos.itens_objeto;
  if (Array.isArray(itens) && itens.length > 0) {
    addField(
      "itens_objeto",
      "Itens fornecidos / serviços prestados",
      formatItensObjetoForDisplay(itens),
    );
    addField(
      "valor_total_itens",
      "Total dos itens",
      campos.valor_total_itens ??
        campos.valor_efetivo_formatado ??
        campos.valor_efetivo_numero,
    );
  } else {
    addField(
      "objeto_fornecido",
      "Fornecimento(s) ou Serviço(s) Prestado(s)",
      pick(campos, ["objeto_fornecido", "objetoFornecido"]),
    );
    addField(
      "unidade_medida",
      "Unidade de Medida",
      pick(campos, ["unidade_medida", "unidadeMedida"]),
    );
    addField(
      "quantidade_recebida",
      "Quantidade Recebida",
      pick(campos, ["quantidade_recebida", "quantidadeRecebida"]),
    );
    addField(
      "valor_unitario",
      "Valor Unitário",
      pick(campos, ["valor_unitario", "valorUnitario"]),
    );
    addField(
      "valor_total_calculado",
      "Valor Total",
      pick(campos, ["valor_total_calculado", "valorTotalCalculado"]),
    );
  }

  // =========================
  // Documento Fiscal
  // =========================
  addField(
    "numero_nf",
    "Número da NF",
    pick(campos, ["numero_nf", "numeroNf"]),
  );
  addField(
    "vencimento_nf",
    "Vencimento da NF",
    pick(campos, ["vencimento_nf", "vencimentoNf"]),
  );
  addField(
    "numero_empenho",
    "Número do Empenho",
    pick(campos, ["numero_empenho", "numeroEmpenho"]),
  );

  addField(
    "valor_efetivo",
    "Valor Efetivo",
    campos.valor_efetivo_formatado ??
      campos.valor_efetivo_numero ??
      campos.valor_efetivo,
  );

  // =========================
  // Regra de datas (NÃO redundante)
  // =========================
  const dataBaseCalculo = pick(campos, ["data_base_calculo"]);
  const dataBaseCalculoLabel = pick(campos, ["data_base_calculo_label"]);
  const datasExibRaw = pick(campos, ["regime_execucao_datas_exibicao"]);

  const datasExibList = sanitizeDatasExibicao(datasExibRaw, dataBaseCalculo);
  const datasExibFmt = formatDatasExibicaoList(datasExibList);

  const hasResumoNovoDatas =
    isMeaningfulValue(dataBaseCalculo) || isMeaningfulValue(datasExibFmt);

  // Base de prazo (sempre)
  addField(
    "tipo_base_prazo",
    "Base para contagem de prazo",
    pick(campos, ["tipo_base_prazo", "tipoBasePrazo"]),
  );

  if (hasResumoNovoDatas) {
    const baseLabel = (
      typeof dataBaseCalculoLabel === "string" && dataBaseCalculoLabel.trim()
        ? dataBaseCalculoLabel.trim()
        : "Data base do cálculo"
    ).replace(/Data-base do c[aá]lculo/gi, "Data base do cálculo");

    addField("data_base_calculo", baseLabel, dataBaseCalculo);
    addField(
      "regime_execucao_datas_exibicao",
      "Datas consideradas no cálculo",
      datasExibFmt,
    );
  } else {
    // fallback runs antigos
    addField(
      "data_recebimento",
      "Data de Recebimento",
      pick(campos, ["data_recebimento", "dataRecebimento"]),
    );
    addField(
      "data_entrega",
      "Data Base (Entrega)",
      pick(campos, ["data_entrega", "dataEntrega"]),
    );
    addField(
      "data_conclusao_servico",
      "Data de Conclusão do Serviço",
      pick(campos, ["data_conclusao_servico", "dataConclusaoServico"]),
    );
    addField(
      "data_prevista_entrega_contrato",
      "Data Prevista em Contrato",
      pick(campos, [
        "data_prevista_entrega_contrato",
        "dataPrevistaEntregaContrato",
      ]),
    );
    addField(
      "data_entrega_real",
      "Data de Entrega Real",
      pick(campos, ["data_entrega_real", "dataEntregaReal"]),
    );
  }

  // =========================
  // Demais condições
  // =========================
  addField(
    "condicao_prazo",
    "Condição do Prazo",
    pick(campos, ["condicao_prazo", "condicaoPrazo"]),
  );
  addField(
    "condicao_quantidade_ordem",
    "Condição da Quantidade (Ordem)",
    pick(campos, ["condicao_quantidade_ordem", "condicaoQuantidadeOrdem"]),
  );

  addField(
    "condicao_quantidade_nf",
    "Condição da Quantidade (NF)",
    pick(campos, ["condicao_quantidade_nf", "condicaoQuantidadeNf"]),
  );

  addField(
    "motivo_atraso",
    "Motivo do Atraso",
    pick(campos, ["motivo_atraso", "motivoAtraso"]),
  );
  addField(
    "comentarios_quantidade_ordem",
    "Comentários (Ordem)",
    pick(campos, [
      "comentarios_quantidade_ordem",
      "comentariosQuantidadeOrdem",
    ]),
  );
  addField(
    "comentarios_quantidade_nf",
    "Comentários (NF)",
    pick(campos, ["comentarios_quantidade_nf", "comentariosQuantidadeNf"]),
  );

  // =========================
  // Observações
  // =========================
  addField("observacoes", "Observações", pick(campos, ["observacoes"]));
  addField(
    "observacoes_recebimento",
    "Observações do Recebimento",
    pick(campos, ["observacoes_recebimento", "observacoesRecebimento"]),
  );

  // =========================
  // Assinaturas
  // =========================
  addField(
    "fiscal_contrato_nome",
    "Fiscal do Contrato",
    pick(campos, ["fiscal_contrato_nome", "fiscalContratoNome"]),
  );
  addField(
    "data_assinatura",
    "Data",
    pick(campos, ["data_assinatura", "dataAssinatura"]),
  );

  const filtered = fields.filter((f) => f.shouldDisplay);

  // ✅ blindagem final anti-duplicação (label+value)
  const norm = (s: string) =>
    String(s ?? "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const seen = new Set<string>();
  const deduped: typeof filtered = [];

  for (const f of filtered) {
    const key = `${norm(f.label)}||${norm(f.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }

  return deduped;
}

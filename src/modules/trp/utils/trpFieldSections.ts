/**
 * Organização de campos por seções para renderização dinâmica
 *
 * ✅ BLINDADO:
 * - Nunca retorna valor técnico cru (ex: FORA_DO_PRAZO, DATA_RECEBIMENTO, NAO_DECLARADO)
 * - Filtra NAO_DECLARADO / vazios / "Não informado" para não poluir UI
 * - alwaysShowFields mantém estrutura mínima, mas value vem "" (vazio) para UI decidir placeholder
 * - OUTROS também é normalizado + filtrado
 *
 * ✅ ATUALIZAÇÃO (ITENS):
 * - Seção "ITENS DO RECEBIMENTO" inclui:
 *   - itens_objeto (renderiza tabela no TrpStructuredDataPanel)
 *   - valor_total_geral (Total Geral)
 *
 * ✅ Datas ENXUTAS:
 * - Se existir data_base_calculo OU regime_execucao_datas_exibicao,
 *   então NÃO exibir datas técnicas antigas (data_recebimento, data_entrega, etc.)
 *
 * ✅ Ignora prazos_calculados para não vazar JSON em OUTROS
 * ✅ Evita DUPLICAR snake_case + camelCase (prioriza snake)
 *
 * ✅ FIX (duplicidade + label correto):
 * - data_base_calculo ganha label dinâmico conforme tipo_base_prazo
 * - regime_execucao_datas_exibicao é SANITIZADO:
 *   - remove "Data-base do cálculo"/"Data base do cálculo"
 *   - remove item com value igual à data_base_calculo
 *   - padroniza "Data-base" -> "Data base"
 */

import { getTrpFieldLabel } from "./trpLabels";
import { normalizeTrpValue } from "./formatTrpValues";

export interface FieldSection {
  title: string;
  fieldNames: string[];
}

/**
 * ✅ Pares de compat: se o snake existir, o camel NÃO deve renderizar.
 * (evita duplicar campos na UI)
 */
const COMPAT_CAMEL_TO_SNAKE: Record<string, string> = {
  valorTotalGeral: "valor_total_geral",
  tipoBasePrazo: "tipo_base_prazo",
  dataRecebimento: "data_recebimento",
  dataEntrega: "data_entrega",
  dataConclusaoServico: "data_conclusao_servico",
  dataPrevistaEntregaContrato: "data_prevista_entrega_contrato",
  dataEntregaReal: "data_entrega_real",
  condicaoPrazo: "condicao_prazo",
  condicaoQuantidade: "condicao_quantidade",
  condicaoQuantidadeOrdem: "condicao_quantidade_ordem",
  condicaoQuantidadeNf: "condicao_quantidade_nf",
  motivoAtraso: "motivo_atraso",
  comentariosQuantidadeOrdem: "comentarios_quantidade_ordem",
  comentariosQuantidadeNf: "comentarios_quantidade_nf",
  observacoesRecebimento: "observacoes_recebimento",
  fiscalContratoNome: "fiscal_contrato_nome",
  dataAssinatura: "data_assinatura",
};

export const trpFieldSections: FieldSection[] = [
  {
    title: "IDENTIFICAÇÃO",
    fieldNames: [
      "numero_contrato",
      "processo_licitatorio",
      "numero_ordem_compra",
      "contratada",
      "fornecedor",
      "cnpj",
      "vigencia",
      "tipo_contrato",
      "objeto_contrato",
      "competencia_mes_ano",
    ],
  },

  {
    title: "ITENS DO RECEBIMENTO",
    fieldNames: ["itens_objeto", "valor_total_geral", "valorTotalGeral"],
  },

  {
    title: "DOCUMENTO FISCAL",
    fieldNames: [
      "numero_nf",
      "vencimento_nf",
      "numero_empenho",
      "valor_efetivo_formatado",
      "valor_efetivo_numero",
      "valor_efetivo",
    ],
  },

  {
    title: "REGIME E EXECUÇÃO",
    fieldNames: [
      "tipo_base_prazo",
      "tipoBasePrazo",

      // ✅ NOVOS (UI enxuta)
      "data_base_calculo",
      "regime_execucao_datas_exibicao",
    ],
  },

  {
    title: "CONDIÇÕES DE RECEBIMENTO",
    fieldNames: [
      "condicao_prazo",
      "condicaoPrazo",

      "condicao_quantidade",
      "condicaoQuantidade",
      "condicao_quantidade_ordem",
      "condicaoQuantidadeOrdem",
      "condicao_quantidade_nf",
      "condicaoQuantidadeNf",

      "motivo_atraso",
      "motivoAtraso",
      "comentarios_quantidade_ordem",
      "comentariosQuantidadeOrdem",
      "comentarios_quantidade_nf",
      "comentariosQuantidadeNf",
    ],
  },

  {
    title: "OBSERVAÇÕES",
    fieldNames: [
      "observacoes",
      "observacoes_recebimento",
      "observacoesRecebimento",
    ],
  },

  {
    title: "ASSINATURAS",
    fieldNames: [
      "fiscal_contrato_nome",
      "fiscalContratoNome",
      "data_assinatura",
      "dataAssinatura",
    ],
  },
];

export const ignoredFields = new Set([
  "runId",
  "createdAt",
  "updatedAt",
  "status",
  "id",

  "prazos_calculados",
  "prazos",
  "prazos_calculados_raw",
  "prazos_calculados_normalizados",

  "valor_total_itens",
  "valorTotalItens",
  "valor_total_itens_numero",
  "valorTotalItensNumero",
]);

export const alwaysShowFields = new Set([
  "numero_contrato",
  "processo_licitatorio",
  "contratada",
  "numero_nf",
  "valor_efetivo_formatado",
  "condicao_prazo",

  "itens_objeto",
  "valor_total_geral",
]);

const HIDDEN_STRINGS = new Set([
  "",
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "NAO INFORMADO.",
  "NÃO INFORMADO.",
  "NÃO INFORMADO ",
  "Não informado",
  "Nao informado",
  "NAO DECLARADO",
  "NÃO DECLARADO",
]);

function isHiddenString(s: string): boolean {
  const raw = s.trim();
  if (!raw) return true;
  const upper = raw.toUpperCase();
  return HIDDEN_STRINGS.has(raw) || HIDDEN_STRINGS.has(upper);
}

/**
 * Converte qualquer valor para string exibível e normaliza enums técnicos.
 * Se não for exibível, retorna "".
 *
 * ✅ itens_objeto NÃO vira string aqui (vai raw para tabela)
 * ✅ prazos_* nunca sai
 */
function toUiString(fieldName: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (fieldName.startsWith("prazos")) return "";
  if (fieldName === "itens_objeto") return "__STRUCTURED__";

  if (typeof value === "string") {
    if (isHiddenString(value)) return "";
    const normalized = normalizeTrpValue(value, fieldName);
    if (!normalized || isHiddenString(normalized)) return "";
    return normalized;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    const normalized = normalizeTrpValue(String(value), fieldName);
    if (!normalized || isHiddenString(normalized)) return "";
    return normalized;
  }

  try {
    const s = JSON.stringify(value);
    if (!s || s === "{}" || s === "[]" || s === "null") return "";
    return "__STRUCTURED__";
  } catch {
    const s = String(value);
    if (!s || isHiddenString(s)) return "";
    return s;
  }
}

/**
 * ✅ Detecta se existe o novo modelo de datas enxutas
 */
function hasResumoNovoDatas(campos: Record<string, unknown>): boolean {
  const base = toUiString("data_base_calculo", campos["data_base_calculo"]);
  const lista = campos["regime_execucao_datas_exibicao"];

  const listaStr = Array.isArray(lista)
    ? "__HAS_LIST__"
    : toUiString("regime_execucao_datas_exibicao", lista);

  return base !== "" || listaStr !== "";
}

/**
 * ✅ Datas técnicas que devem sumir quando existir o resumo novo
 */
const TECH_DATE_FIELDS = new Set([
  "data_recebimento",
  "dataRecebimento",
  "data_entrega",
  "dataEntrega",
  "data_conclusao_servico",
  "dataConclusaoServico",
  "data_prevista_entrega_contrato",
  "dataPrevistaEntregaContrato",
  "data_entrega_real",
  "dataEntregaReal",
]);

/**
 * ✅ Label dinâmico para o campo data_base_calculo (primeira linha do bloco)
 * - DATA_ENTREGA -> Data de entrega
 * - DATA_CONCLUSAO_SERVICO -> Data da prestação do serviço
 * - DATA_RECEBIMENTO -> Data de recebimento
 * - fallback -> Data base do cálculo (sem hífen)
 */
function getDataBaseCalculoLabel(campos: Record<string, unknown>): string {
  const raw = String(campos["tipo_base_prazo"] ?? "").trim().toUpperCase();

  if (raw === "DATA_ENTREGA") return "Data de entrega";
  if (raw === "DATA_CONCLUSAO_SERVICO" || raw === "SERVICO" || raw === "SERVIÇO")
    return "Data da prestação do serviço";
  if (raw === "DATA_RECEBIMENTO") return "Data de recebimento";

  return "Data base do cálculo";
}

/**
 * ✅ Sanitiza a lista regime_execucao_datas_exibicao para NÃO duplicar "data_base_calculo"
 * - remove qualquer item com label "Data-base do cálculo" / "Data base do cálculo"
 * - remove item com value igual à data_base_calculo
 * - padroniza "Data-base" -> "Data base"
 */
function sanitizeRegimeExecucaoLista(
  campos: Record<string, unknown>,
  rawValue: unknown
): unknown {
  if (!Array.isArray(rawValue)) return rawValue;

  const base = String(campos["data_base_calculo"] ?? "").trim();

  const normalizeText = (s: string) =>
    s
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "")
      .replace(/Data-base/gi, "Data base"); // padroniza

  const isBaseLabel = (label: string) => {
    const l = normalizeText(label).toLowerCase();
    return l === "data base do cálculo" || l === "data base do calculo";
  };

  const seenValues = new Set<string>();
  if (base) seenValues.add(normalizeText(base));

  const cleaned: Array<{ label: string; value: string }> = [];

  for (const it of rawValue as any[]) {
    const label = normalizeText(String(it?.label ?? ""));
    const value = normalizeText(String(it?.value ?? ""));
    if (!label || !value) continue;

    // remove "Data base do cálculo" da lista
    if (isBaseLabel(label)) continue;

    // remove repetição por value (inclui igual a data_base_calculo)
    if (seenValues.has(value)) continue;

    cleaned.push({ label, value });
    seenValues.add(value);
  }

  return cleaned;
}

export function organizeFieldsBySections(
  campos: Record<string, unknown>
): Array<{
  section: FieldSection;
  fields: Array<{ fieldName: string; label: string; value: unknown }>;
}> {
  const allFieldNames = new Set(Object.keys(campos));
  const usedFields = new Set<string>();

  const shouldHideTechDates = hasResumoNovoDatas(campos);

  const skipCamel = new Set<string>();
  for (const [camel, snake] of Object.entries(COMPAT_CAMEL_TO_SNAKE)) {
    if (allFieldNames.has(snake) && allFieldNames.has(camel)) {
      skipCamel.add(camel);
    }
  }

  const result: Array<{
    section: FieldSection;
    fields: Array<{ fieldName: string; label: string; value: unknown }>;
  }> = [];

  for (const section of trpFieldSections) {
    const fields: Array<{ fieldName: string; label: string; value: unknown }> =
      [];

    for (const fieldName of section.fieldNames) {
      if (skipCamel.has(fieldName)) continue;

      if (shouldHideTechDates && TECH_DATE_FIELDS.has(fieldName)) continue;

      if (!allFieldNames.has(fieldName)) {
        if (alwaysShowFields.has(fieldName)) {
          fields.push({
            fieldName,
            label: getTrpFieldLabel(fieldName),
            value: "",
          });
          usedFields.add(fieldName);
        }
        continue;
      }

      const rawValue = campos[fieldName];

      // ✅ itens_objeto vai raw
      if (fieldName === "itens_objeto") {
        if (Array.isArray(rawValue) || alwaysShowFields.has(fieldName)) {
          fields.push({
            fieldName,
            label: getTrpFieldLabel(fieldName),
            value: rawValue,
          });
          usedFields.add(fieldName);
        }
        continue;
      }

      // ✅ regime_execucao_datas_exibicao: sanitiza para não duplicar data_base_calculo
      if (fieldName === "regime_execucao_datas_exibicao") {
        const sanitized = sanitizeRegimeExecucaoLista(campos, rawValue);
        const uiValue = toUiString(fieldName, sanitized);
        const valueToStore = uiValue === "__STRUCTURED__" ? sanitized : uiValue;

        if (alwaysShowFields.has(fieldName) || uiValue !== "") {
          fields.push({
            fieldName,
            label: getTrpFieldLabel(fieldName),
            value: valueToStore,
          });
          usedFields.add(fieldName);
        }
        continue;
      }

      // ✅ data_base_calculo: label dinâmico e sem hífen
      if (fieldName === "data_base_calculo") {
        const uiValue = toUiString(fieldName, rawValue);
        const label = getDataBaseCalculoLabel(campos); // <-- aqui troca o rótulo

        if (alwaysShowFields.has(fieldName) || uiValue !== "") {
          fields.push({
            fieldName,
            label,
            value: uiValue,
          });
          usedFields.add(fieldName);
        }
        continue;
      }

      const uiValue = toUiString(fieldName, rawValue);
      const valueToStore = uiValue === "__STRUCTURED__" ? rawValue : uiValue;

      if (alwaysShowFields.has(fieldName) || uiValue !== "") {
        fields.push({
          fieldName,
          label: getTrpFieldLabel(fieldName),
          value: valueToStore,
        });
        usedFields.add(fieldName);
      }
    }

    if (fields.length > 0) {
      const hasAnyValue = fields.some((f) => {
        if (f.fieldName === "itens_objeto")
          return Array.isArray(f.value) && (f.value as any[]).length > 0;
        if (typeof f.value === "string") return f.value !== "";
        return f.value !== null && f.value !== undefined;
      });

      const hasAlwaysShow = fields.some((f) => alwaysShowFields.has(f.fieldName));

      if (hasAnyValue || hasAlwaysShow) result.push({ section, fields });
    }
  }

  // OUTROS
  const otherFields: Array<{ fieldName: string; label: string; value: unknown }> =
    [];

  for (const [fieldName, rawValue] of Object.entries(campos)) {
    if (ignoredFields.has(fieldName)) continue;
    if (usedFields.has(fieldName)) continue;
    if (skipCamel.has(fieldName)) continue;
    if (fieldName.startsWith("prazos")) continue;

    if (shouldHideTechDates && TECH_DATE_FIELDS.has(fieldName)) continue;

    const uiValue = toUiString(fieldName, rawValue);
    if (uiValue === "") continue;
    if (uiValue === "__STRUCTURED__") continue;

    otherFields.push({
      fieldName,
      label: getTrpFieldLabel(fieldName),
      value: uiValue,
    });
  }

  if (otherFields.length > 0) {
    result.push({
      section: { title: "OUTROS", fieldNames: [] },
      fields: otherFields,
    });
  }

  return result;
}

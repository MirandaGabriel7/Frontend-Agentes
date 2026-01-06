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
 * ✅ Ignora prazos_calculados para não vazar JSON em OUTROS
 * ✅ Evita DUPLICAR snake_case + camelCase (prioriza snake)
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
    fieldNames: [
      "itens_objeto",
      "valor_total_geral",
      "valorTotalGeral", // compat (camel) — só entra se snake não existir
    ],
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
    title: "CONDIÇÕES DE RECEBIMENTO",
    fieldNames: [
      "tipo_base_prazo",
      "tipoBasePrazo",
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

  // ✅ evita vazar JSON em OUTROS
  "prazos_calculados",
  "prazos",
  "prazos_calculados_raw",
  "prazos_calculados_normalizados",

  // ✅ remove o “OUTROS: Valor Total Itens”
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
  "data_entrega",
  "condicao_prazo",

  // ✅ manter estrutura mínima dos itens
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

export function organizeFieldsBySections(
  campos: Record<string, unknown>
): Array<{
  section: FieldSection;
  fields: Array<{ fieldName: string; label: string; value: unknown }>;
}> {
  const allFieldNames = new Set(Object.keys(campos));
  const usedFields = new Set<string>();

  // ✅ campos camel a pular quando o snake existe
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

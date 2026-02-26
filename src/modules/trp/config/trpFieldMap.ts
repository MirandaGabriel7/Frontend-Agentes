// src/modules/trp/config/trpFieldMap.ts
//
// Mapeamento COMPLETO de todos os campos que podem aparecer num TRP,
// baseado no schema do Supabase + trpEnums.ts + trpMarkdownPostProcess.ts

export type FieldType = "text" | "number" | "date" | "textarea";

export interface TrpFieldDef {
  fieldId: string;
  label: string;
  path: string;
  type: FieldType;
  required?: boolean;
  validate?: (val: string) => string | undefined;
}

export const TRP_TOP_LEVEL_FIELDS: TrpFieldDef[] = [
  // ── Identificação do Contrato ──────────────────────────────────────────────
  { fieldId: "numero_contrato",        label: "Número do contrato",        path: "numero_contrato",        type: "text", required: true },
  { fieldId: "processo_licitatorio",   label: "Processo licitatório",      path: "processo_licitatorio",   type: "text" },
  { fieldId: "tipo_contrato",          label: "Tipo de contrato",          path: "tipo_contrato",          type: "text" },
  { fieldId: "objeto_contrato",        label: "Objeto",                    path: "objeto_contrato",        type: "textarea" },
  { fieldId: "contratada",             label: "Contratada",                path: "contratada",             type: "text" },
  { fieldId: "cnpj",                   label: "CNPJ",                      path: "cnpj",                   type: "text" },
  { fieldId: "vigencia",               label: "Vigência",                  path: "vigencia",               type: "text" },
  { fieldId: "numero_ordem_compra",    label: "Ordem de compra",           path: "numero_ordem_compra",    type: "text" },
  { fieldId: "numero_nf",              label: "Nota Fiscal",               path: "numero_nf",              type: "text" },
  { fieldId: "vencimento_nf",          label: "Vencimento da NF",          path: "vencimento_nf",          type: "date" },
  { fieldId: "numero_empenho",         label: "Empenho",                   path: "numero_empenho",         type: "text" },
  { fieldId: "unidade_gestora",        label: "Unidade gestora",           path: "unidade_gestora",        type: "text" },
  { fieldId: "fiscal_contrato",        label: "Fiscal do contrato",        path: "fiscal_contrato",        type: "text" },
  { fieldId: "local_entrega",          label: "Local de entrega",          path: "local_entrega",          type: "text" },

  // ── Valores ───────────────────────────────────────────────────────────────
  { fieldId: "valor_efetivo_formatado", label: "Valor efetivo",            path: "valor_efetivo_formatado", type: "text" },
  { fieldId: "valor_total_geral",       label: "Valor total geral",        path: "valor_total_geral",       type: "number" },

  // ── Regime e Execução ─────────────────────────────────────────────────────
  { fieldId: "tipo_base_prazo",                label: "Tipo de base de prazo",               path: "tipo_base_prazo",                type: "text" },
  { fieldId: "condicao_prazo",                 label: "Condição quanto ao prazo",            path: "condicao_prazo",                 type: "text" },
  { fieldId: "condicao_quantidade_ordem",      label: "Condição quanto à quantidade (Ordem)",path: "condicao_quantidade_ordem",      type: "text" },
  { fieldId: "condicao_quantidade_nf",         label: "Condição quanto à quantidade (NF)",   path: "condicao_quantidade_nf",         type: "text" },
  { fieldId: "motivo_atraso",                  label: "Motivo do atraso",                    path: "motivo_atraso",                  type: "textarea" },
  { fieldId: "comentarios_quantidade_ordem",   label: "Comentários sobre quantidade (Ordem)",path: "comentarios_quantidade_ordem",   type: "textarea" },
  { fieldId: "comentarios_quantidade_nf",      label: "Comentários sobre quantidade (NF)",   path: "comentarios_quantidade_nf",      type: "textarea" },
  { fieldId: "observacoes",                    label: "Observações",                         path: "observacoes",                    type: "textarea" },
  { fieldId: "observacoes_recebimento",        label: "Observações do recebimento",          path: "observacoes_recebimento",        type: "textarea" },

  // ── Datas ─────────────────────────────────────────────────────────────────
  { fieldId: "data_recebimento",               label: "Data de recebimento",                 path: "data_recebimento",               type: "date" },
  { fieldId: "data_entrega",                   label: "Data de entrega",                     path: "data_entrega",                   type: "date" },
  { fieldId: "data_entrega_real",              label: "Data de entrega real",                path: "data_entrega_real",              type: "date" },
  { fieldId: "data_conclusao_servico",         label: "Conclusão do serviço",                path: "data_conclusao_servico",         type: "date" },
  { fieldId: "data_prevista_entrega_contrato", label: "Data prevista em contrato",           path: "data_prevista_entrega_contrato", type: "date" },
  { fieldId: "data_inicio_servico",            label: "Data de início do serviço",           path: "data_inicio_servico",            type: "date" },

  // ── Prazos calculados ─────────────────────────────────────────────────────
  { fieldId: "prazo_provisorio_dias_uteis",    label: "Prazo provisório (dias úteis)",       path: "prazo_provisorio_dias_uteis",    type: "number" },
  { fieldId: "prazo_definitivo_dias_uteis",    label: "Prazo definitivo (dias úteis)",       path: "prazo_definitivo_dias_uteis",    type: "number" },
  { fieldId: "prazo_liquidacao_dias_corridos", label: "Prazo de liquidação (dias corridos)", path: "prazo_liquidacao_dias_corridos", type: "number" },
  { fieldId: "vencimento_tipo",                label: "Tipo de vencimento",                  path: "vencimento_tipo",                type: "text" },
  { fieldId: "vencimento_dias_corridos",       label: "Vencimento (dias corridos)",          path: "vencimento_dias_corridos",       type: "number" },
  { fieldId: "vencimento_dia_fixo",            label: "Vencimento (dia fixo)",               path: "vencimento_dia_fixo",            type: "number" },

  // ── Assinaturas ───────────────────────────────────────────────────────────
  { fieldId: "fiscal_contrato_nome",           label: "Fiscal do contrato",                  path: "fiscal_contrato_nome",           type: "text" },
  { fieldId: "data_assinatura",                label: "Data",                                path: "data_assinatura",                type: "date" },
];

// ── Itens do objeto ────────────────────────────────────────────────────────

export const TRP_ITEM_SUBFIELD_KEYS = [
  "descricao",
  "unidade_medida",
  "quantidade_recebida",
  "valor_unitario_num",
  "valor_total_calculado",
] as const;

export type TrpItemSubfieldKey = typeof TRP_ITEM_SUBFIELD_KEYS[number];

const TRP_ITEM_SUBFIELD_META: Record<TrpItemSubfieldKey, { label: string; type: FieldType; required?: boolean }> = {
  descricao:             { label: "Descrição",      type: "text",   required: true },
  unidade_medida:        { label: "Unidade",        type: "text" },
  quantidade_recebida:   { label: "Quantidade",     type: "number" },
  valor_unitario_num:    { label: "Valor Unitário", type: "number" },
  valor_total_calculado: { label: "Valor Total",    type: "number" },
};

export function itemFieldId(index: number, subfield: TrpItemSubfieldKey | string): string {
  return `itens_objeto.${index}.${subfield}`;
}

export function resolveFieldDef(fieldId: string): TrpFieldDef | undefined {
  const top = TRP_TOP_LEVEL_FIELDS.find((f) => f.fieldId === fieldId);
  if (top) return top;

  const itemMatch = fieldId.match(/^itens_objeto\.(\d+)\.(.+)$/);
  if (itemMatch) {
    const subfield = itemMatch[2] as TrpItemSubfieldKey;
    const meta = TRP_ITEM_SUBFIELD_META[subfield];
    if (meta) {
      return {
        fieldId,
        path: fieldId,
        label: meta.label,
        type: meta.type,
        required: meta.required,
      };
    }
  }

  // Datas dinâmicas e prazos calculados
  return resolveDynamicDateFieldDef(fieldId);
}

// ─── Campos de datas dinâmicas (regime_execucao_datas_exibicao) ───────────────
// Esses campos têm path dinâmico (regime_execucao_datas_exibicao.N.value)
// mas são resolvidos pelo resolveFieldDef como "date"

export function resolveDynamicDateFieldDef(fieldPath: string): TrpFieldDef | undefined {
  // regime_execucao_datas_exibicao.N.value
  if (/^regime_execucao_datas_exibicao\.\d+\.value$/.test(fieldPath)) {
    return { fieldId: fieldPath, path: fieldPath, label: "Data", type: "date" };
  }
  if (fieldPath === "data_base_calculo") {
    return { fieldId: fieldPath, path: fieldPath, label: "Data base do cálculo", type: "date" };
  }

  // prazos_calculados — chaves reais: provisorio, definitivo, liquidacao, vencimento_nf
  const prazoLabels: Record<string, string> = {
    "prazos_calculados.provisorio":   "Termo de Recebimento Provisório",
    "prazos_calculados.definitivo":   "Termo de Recebimento Definitivo",
    "prazos_calculados.liquidacao":   "Liquidação",
    "prazos_calculados.vencimento_nf":"Vencimento da NF",
  };
  if (prazoLabels[fieldPath]) {
    return { fieldId: fieldPath, path: fieldPath, label: prazoLabels[fieldPath], type: "date" };
  }

  // campos de data legados
  const legacyDateFields: Record<string, string> = {
    data_recebimento:               "Data de recebimento",
    data_inicio_servico:            "Data de início do serviço",
    data_entrega:                   "Data de entrega",
    data_entrega_real:              "Data de entrega real",
    data_conclusao_servico:         "Conclusão do serviço",
    data_prevista_entrega_contrato: "Data prevista em contrato",
  };
  if (legacyDateFields[fieldPath]) {
    return { fieldId: fieldPath, path: fieldPath, label: legacyDateFields[fieldPath], type: "date" };
  }

  // observacoes / assinaturas (texto livre)
  const freeTextFields: Record<string, { label: string; type: FieldType }> = {
    observacoes:             { label: "Observações",        type: "textarea" },
    observacoes_recebimento: { label: "Observações",        type: "textarea" },
    fiscal_contrato_nome:    { label: "Fiscal do Contrato", type: "text" },
    data_assinatura:         { label: "Data",               type: "date" },
  };
  if (freeTextFields[fieldPath]) {
    const f = freeTextFields[fieldPath];
    return { fieldId: fieldPath, path: fieldPath, label: f.label, type: f.type };
  }

  return undefined;
}
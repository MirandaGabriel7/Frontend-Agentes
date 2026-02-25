// src/modules/trp/config/trpFieldMap.ts

export type FieldType = "text" | "number" | "date" | "textarea";

export interface TrpFieldDef {
  fieldId: string;
  label: string;
  path: string;
  type: FieldType;
  required?: boolean;
  validate?: (val: string) => string | undefined;
}

// Campos escalares top-level — baseados na estrutura REAL do trpCanon.ts
export const TRP_TOP_LEVEL_FIELDS: TrpFieldDef[] = [
  { fieldId: "numero_contrato",          label: "Número do Contrato",       path: "numero_contrato",          type: "text", required: true },
  { fieldId: "processo_licitatorio",     label: "Processo Licitatório",     path: "processo_licitatorio",     type: "text" },
  { fieldId: "tipo_contrato",            label: "Tipo de Contrato",         path: "tipo_contrato",            type: "text" },
  { fieldId: "objeto_contrato",          label: "Objeto",                   path: "objeto_contrato",          type: "textarea" },
  { fieldId: "contratada",               label: "Contratada",               path: "contratada",               type: "text" },
  { fieldId: "cnpj",                     label: "CNPJ",                     path: "cnpj",                     type: "text" },
  { fieldId: "vigencia",                 label: "Vigência",                 path: "vigencia",                 type: "text" },
  { fieldId: "numero_ordem_compra",      label: "Ordem de Compra",          path: "numero_ordem_compra",      type: "text" },
  { fieldId: "numero_nf",                label: "Nota Fiscal",              path: "numero_nf",                type: "text" },
  { fieldId: "vencimento_nf",            label: "Vencimento da NF",         path: "vencimento_nf",            type: "date" },
  { fieldId: "numero_empenho",           label: "Empenho",                  path: "numero_empenho",           type: "text" },
  { fieldId: "valor_efetivo_formatado",  label: "Valor Efetivo",            path: "valor_efetivo_formatado",  type: "text" },
  { fieldId: "tipo_base_prazo",          label: "Tipo de Base de Prazo",    path: "tipo_base_prazo",          type: "text" },
  { fieldId: "condicao_prazo",           label: "Condição quanto ao Prazo", path: "condicao_prazo",           type: "text" },
  { fieldId: "condicao_quantidade_ordem",label: "Condição quanto à Quantidade", path: "condicao_quantidade_ordem", type: "text" },
  { fieldId: "motivo_atraso",            label: "Motivo do Atraso",         path: "motivo_atraso",            type: "textarea" },
  { fieldId: "comentarios_quantidade_ordem", label: "Comentários (Ordem)", path: "comentarios_quantidade_ordem", type: "textarea" },
  { fieldId: "observacoes",              label: "Observações",              path: "observacoes",              type: "textarea" },
];

// Sub-campos dos itens
export const TRP_ITEM_SUBFIELD_KEYS = [
  "descricao",
  "unidade_medida",
  "quantidade_recebida",
  "valor_unitario_num",
  "valor_total_calculado",
] as const;

export type TrpItemSubfieldKey = typeof TRP_ITEM_SUBFIELD_KEYS[number];

const TRP_ITEM_SUBFIELD_META: Record<TrpItemSubfieldKey, { label: string; type: FieldType; required?: boolean }> = {
  descricao:              { label: "Descrição",       type: "text",   required: true },
  unidade_medida:         { label: "Unidade",         type: "text" },
  quantidade_recebida:    { label: "Quantidade",      type: "number" },
  valor_unitario_num:     { label: "Valor Unitário",  type: "number" },
  valor_total_calculado:  { label: "Valor Total",     type: "number" },
};

export function itemFieldId(index: number, subfield: TrpItemSubfieldKey | string): string {
  return `itens_objeto.${index}.${subfield}`;
}

export function resolveFieldDef(fieldId: string): TrpFieldDef | undefined {
  // Top-level
  const top = TRP_TOP_LEVEL_FIELDS.find((f) => f.fieldId === fieldId);
  if (top) return top;

  // Item pattern: itens_objeto.N.subfield
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

  return undefined;
}
// src/modules/trp/config/trpFieldMap.ts

export type FieldType = 'text' | 'number' | 'date' | 'textarea';

export interface TrpFieldDef {
  fieldId: string;
  label: string;
  path: string;
  type: FieldType;
  required?: boolean;
  validate?: (val: string) => string | undefined;
}

export const TRP_TOP_LEVEL_FIELDS: TrpFieldDef[] = [
  {
    fieldId: 'numero_contrato',
    label: 'Número do Contrato',
    path: 'numero_contrato',
    type: 'text',
    required: true,
  },
  {
    fieldId: 'processo_licitatorio',
    label: 'Processo Licitatório',
    path: 'processo_licitatorio',
    type: 'text',
  },
  {
    fieldId: 'cnpj_contratada',
    label: 'CNPJ da Contratada',
    path: 'cnpj_contratada',
    type: 'text',
    validate: (val) => {
      const digits = val.replace(/\D/g, '');
      if (val && digits.length !== 14) return 'CNPJ deve ter 14 dígitos';
      return undefined;
    },
  },
  {
    fieldId: 'nome_contratada',
    label: 'Nome da Contratada',
    path: 'nome_contratada',
    type: 'text',
    required: true,
  },
  {
    fieldId: 'objeto_contrato',
    label: 'Objeto do Contrato',
    path: 'objeto_contrato',
    type: 'textarea',
  },
  {
    fieldId: 'data_entrega',
    label: 'Data de Entrega',
    path: 'data_entrega',
    type: 'date',
  },
  {
    fieldId: 'data_recebimento',
    label: 'Data de Recebimento',
    path: 'data_recebimento',
    type: 'date',
  },
  {
    fieldId: 'prazo_vigencia',
    label: 'Prazo de Vigência',
    path: 'prazo_vigencia',
    type: 'date',
  },
  {
    fieldId: 'vencimento_nf',
    label: 'Vencimento da NF',
    path: 'vencimento_nf',
    type: 'date',
  },
  {
    fieldId: 'numero_nf',
    label: 'Número da NF',
    path: 'numero_nf',
    type: 'text',
  },
  {
    fieldId: 'valor_total',
    label: 'Valor Total',
    path: 'valor_total',
    type: 'number',
  },
  {
    fieldId: 'unidade_gestora',
    label: 'Unidade Gestora',
    path: 'unidade_gestora',
    type: 'text',
  },
  {
    fieldId: 'fiscal_contrato',
    label: 'Fiscal do Contrato',
    path: 'fiscal_contrato',
    type: 'text',
  },
  {
    fieldId: 'local_entrega',
    label: 'Local de Entrega',
    path: 'local_entrega',
    type: 'text',
  },
];

export const TRP_ITEM_SUBFIELD_KEYS = [
  'descricao',
  'unidade',
  'quantidade',
  'valor_unitario',
  'valor_total_item',
] as const;

export type TrpItemSubfieldKey = typeof TRP_ITEM_SUBFIELD_KEYS[number];

const TRP_ITEM_SUBFIELD_META: Record<TrpItemSubfieldKey, { label: string; type: FieldType; required?: boolean }> = {
  descricao:        { label: 'Descrição',      type: 'text',   required: true },
  unidade:          { label: 'Unidade',        type: 'text' },
  quantidade:       { label: 'Quantidade',     type: 'number' },
  valor_unitario:   { label: 'Valor Unitário', type: 'number' },
  valor_total_item: { label: 'Valor Total',    type: 'number' },
};

export function itemFieldId(index: number, subfield: TrpItemSubfieldKey | string): string {
  return `itens_objeto.${index}.${subfield}`;
}

export function resolveFieldDef(fieldId: string): TrpFieldDef | undefined {
  // Check top-level fields first
  const top = TRP_TOP_LEVEL_FIELDS.find((f) => f.fieldId === fieldId);
  if (top) return top;

  // Check item pattern: itens_objeto.N.subfield
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
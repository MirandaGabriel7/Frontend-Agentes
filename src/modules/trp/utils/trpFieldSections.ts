/**
 * Organização de campos por seções para renderização dinâmica
 * Define quais campos pertencem a cada seção do documento
 *
 * ✅ BLINDADO:
 * - Nunca retorna valor técnico cru (ex: FORA_DO_PRAZO, DATA_RECEBIMENTO, NAO_DECLARADO)
 * - Filtra NAO_DECLARADO / vazios / "Não informado" para não poluir UI
 * - alwaysShowFields mantém estrutura mínima, mas value vem "" (vazio) para UI decidir placeholder
 * - OUTROS também é normalizado + filtrado
 *
 * ✅ ATUALIZAÇÃO (Objeto + Quantidades/Valores juntos):
 * - "OBJETO FORNECIDO/PRESTADO" inclui: objeto_fornecido + unidade_medida + quantidade_recebida + valor_unitario + valor_total_calculado
 * - Remove seção separada de quantitativos/valores
 * - Remove "REGIME DE FORNECIMENTO" e remove area_demandante_nome
 * - Ignora prazos_calculados para não vazar JSON em OUTROS
 */

import { getTrpFieldLabel } from './trpLabels';
import { normalizeTrpValue } from './formatTrpValues';

export interface FieldSection {
  title: string;
  fieldNames: string[];
}

export const trpFieldSections: FieldSection[] = [
  {
    title: 'IDENTIFICAÇÃO',
    fieldNames: [
      'numero_contrato',
      'processo_licitatorio',
      'numero_ordem_compra',
      'contratada',
      'fornecedor',
      'cnpj',
      'vigencia',
      'tipo_contrato',
      'objeto_contrato',
      'competencia_mes_ano',
    ],
  },

  {
    title: 'OBJETO FORNECIDO/PRESTADO',
    fieldNames: [
      'objeto_fornecido',
      'unidade_medida',
      'quantidade_recebida',
      'valor_unitario',
      'valor_total_calculado',
    ],
  },

  {
    title: 'DOCUMENTO FISCAL',
    fieldNames: [
      'numero_nf',
      'vencimento_nf',
      'numero_empenho',
      'valor_efetivo_formatado',
      'valor_efetivo_numero',
      'valor_efetivo',
    ],
  },

  {
    title: 'CONDIÇÕES DE RECEBIMENTO',
    fieldNames: [
      'tipo_base_prazo',
      'data_recebimento',
      'data_entrega',
      'data_conclusao_servico',
      'data_prevista_entrega_contrato',
      'data_entrega_real',

      'condicao_prazo',

      'condicao_quantidade',
      'condicao_quantidade_ordem',
      'condicao_quantidade_nf',

      'motivo_atraso',
      'comentarios_quantidade_ordem',
      'comentarios_quantidade_nf',
    ],
  },

  {
    title: 'OBSERVAÇÕES',
    fieldNames: ['observacoes', 'observacoes_recebimento'],
  },

  {
    title: 'ASSINATURAS',
    fieldNames: ['fiscal_contrato_nome', 'data_assinatura'],
  },
];

export const ignoredFields = new Set([
  'runId',
  'createdAt',
  'updatedAt',
  'status',
  'id',

  // ✅ evita vazar JSON em OUTROS
  'prazos_calculados',
  'prazos',
  'prazos_calculados_raw',
]);

export const alwaysShowFields = new Set([
  'numero_contrato',
  'processo_licitatorio',
  'contratada',
  'numero_nf',
  'valor_efetivo_formatado',
  'data_entrega',
  'condicao_prazo',

  // ✅ manter estrutura mínima do bloco Objeto/Valores
  'objeto_fornecido',
  'unidade_medida',
  'quantidade_recebida',
  'valor_unitario',
  'valor_total_calculado',
]);

const HIDDEN_STRINGS = new Set([
  '',
  'NAO_DECLARADO',
  'NÃO_DECLARADO',
  'NAO INFORMADO',
  'NÃO INFORMADO',
  'NAO_INFORMADO',
  'NÃO_INFORMADO',
  'NAO INFORMADO.',
  'NÃO INFORMADO.',
  'NÃO INFORMADO ',
  'Não informado',
  'Nao informado',
  'NÃO INFORMADO',
  'NAO DECLARADO',
  'NÃO DECLARADO',
]);

function isHiddenString(s: string): boolean {
  const raw = s.trim();
  if (!raw) return true;

  const upper = raw.toUpperCase();
  return HIDDEN_STRINGS.has(raw) || HIDDEN_STRINGS.has(upper);
}

/**
 * Converte qualquer valor para string "exibível" e normaliza enums técnicos.
 * Se não for exibível, retorna "" (vazio).
 *
 * ✅ IMPORTANTE:
 * - number/boolean também passam pelo normalizeTrpValue para permitir formatação (moeda/quantidade)
 */
function toUiString(fieldName: string, value: unknown): string {
  if (value === null || value === undefined) return '';

  // evita vazamento de estruturas
  if (fieldName === 'prazos_calculados' || fieldName === 'prazos') return '';

  // strings
  if (typeof value === 'string') {
    if (isHiddenString(value)) return '';

    const normalized = normalizeTrpValue(value, fieldName);
    if (!normalized || isHiddenString(normalized)) return '';

    return normalized;
  }

  // number / boolean  ✅ agora normaliza também
  if (typeof value === 'number' || typeof value === 'boolean') {
    const normalized = normalizeTrpValue(String(value), fieldName);
    if (!normalized || isHiddenString(normalized)) return '';
    return normalized;
  }

  // objeto/array
  try {
    const s = JSON.stringify(value);
    if (!s || s === '{}' || s === '[]' || s === 'null') return '';

    const normalized = normalizeTrpValue(s, fieldName);
    if (!normalized || isHiddenString(normalized)) return '';
    return normalized;
  } catch {
    const s = String(value);
    if (!s || isHiddenString(s)) return '';
    return s;
  }
}

export function organizeFieldsBySections(
  campos: Record<string, unknown>
): Array<{
  section: FieldSection;
  fields: Array<{ fieldName: string; label: string; value: string }>;
}> {
  const allFieldNames = new Set(Object.keys(campos));
  const usedFields = new Set<string>();

  const result: Array<{
    section: FieldSection;
    fields: Array<{ fieldName: string; label: string; value: string }>;
  }> = [];

  for (const section of trpFieldSections) {
    const fields: Array<{ fieldName: string; label: string; value: string }> = [];

    for (const fieldName of section.fieldNames) {
      if (!allFieldNames.has(fieldName)) {
        if (alwaysShowFields.has(fieldName)) {
          fields.push({
            fieldName,
            label: getTrpFieldLabel(fieldName),
            value: '',
          });
          usedFields.add(fieldName);
        }
        continue;
      }

      const rawValue = campos[fieldName];
      const uiValue = toUiString(fieldName, rawValue);

      if (alwaysShowFields.has(fieldName) || uiValue !== '') {
        fields.push({
          fieldName,
          label: getTrpFieldLabel(fieldName),
          value: uiValue,
        });
        usedFields.add(fieldName);
      }
    }

    if (fields.length > 0) {
      const hasAnyValue = fields.some((f) => f.value !== '');
      const hasAlwaysShow = fields.some((f) => alwaysShowFields.has(f.fieldName));
      if (hasAnyValue || hasAlwaysShow) {
        result.push({ section, fields });
      }
    }
  }

  // OUTROS
  const otherFields: Array<{ fieldName: string; label: string; value: string }> = [];

  for (const [fieldName, rawValue] of Object.entries(campos)) {
    if (ignoredFields.has(fieldName)) continue;
    if (usedFields.has(fieldName)) continue;
    if (fieldName.startsWith('prazos')) continue;

    const uiValue = toUiString(fieldName, rawValue);
    if (uiValue === '') continue;

    otherFields.push({
      fieldName,
      label: getTrpFieldLabel(fieldName),
      value: uiValue,
    });
  }

  if (otherFields.length > 0) {
    result.push({
      section: { title: 'OUTROS', fieldNames: [] },
      fields: otherFields,
    });
  }

  return result;
}

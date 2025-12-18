/**
 * Organização de campos por seções para renderização dinâmica
 * Define quais campos pertencem a cada seção do documento
 *
 * ✅ CORRIGIDO (BLINDADO):
 * - Nunca retorna valor técnico cru (ex: FORA_DO_PRAZO, DATA_RECEBIMENTO, NAO_DECLARADO)
 * - Filtra NAO_DECLARADO / vazios / "Não informado" para não poluir UI
 * - alwaysShowFields mantém estrutura mínima, mas value vem "" (vazio) para UI decidir placeholder
 * - OUTROS também é normalizado + filtrado
 */

import { getTrpFieldLabel } from './trpLabels';
import { normalizeTrpValue } from './formatTrpValues';

export interface FieldSection {
  title: string;
  fieldNames: string[];
}

/**
 * Define as seções e seus campos
 * Campos não listados aqui serão exibidos em uma seção "OUTROS" no final
 */
export const trpFieldSections: FieldSection[] = [
  {
    title: 'IDENTIFICAÇÃO',
    fieldNames: [
      'numero_contrato',
      'processo_licitatorio',
      'contratada',
      'fornecedor',
      'cnpj',
      'vigencia',
      'tipo_contrato',
      'objeto_contrato',
    ],
  },
  {
    title: 'REGIME DE FORNECIMENTO',
    fieldNames: ['regime_fornecimento', 'competencia_mes_ano'],
  },
  {
    title: 'DOCUMENTO FISCAL',
    fieldNames: [
      'numero_nf',
      'vencimento_nf',
      'numero_empenho',
      'valor_efetivo_formatado',
      'valor_efetivo_numero',
    ],
  },
  {
    title: 'CONDIÇÕES DE RECEBIMENTO',
    fieldNames: [
      'tipo_base_prazo',
      'data_recebimento',
      'data_entrega',
      'data_conclusao_servico',
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
    fieldNames: ['fiscal_contrato_nome', 'area_demandante_nome', 'data_assinatura'],
  },
];

/**
 * Campos que devem ser ignorados na renderização (metadados internos)
 */
export const ignoredFields = new Set([
  'runId',
  'createdAt',
  'updatedAt',
  'status',
  'id',
]);

/**
 * Campos que devem ser exibidos mesmo se vazios (estrutura mínima)
 * ✅ Aqui a gente inclui o campo, mas o value vem "" para a UI decidir placeholder
 */
export const alwaysShowFields = new Set([
  'numero_contrato',
  'processo_licitatorio',
  'contratada',
  'numero_nf',
  'valor_efetivo_formatado',
  'data_entrega',
  'condicao_prazo',
  'condicao_quantidade',
]);

/**
 * Valores que NUNCA devem aparecer na UI
 */
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
 */
function toUiString(fieldName: string, value: unknown): string {
  if (value === null || value === undefined) return '';

  // strings
  if (typeof value === 'string') {
    if (isHiddenString(value)) return '';

    // normalizeTrpValue agora deve devolver "" para NAO_DECLARADO (depois que você atualizou)
    const normalized = normalizeTrpValue(value, fieldName);
    if (!normalized || isHiddenString(normalized)) return '';

    return normalized;
  }

  // number / boolean
  if (typeof value === 'number' || typeof value === 'boolean') {
    const s = String(value);
    if (isHiddenString(s)) return '';
    return s;
  }

  // objeto/array
  try {
    const s = JSON.stringify(value);
    if (!s || s === '{}' || s === '[]' || s === 'null') return '';
    // ainda passa pelo normalizador para evitar enums técnicos dentro de string
    const normalized = normalizeTrpValue(s, fieldName);
    if (!normalized || isHiddenString(normalized)) return '';
    return normalized;
  } catch {
    const s = String(value);
    if (!s || isHiddenString(s)) return '';
    return s;
  }
}

/**
 * Organiza campos por seções
 * ✅ Retorna valores prontos para UI (string normalizada + filtrada)
 */
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
        // Se for alwaysShowFields e não existe, ainda pode entrar com vazio
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

      // ✅ Se alwaysShowFields: entra sempre, mas value pode ser ""
      // ✅ Se não é alwaysShow: só entra se tiver valor útil (uiValue != "")
      if (alwaysShowFields.has(fieldName) || uiValue !== '') {
        fields.push({
          fieldName,
          label: getTrpFieldLabel(fieldName),
          value: uiValue,
        });
        usedFields.add(fieldName);
      }
    }

    // adicionar seção se tiver algo (mesmo que seja alwaysShow vazio — estrutura)
    if (fields.length > 0) {
      // Mas se a seção inteira estiver vazia (todos ""), e não houver nenhum alwaysShow nela, não renderiza
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

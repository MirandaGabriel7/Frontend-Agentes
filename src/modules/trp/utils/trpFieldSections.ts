/**
 * Organização de campos por seções para renderização dinâmica
 * Define quais campos pertencem a cada seção do documento
 */

import { getTrpFieldLabel } from './trpLabels';

export interface FieldSection {
  title: string;
  fieldNames: string[];
}

/**
 * Define as seções e seus campos
 * Campos não listados aqui serão exibidos em uma seção "Outros" no final
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
    fieldNames: [
      'regime_fornecimento',
      'competencia_mes_ano',
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
    fieldNames: [
      'observacoes',
      'observacoes_recebimento',
    ],
  },
  {
    title: 'ASSINATURAS',
    fieldNames: [
      'fiscal_contrato_nome',
      'area_demandante_nome',
      'data_assinatura',
    ],
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
 * Campos que devem ser exibidos mesmo se vazios
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
 * Organiza campos por seções
 */
export function organizeFieldsBySections(
  campos: Record<string, unknown>
): Array<{
  section: FieldSection;
  fields: Array<{ fieldName: string; label: string; value: unknown }>;
}> {
  const allFieldNames = new Set(Object.keys(campos));
  const usedFields = new Set<string>();
  const result: Array<{
    section: FieldSection;
    fields: Array<{ fieldName: string; label: string; value: unknown }>;
  }> = [];

  // Processar cada seção definida
  for (const section of trpFieldSections) {
    const fields: Array<{ fieldName: string; label: string; value: unknown }> = [];

    for (const fieldName of section.fieldNames) {
      if (allFieldNames.has(fieldName)) {
        const value = campos[fieldName];
        // Incluir se: sempre mostrar OU tem valor OU não é null/undefined/string vazia
        if (
          alwaysShowFields.has(fieldName) ||
          (value !== null && value !== undefined && value !== '')
        ) {
          fields.push({
            fieldName,
            label: getTrpFieldLabel(fieldName),
            value,
          });
          usedFields.add(fieldName);
        }
      }
    }

    if (fields.length > 0) {
      result.push({ section, fields });
    }
  }

  // Adicionar campos não categorizados em "OUTROS"
  const otherFields: Array<{ fieldName: string; label: string; value: unknown }> = [];
  for (const [fieldName, value] of Object.entries(campos)) {
    if (
      !ignoredFields.has(fieldName) &&
      !usedFields.has(fieldName) &&
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      otherFields.push({
        fieldName,
        label: getTrpFieldLabel(fieldName),
        value,
      });
    }
  }

  if (otherFields.length > 0) {
    result.push({
      section: { title: 'OUTROS', fieldNames: [] },
      fields: otherFields,
    });
  }

  return result;
}

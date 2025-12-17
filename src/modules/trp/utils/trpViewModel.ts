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
  contexto_recebimento_raw?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrpViewModel {
  // Documento
  documento_markdown: string;
  
  // Campos normalizados (completo) - ✅ DINÂMICO: aceita qualquer campo do backend
  campos: TrpCamposNormalizados & Record<string, unknown>;
  
  // Metadados
  runId: string;
  createdAt?: string;
  status: string;
}

/**
 * Extrai informações de assinatura do markdown
 */
function extractSignaturesFromMarkdown(markdown: string): {
  fiscal_contrato_nome?: string | null;
  area_demandante_nome?: string | null;
  data_assinatura?: string | null;
} {
  const result: {
    fiscal_contrato_nome?: string | null;
    area_demandante_nome?: string | null;
    data_assinatura?: string | null;
  } = {};
  
  if (!markdown) return result;
  
  // Tentar extrair Fiscal do Contrato
  const fiscalMatch = markdown.match(/(?:Fiscal do Contrato|Fiscal)[:\s]*([^\n]+)/i);
  if (fiscalMatch && fiscalMatch[1]) {
    result.fiscal_contrato_nome = fiscalMatch[1].trim();
  }
  
  // Tentar extrair Área Demandante
  const areaMatch = markdown.match(/(?:Área Demandante|Área)[:\s]*([^\n]+)/i);
  if (areaMatch && areaMatch[1]) {
    result.area_demandante_nome = areaMatch[1].trim();
  }
  
  // Tentar extrair Data de Assinatura
  const dataMatch = markdown.match(/(?:Data de Assinatura|Data)[:\s]*([^\n]+)/i);
  if (dataMatch && dataMatch[1]) {
    result.data_assinatura = dataMatch[1].trim();
  }
  
  return result;
}

/**
 * Cria um viewModel único a partir dos dados do run
 * ✅ VERSÃO DINÂMICA: Mapeia automaticamente todos os campos do backend
 */
export function createTrpViewModel(run: TrpRunData): TrpViewModel {
  // Prioridade: documento_markdown_final > documento_markdown > ''
  const documento_markdown = run.documento_markdown_final 
    ?? run.documento_markdown 
    ?? '';
  
  // Prioridade: campos_trp_normalizados > campos_trp > campos > {}
  const camposRaw = (run.campos_trp_normalizados 
    ?? run.campos_trp 
    ?? run.campos 
    ?? {}) as Record<string, unknown>;
  
  // Extrair assinaturas do markdown (prioridade sobre campos)
  const signaturesFromMarkdown = extractSignaturesFromMarkdown(documento_markdown);
  
  // Combinar campos normalizados com contexto_recebimento_raw
  const contextoRaw = run.contexto_recebimento_raw || {};
  
  // ✅ MAPEAMENTO DINÂMICO: Combinar todos os campos automaticamente
  // Prioridade: contexto_recebimento_raw > campos_trp_normalizados
  const allFields: Record<string, unknown> = {};
  
  // Primeiro, adicionar todos os campos de camposRaw
  for (const [key, value] of Object.entries(camposRaw)) {
    if (value !== undefined && value !== null) {
      allFields[key] = value;
    }
  }
  
  // Depois, sobrescrever/adicinar campos de contextoRaw (prioridade maior)
  for (const [key, value] of Object.entries(contextoRaw)) {
    if (value !== undefined && value !== null) {
      allFields[key] = value;
    }
  }
  
  // Assinaturas: prioridade markdown > campos > contexto > createdAt
  if (signaturesFromMarkdown.fiscal_contrato_nome) {
    allFields.fiscal_contrato_nome = signaturesFromMarkdown.fiscal_contrato_nome;
  } else if (!allFields.fiscal_contrato_nome) {
    allFields.fiscal_contrato_nome = null;
  }
  
  if (signaturesFromMarkdown.area_demandante_nome) {
    allFields.area_demandante_nome = signaturesFromMarkdown.area_demandante_nome;
  } else if (!allFields.area_demandante_nome) {
    allFields.area_demandante_nome = null;
  }
  
  if (signaturesFromMarkdown.data_assinatura) {
    allFields.data_assinatura = signaturesFromMarkdown.data_assinatura;
  } else if (!allFields.data_assinatura) {
    allFields.data_assinatura = run.createdAt 
      ? new Date(run.createdAt).toLocaleDateString('pt-BR') 
      : null;
  }
  
  // Converter para o tipo esperado (mantendo compatibilidade com interface)
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
 * Obtém todos os campos relevantes que devem ser exibidos na UI
 * Retorna uma lista de { label, value, fieldName } para facilitar renderização
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
  
  // Helper para adicionar campo
  const addField = (
    fieldName: string,
    label: string,
    value: unknown,
    shouldDisplay: boolean = true
  ) => {
    let displayValue = '';
    if (value === null || value === undefined || value === '') {
      displayValue = 'Não informado';
    } else if (typeof value === 'string') {
      // Normalizar valores técnicos
      displayValue = normalizeTrpValue(value, fieldName);
    } else if (typeof value === 'number') {
      displayValue = value.toString();
    } else {
      displayValue = String(value);
    }
    
    fields.push({
      fieldName,
      label,
      value: displayValue,
      shouldDisplay: shouldDisplay && displayValue !== 'Não informado',
    });
  };
  
  // Identificação
  addField('numero_contrato', 'Número do Contrato', campos.numero_contrato);
  addField('processo_licitatorio', 'Processo Licitatório', campos.processo_licitatorio);
  addField('contratada', 'Contratada', campos.contratada);
  addField('cnpj', 'CNPJ', campos.cnpj);
  addField('vigencia', 'Vigência', campos.vigencia);
  addField('tipo_contrato', 'Tipo de Contrato', campos.tipo_contrato);
  addField('objeto_contrato', 'Objeto do Contrato', campos.objeto_contrato);
  
  // Regime de Fornecimento
  addField('regime_fornecimento', 'Regime de Fornecimento', campos.regime_fornecimento);
  addField('competencia_mes_ano', 'Competência (Mês/Ano)', campos.competencia_mes_ano, !!campos.competencia_mes_ano);
  
  // Documento Fiscal
  addField('numero_nf', 'Número da NF', campos.numero_nf);
  addField('vencimento_nf', 'Vencimento da NF', campos.vencimento_nf);
  addField('numero_empenho', 'Número do Empenho', campos.numero_empenho);
  addField('valor_efetivo_formatado', 'Valor Efetivo', campos.valor_efetivo_formatado || campos.valor_efetivo_numero);
  
  // Condições de Recebimento
  addField('tipo_base_prazo', 'Tipo de Base de Prazo', campos.tipo_base_prazo, !!campos.tipo_base_prazo);
  addField('data_recebimento', 'Data de Recebimento', campos.data_recebimento, !!campos.data_recebimento);
  addField('data_entrega', 'Data da Entrega', campos.data_entrega);
  addField('condicao_prazo', 'Condição do Prazo', campos.condicao_prazo);
  addField('condicao_quantidade', 'Condição da Quantidade', campos.condicao_quantidade);
  addField('motivo_atraso', 'Motivo do Atraso', campos.motivo_atraso, !!campos.motivo_atraso);
  addField('comentarios_quantidade_ordem', 'Comentários sobre Quantidade (Ordem)', campos.comentarios_quantidade_ordem, !!campos.comentarios_quantidade_ordem);
  addField('comentarios_quantidade_nf', 'Comentários sobre Quantidade (NF)', campos.comentarios_quantidade_nf, !!campos.comentarios_quantidade_nf);
  
  // Observações
  addField('observacoes', 'Observações', campos.observacoes);
  addField('observacoes_recebimento', 'Observações do Recebimento', campos.observacoes_recebimento, !!campos.observacoes_recebimento);
  
  return fields;
}

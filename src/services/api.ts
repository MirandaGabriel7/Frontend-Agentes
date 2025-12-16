import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Tipos para a nova API de geração de TRP
export interface TrpRunResult {
  documento_markdown: string;
  campos: Record<string, any>; // Usar any para permitir acesso direto aos campos
}

// Estrutura real retornada pelo backend
export interface TrpBackendResponse {
  documento_markdown_final?: string;
  documento_markdown_prime?: string;
  documento_markdown?: string; // fallback
  campos_trp_normalizados?: Record<string, unknown>;
  campos_trp?: Record<string, unknown>; // fallback
  campos?: Record<string, unknown>; // fallback
  camposTrpNormalizados?: Record<string, unknown>; // fallback camelCase
}

export interface TrpGenerateApiResponse {
  success: boolean;
  data?: TrpBackendResponse;
  message?: string;
}

export interface GenerateTrpParams {
  dadosRecebimento: {
    tipoContratacao: string; // "BENS" | "SERVIÇOS" | "OBRA"
    competenciaMesAno?: string | null; // MM/AAAA (só quando tipoContratacao == "SERVIÇOS")
    tipoBasePrazo: string; // "DATA_RECEBIMENTO" | "SERVICO"
    dataRecebimento?: string | null; // DD/MM/AAAA ou YYYY-MM-DD (quando base = DATA_RECEBIMENTO)
    dataConclusaoServico?: string | null; // DD/MM/AAAA ou YYYY-MM-DD (quando base = SERVICO)
    dataPrevistaEntregaContrato?: string | null; // DD/MM/AAAA ou YYYY-MM-DD
    dataEntregaReal?: string | null; // DD/MM/AAAA ou YYYY-MM-DD
    condicaoPrazo: string; // "NO_PRAZO" | "FORA_DO_PRAZO"
    motivoAtraso?: string | null; // (quando FORA_DO_PRAZO)
    condicaoQuantidadeOrdem: string; // "TOTAL" | "PARCIAL"
    comentariosQuantidadeOrdem?: string | null; // (quando PARCIAL)
    condicaoQuantidadeNF: string; // "TOTAL" | "PARCIAL"
    comentariosQuantidadeNF?: string | null; // (quando PARCIAL)
    observacoesRecebimento?: string | null;
    // Nota: Assinaturas (fiscalContratoNome, dataAssinatura, areaDemandanteNome) 
    // serão preenchidas automaticamente pelo sistema a partir dos documentos
  };
  files: {
    fichaContratualizacao: File | null;
    notaFiscal: File | null;
    ordemFornecimento: File | null;
  };
}

export async function generateTrp(params: GenerateTrpParams): Promise<TrpRunResult> {
  const formData = new FormData();
  formData.append('dadosRecebimento', JSON.stringify(params.dadosRecebimento));

  if (params.files.fichaContratualizacao) {
    formData.append('fichaContratualizacao', params.files.fichaContratualizacao);
  }
  if (params.files.notaFiscal) {
    formData.append('notaFiscal', params.files.notaFiscal);
  }
  if (params.files.ordemFornecimento) {
    formData.append('ordemFornecimento', params.files.ordemFornecimento);
  }

  const response = await api.post<TrpGenerateApiResponse>(
    '/trp/generate',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  // IMPORTANTÍSSIMO: O backend SEMPRE retorna com wrapper { success, data }
  // axios já extrai response.data automaticamente, então response.data já é o objeto completo
  const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  
  if (isDev) {
    console.debug('[TRP API] Response data shape:', {
      keys: Object.keys(response.data),
      hasSuccess: 'success' in response.data,
      hasData: 'data' in response.data,
    });
  }

  // Extrair o wrapper { success, data }
  const wrapper = response.data;
  
  // Validar success
  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || 'Falha ao gerar TRP no servidor.';
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  // Extrair data do wrapper
  if (!wrapper.data) {
    const errorMessage = 'Resposta do servidor não contém data.';
    if (isDev) {
      console.error('[TRP API]', errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result: TrpBackendResponse = wrapper.data;

  if (isDev) {
    console.debug('[TRP API] Data keys:', Object.keys(result));
    console.debug('[TRP API] Has documento_markdown_final:', !!result.documento_markdown_final);
    console.debug('[TRP API] Has documento_markdown_prime:', !!result.documento_markdown_prime);
    console.debug('[TRP API] Has campos_trp_normalizados:', !!result.campos_trp_normalizados);
    if (result.documento_markdown_final) {
      console.debug('[TRP API] documento_markdown_final length:', result.documento_markdown_final.length);
      console.debug('[TRP API] documento_markdown_final preview:', result.documento_markdown_final.substring(0, 100) + '...');
    }
    if (result.campos_trp_normalizados) {
      console.debug('[TRP API] campos_trp_normalizados keys:', Object.keys(result.campos_trp_normalizados));
    }
  }

  // Mapear campos do backend para o formato esperado pelo frontend
  // Prioridade: documento_markdown_final > documento_markdown > ''
  const documento_markdown = result.documento_markdown_final 
    ?? result.documento_markdown 
    ?? '';
  
  // Prioridade: campos_trp_normalizados > campos_trp > campos > camposTrpNormalizados > {}
  const camposRaw = result.campos_trp_normalizados 
    ?? result.campos_trp 
    ?? result.campos 
    ?? result.camposTrpNormalizados 
    ?? {};

  // Garantir que campos seja um objeto acessível (nunca undefined/null)
  const campos: Record<string, any> = (typeof camposRaw === 'object' && camposRaw !== null) 
    ? camposRaw as Record<string, any>
    : {};

  // Debug dos campos críticos (apenas em dev)
  if (isDev) {
    console.debug('[TRP API] Mapeamento final:');
    console.debug('  - documento_markdown length:', documento_markdown.length);
    console.debug('  - campos keys:', Object.keys(campos));
    console.debug('  - Campos críticos:');
    console.debug('    * vencimento_nf:', campos.vencimento_nf);
    console.debug('    * data_entrega:', campos.data_entrega);
    console.debug('    * condicao_prazo:', campos.condicao_prazo);
    console.debug('    * condicao_quantidade:', campos.condicao_quantidade);
    console.debug('    * observacoes:', campos.observacoes);
  }

  // Garantir retorno consistente (nunca undefined)
  return {
    documento_markdown: documento_markdown || '',
    campos: campos || {},
  };
}

// Funções antigas (mantidas para compatibilidade, mas não usadas no novo fluxo)
export interface UploadFileResponse {
  fileId: string;
}

export interface TrpRunRequest {
  fileId: string;
  dadosRecebimento: {
    dataRecebimento: string;
    condicaoPrazo: 'NO_PRAZO' | 'ATRASADO';
    condicaoQuantidade: 'CONFORME_EMPENHO' | 'MENOR' | 'MAIOR';
    observacoes: string | null;
  };
}

export interface TrpRunResponse {
  runId: string;
  documento_markdown: string;
  campos: Record<string, any>;
  meta: Record<string, any>;
}

export async function uploadFile(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadFileResponse>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

export async function runTrpAgent(data: TrpRunRequest): Promise<TrpRunResponse> {
  const response = await api.post<TrpRunResponse>('/agents/trp/run', data);
  return response.data;
}


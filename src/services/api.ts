import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Tipos para a nova API de geração de TRP (Supabase-first)

// Resposta do POST /trp/generate
export interface TrpGenerateResponse {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface TrpGenerateApiResponse {
  success: boolean;
  data?: TrpGenerateResponse;
  message?: string;
}

// Resposta do GET /trp/runs/:runId
export interface TrpRunData {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  documento_markdown_final?: string;
  documento_markdown_prime?: string;
  documento_markdown?: string; // fallback
  campos_trp_normalizados?: Record<string, unknown>;
  campos_trp?: Record<string, unknown>; // fallback
  campos?: Record<string, unknown>; // fallback
  camposTrpNormalizados?: Record<string, unknown>; // fallback camelCase
  createdAt?: string;
  updatedAt?: string;
}

export interface TrpRunApiResponse {
  success: boolean;
  data?: TrpRunData;
  message?: string;
}

// Resposta do GET /trp/runs?limit=20
export interface TrpRunListItem {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt?: string;
  // Campos opcionais para exibição no histórico
  numero_contrato?: string;
  numero_nf?: string;
  valor_efetivo_numero?: number;
  valor_efetivo_formatado?: string;
}

export interface TrpListRunsApiResponse {
  success: boolean;
  data?: TrpRunListItem[];
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

/**
 * Gera um novo TRP e retorna apenas runId, status e createdAt
 * O resultado completo deve ser buscado via fetchTrpRun(runId)
 */
export async function generateTrp(params: GenerateTrpParams): Promise<TrpGenerateResponse> {
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

  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
  
  if (isDev) {
    console.debug('[TRP API] Generate response:', {
      keys: Object.keys(response.data),
      hasSuccess: 'success' in response.data,
      hasData: 'data' in response.data,
    });
  }

  const wrapper = response.data;
  
  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || 'Falha ao gerar TRP no servidor.';
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  if (!wrapper.data) {
    const errorMessage = 'Resposta do servidor não contém data.';
    if (isDev) {
      console.error('[TRP API]', errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result = wrapper.data;

  if (isDev) {
    console.debug('[TRP API] Generate result:', {
      runId: result.runId,
      status: result.status,
      createdAt: result.createdAt,
    });
  }

  return result;
}

/**
 * Busca um TRP completo pelo runId
 * Fonte da verdade: backend (Supabase)
 */
export async function fetchTrpRun(runId: string): Promise<TrpRunData> {
  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
  
  if (isDev) {
    console.debug('[TRP API] Fetching run:', runId);
  }

  const response = await api.get<TrpRunApiResponse>(`/trp/runs/${runId}`);

  if (isDev) {
    console.debug('[TRP API] Fetch response:', {
      keys: Object.keys(response.data),
      hasSuccess: 'success' in response.data,
      hasData: 'data' in response.data,
    });
  }

  const wrapper = response.data;
  
  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || `Falha ao buscar TRP ${runId}`;
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  if (!wrapper.data) {
    const errorMessage = `TRP ${runId} não encontrado`;
    if (isDev) {
      console.error('[TRP API]', errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result = wrapper.data;

  if (isDev) {
    console.debug('[TRP API] Run data:', {
      runId: result.runId,
      status: result.status,
      hasDocumentoMarkdownFinal: !!result.documento_markdown_final,
      hasCamposTrpNormalizados: !!result.campos_trp_normalizados,
      documentoMarkdownFinalLength: result.documento_markdown_final?.length,
      camposKeys: result.campos_trp_normalizados ? Object.keys(result.campos_trp_normalizados) : [],
    });
  }

  return result;
}

/**
 * Lista os últimos TRPs gerados
 * Fonte da verdade: backend (Supabase)
 */
export async function listTrpRuns(limit: number = 20): Promise<TrpRunListItem[]> {
  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
  
  if (isDev) {
    console.debug('[TRP API] Listing runs with limit:', limit);
  }

  const response = await api.get<TrpListRunsApiResponse>(`/trp/runs?limit=${limit}`);

  if (isDev) {
    console.debug('[TRP API] List response:', {
      keys: Object.keys(response.data),
      hasSuccess: 'success' in response.data,
      hasData: 'data' in response.data,
      dataLength: response.data?.data?.length,
    });
  }

  const wrapper = response.data;
  
  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || 'Falha ao listar TRPs';
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  return wrapper.data || [];
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


import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '../infra/supabaseClient';
import { isUuid } from '../utils/uuid';

const baseURL = import.meta.env.VITE_TRP_API_URL
  ? `${import.meta.env.VITE_TRP_API_URL}/api`
  : '/api';

export const api: AxiosInstance = axios.create({
  baseURL,
});

// Interceptor para injetar headers de autenticação
// IMPORTANTE: Não depende de hooks/context, usa supabase diretamente
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
    let token: string | undefined;
    let orgIdValid: string | undefined;

    try {
      // 1) Buscar token do Supabase se disponível
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      }

      // 2) Buscar orgId do localStorage e validar UUID
      const orgId = localStorage.getItem('planco_active_org_id');
      if (orgId && isUuid(orgId)) {
        orgIdValid = orgId;
      }

      // 3) Setar headers apenas se token existir
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        
        // 4) Setar x-org-id apenas se orgId for válido
        if (orgIdValid) {
          config.headers['x-org-id'] = orgIdValid;
        }
      }
      // Se não existir token: não setar Authorization (requisições públicas podem continuar)
    } catch (error) {
      // Em caso de erro inesperado, continuar sem headers
      // Não quebrar requisições por causa de erro de auth
      if (isDev) {
        console.warn('[API] Erro inesperado ao injetar headers:', error);
      }
    }

    // 5) Logs apenas em dev
    if (isDev) {
      console.debug('[API]', config.method?.toUpperCase() || 'UNKNOWN', config.url || '/', {
        hasAuth: !!token,
        hasOrg: !!orgIdValid,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  nextCursor?: string;
  message?: string;
}

export interface TrpRunsSummary {
  total: number;
  completed: number;
  failed: number;
  lastExecution?: string;
}

export interface TrpRunsSummaryApiResponse {
  success: boolean;
  data?: TrpRunsSummary;
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

/**
 * Busca TRPs com filtros e paginação
 */
export interface FetchTrpRunsParams {
  limit?: number;
  cursor?: string;
  status?: 'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';
  q?: string; // Busca por número de contrato ou NF
}

export interface FetchTrpRunsResult {
  items: TrpRunListItem[];
  nextCursor?: string;
}

export async function fetchTrpRuns(params: FetchTrpRunsParams = {}): Promise<FetchTrpRunsResult> {
  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
  const { limit = 20, cursor, status, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  if (cursor) queryParams.set('cursor', cursor);
  if (status && status !== 'ALL') queryParams.set('status', status);
  if (q) queryParams.set('q', q);

  if (isDev) {
    console.debug('[TRP API] Fetching runs with params:', { limit, cursor, status, q });
  }

  const response = await api.get<TrpListRunsApiResponse>(`/trp/runs?${queryParams.toString()}`);

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || 'Falha ao buscar TRPs';
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  return {
    items: wrapper.data || [],
    nextCursor: wrapper.nextCursor,
  };
}

/**
 * Busca resumo de TRPs
 */
export async function fetchTrpRunsSummary(): Promise<TrpRunsSummary> {
  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);

  if (isDev) {
    console.debug('[TRP API] Fetching runs summary');
  }

  const response = await api.get<TrpRunsSummaryApiResponse>('/trp/runs/summary');

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || 'Falha ao buscar resumo de TRPs';
    if (isDev) {
      console.error('[TRP API] Backend retornou success !== true:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  return wrapper.data || { total: 0, completed: 0, failed: 0 };
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


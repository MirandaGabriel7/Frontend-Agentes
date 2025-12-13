import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Tipos para a nova API de geração de TRP
export interface TrpRunResult {
  documento_markdown_final: string;
  documento_markdown_prime: string;
  campos_trp_normalizados: Record<string, unknown>;
}

export interface TrpGenerateApiResponse {
  success: boolean;
  data?: TrpRunResult;
  message?: string;
}

export interface GenerateTrpParams {
  dadosRecebimento: {
    dataRecebimento: string;
    condicaoPrazo: string;
    condicaoQuantidade: string;
    observacoesRecebimento?: string | null;
    tipoBasePrazo?: string;
    tipoContratacao?: string | null; // "BENS" | "SERVIÇOS" | "OBRA"
    competenciaMesAno?: string | null; // MM/AAAA (só quando tipoContratacao == "SERVIÇOS")
    dataPrevistaEntregaContrato?: string | null;
    dataEntregaReal?: string | null;
    motivoAtraso?: string | null;
    detalhePendencias?: string | null;
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

  const body = response.data;

  if (body.success !== true) {
    throw new Error(body.message || 'Falha ao gerar TRP no servidor.');
  }
  if (!body.data) {
    throw new Error('Resposta do servidor não contém data.');
  }

  return body.data;
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
  documento_markdown_final: string;
  campos_trp_normalizados: Record<string, any>;
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


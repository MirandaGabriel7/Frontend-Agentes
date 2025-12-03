import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

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


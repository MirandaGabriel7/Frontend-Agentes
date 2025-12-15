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
    tipoContratacao: string; // "BENS" | "SERVIÇOS" | "OBRA"
    competenciaMesAno?: string | null; // MM/AAAA (só quando tipoContratacao == "SERVIÇOS")
    tipoBasePrazo: string; // "DATA_RECEBIMENTO" | "SERVICO"
    dataRecebimento?: string | null; // DD/MM/AAAA ou YYYY-MM-DD (quando base = DATA_RECEBIMENTO)
    dataConclusaoServico?: string | null; // DD/MM/AAAA ou YYYY-MM-DD (quando base = SERVICO)
    dataPrevistaEntregaContrato?: string | null; // DD/MM/AAAA ou YYYY-MM-DD
    dataEntregaReal?: string | null; // DD/MM/AAAA ou YYYY-MM-DD
    condicaoPrazo: string; // "NO_PRAZO" | "FORA_DO_PRAZO"
    motivoAtraso?: string | null; // (quando FORA_DO_PRAZO)
    detalhePendencias?: string | null; // (quando FORA_DO_PRAZO)
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


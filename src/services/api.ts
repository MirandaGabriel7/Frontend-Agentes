// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { supabase } from "../infra/supabaseClient";
import { isUuid } from "../utils/uuid";

// ✅ Tipos TRP (ajuste o path se necessário)
import type {
  TrpTipoContrato,
  TrpCondicaoPrazo,
  TrpCondicaoQuantidade,
  TrpTipoBasePrazo,
  TrpItemObjetoPayload,
  TrpVencimentoTipo, // ✅ NOVO
} from "../lib/types/trp";

function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();
  if (!s) return null;

  // remove quebras, tabs, e normaliza espaços
  s = s
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // remove caracteres problemáticos para filename/logs
  s = s
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // limite simples (para não ficar gigante)
  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

// Configuração do baseURL:
// - Se VITE_TRP_API_URL estiver definido: usa `${VITE_TRP_API_URL}/api` (ex: http://localhost:4000/api)
// - Caso contrário: usa '/api' que será proxyado pelo Vite (vite.config.ts) para http://localhost:4000
const baseURL = import.meta.env.VITE_TRP_API_URL
  ? `${import.meta.env.VITE_TRP_API_URL}/api`
  : "/api";

export const api: AxiosInstance = axios.create({
  baseURL,
});

// Interceptor para injetar headers de autenticação
// IMPORTANTE: Não depende de hooks/context, usa supabase diretamente
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isDev =
      import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

    let token: string | undefined;
    let orgIdValid: string | undefined;

    try {
      // 1) Buscar token do Supabase se disponível
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      }

      // 2) Buscar orgId do localStorage e validar UUID
      const orgId = localStorage.getItem("planco_active_org_id");
      if (orgId && isUuid(orgId)) {
        orgIdValid = orgId;
      }

      // 3) Setar headers apenas se token existir
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;

        // 4) Setar x-org-id apenas se orgId for válido
        if (orgIdValid) {
          config.headers["x-org-id"] = orgIdValid;
        }
      }
      // Se não existir token: não setar Authorization (requisições públicas podem continuar)
    } catch (error) {
      // Em caso de erro inesperado, continuar sem headers
      // Não quebrar requisições por causa de erro de auth
      if (isDev) {
        console.warn("[API] Erro inesperado ao injetar headers:", error);
      }
    }

    // 5) Logs apenas em dev
    if (isDev) {
      console.debug(
        "[API]",
        config.method?.toUpperCase() || "UNKNOWN",
        config.url || "/",
        {
          hasAuth: !!token,
          hasOrg: !!orgIdValid,
        },
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ===================================================
// Tipos para a nova API de geração de TRP (Supabase-first)
// ===================================================

// Resposta do POST /trp/generate
export interface TrpGenerateResponse {
  runId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
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
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

  // ✅ NOVO: nome do termo (preferencial / top-level vindo do backend)
  // (se o backend ainda não enviar, será preenchido por fallback no fetchTrpRun)
  fileName?: string | null;

  documento_markdown_final?: string;
  documento_markdown_prime?: string;
  documento_markdown?: string; // fallback

  campos_trp_normalizados?: Record<string, unknown>;
  campos_trp?: Record<string, unknown>; // fallback
  campos?: Record<string, unknown>; // fallback
  camposTrpNormalizados?: Record<string, unknown>; // fallback camelCase

  // ✅ tipado com fallback para fileName dentro do contexto
  contexto_recebimento_raw?: { fileName?: string | null } & Record<
    string,
    unknown
  >;

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
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt?: string;

  // ✅ opcional: permite mostrar no histórico se backend mandar (não quebra se não mandar)
  fileName?: string | null;

  // Campos opcionais para exibição no histórico
  numero_contrato?: string;
  numero_nf?: string;
  valor_efetivo_numero?: number;
  valor_efetivo_formatado?: string;
}

export interface TrpListRunsApiResponse {
  success: boolean;
  // ✅ Backend retorna: { items: TrpRunListItem[], nextCursor?: string }
  data?: TrpRunListItem[] | { items: TrpRunListItem[]; nextCursor?: string };
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

// ===================================================
// ✅ Payload do generate (NOVO) — com itens_objeto + prazos CIAS
// ===================================================

export interface GenerateTrpParams {
  dadosRecebimento: {
    // ✅ tipado de verdade
    tipoContratacao: TrpTipoContrato;

    // ✅ FOCO: nome simples que o fiscal preenche (vai para o N8N como fileName)
    fileName?: string | null;

    // ✅ NOVO (OFICIAL): itens detalhados (obrigatório)
    itens_objeto: TrpItemObjetoPayload[];

    // ✅ NOVO: total geral (opcional)
    valor_total_geral?: number | null;

    // ✅ campos de prazo/datas
    competenciaMesAno?: string | null; // MM/AAAA (só quando tipoContratacao == "SERVIÇOS")
    tipoBasePrazo: TrpTipoBasePrazo; // "DATA_RECEBIMENTO" | "INICIO_SERVICO" | "SERVICO"
    dataRecebimento?: string | null;
    dataInicioServico?: string | null;
    dataConclusaoServico?: string | null;
    dataPrevistaEntregaContrato?: string | null;
    dataEntregaReal?: string | null;

    // ✅ NOVO: prazos CIAS
    prazoProvisorioDiasUteis?: number | null;
    prazoDefinitivoDiasUteis?: number | null;

    // ✅ NOVO: vencimento CIAS
    vencimentoTipo?: TrpVencimentoTipo | null; // "DIAS_CORRIDOS" | "DIA_FIXO"
    vencimentoDiasCorridos?: number | null;
    vencimentoDiaFixo?: number | null;

    condicaoPrazo: TrpCondicaoPrazo;
    motivoAtraso?: string | null;

    condicaoQuantidadeOrdem: TrpCondicaoQuantidade;
    comentariosQuantidadeOrdem?: string | null;

    observacoesRecebimento?: string | null;

    // ⚠️ LEGADO (compatibilidade): manter por enquanto
    objetoFornecido?: string | null;
    unidade_medida?: string | null;
    quantidade_recebida?: number | null;
    valor_unitario?: number | null;
    valor_total_calculado?: number | null;
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
export async function generateTrp(
  params: GenerateTrpParams,
): Promise<TrpGenerateResponse> {
  // ✅ validação mínima do novo fluxo
  if (
    !params.dadosRecebimento?.itens_objeto ||
    params.dadosRecebimento.itens_objeto.length === 0
  ) {
    throw new Error(
      'Informe pelo menos 1 item em "itens_objeto" para gerar o TRP.',
    );
  }

  // ✅ validação da data-base conforme tipoBasePrazo
  const base = params.dadosRecebimento.tipoBasePrazo;

  if (base === "DATA_RECEBIMENTO" && !params.dadosRecebimento.dataRecebimento) {
    throw new Error(
      'Informe "dataRecebimento" quando a base do prazo for DATA_RECEBIMENTO.',
    );
  }

  if (base === "INICIO_SERVICO" && !params.dadosRecebimento.dataInicioServico) {
    throw new Error(
      'Informe "dataInicioServico" quando a base do prazo for INICIO_SERVICO.',
    );
  }

  if (base === "SERVICO" && !params.dadosRecebimento.dataConclusaoServico) {
    throw new Error(
      'Informe "dataConclusaoServico" quando a base do prazo for SERVICO.',
    );
  }

  // ✅ NOVO: validação mínima dos prazos CIAS
  const pProv = params.dadosRecebimento.prazoProvisorioDiasUteis;
  const pDef = params.dadosRecebimento.prazoDefinitivoDiasUteis;

  if (pProv === undefined || pProv === null || !Number.isFinite(pProv) || pProv < 0) {
    throw new Error(
      'Informe "prazoProvisorioDiasUteis" (>= 0) para gerar o TRP.',
    );
  }

  if (pDef === undefined || pDef === null || !Number.isFinite(pDef) || pDef < 0) {
    throw new Error(
      'Informe "prazoDefinitivoDiasUteis" (>= 0) para gerar o TRP.',
    );
  }

  // ✅ NOVO: validação mínima do vencimento CIAS
  const vTipo = params.dadosRecebimento.vencimentoTipo;

  if (!vTipo) {
    throw new Error('Informe "vencimentoTipo" para gerar o TRP.');
  }

  if (vTipo === "DIAS_CORRIDOS") {
    const dias = params.dadosRecebimento.vencimentoDiasCorridos;
    if (dias === undefined || dias === null || !Number.isFinite(dias) || dias < 0) {
      throw new Error(
        'Informe "vencimentoDiasCorridos" (>= 0) quando vencimentoTipo for DIAS_CORRIDOS.',
      );
    }
  }

  if (vTipo === "DIA_FIXO") {
    const dia = params.dadosRecebimento.vencimentoDiaFixo;
    if (
      dia === undefined ||
      dia === null ||
      !Number.isFinite(dia) ||
      dia < 1 ||
      dia > 31
    ) {
      throw new Error(
        'Informe "vencimentoDiaFixo" (1..31) quando vencimentoTipo for DIA_FIXO.',
      );
    }
  }

  // ✅ FOCO: sanitizar e enviar fileName (nome do fiscal) dentro do JSON
  const safeFileName = sanitizeFileName(params.dadosRecebimento?.fileName);
  const dadosRecebimentoFinal = safeFileName
    ? { ...params.dadosRecebimento, fileName: safeFileName }
    : { ...params.dadosRecebimento };

  const formData = new FormData();
  formData.append("dadosRecebimento", JSON.stringify(dadosRecebimentoFinal));

  if (params.files.fichaContratualizacao) {
    formData.append(
      "fichaContratualizacao",
      params.files.fichaContratualizacao,
    );
  }
  if (params.files.notaFiscal) {
    formData.append("notaFiscal", params.files.notaFiscal);
  }
  if (params.files.ordemFornecimento) {
    formData.append("ordemFornecimento", params.files.ordemFornecimento);
  }

  const response = await api.post<TrpGenerateApiResponse>(
    "/trp/generate",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (isDev) {
    console.debug("[TRP API] Generate response:", {
      keys: Object.keys(response.data),
      hasSuccess: "success" in response.data,
      hasData: "data" in response.data,
    });
  }

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || "Falha ao gerar TRP no servidor.";
    if (isDev) {
      console.error(
        "[TRP API] Backend retornou success !== true:",
        errorMessage,
      );
    }
    throw new Error(errorMessage);
  }

  if (!wrapper.data) {
    const errorMessage = "Resposta do servidor não contém data.";
    if (isDev) {
      console.error("[TRP API]", errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result = wrapper.data;

  if (isDev) {
    console.debug("[TRP API] Generate result:", {
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
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (isDev) {
    console.debug("[TRP API] Fetching run:", runId);
  }

  const response = await api.get<TrpRunApiResponse>(`/trp/runs/${runId}`);

  if (isDev) {
    console.debug("[TRP API] Fetch response:", {
      keys: Object.keys(response.data),
      hasSuccess: "success" in response.data,
      hasData: "data" in response.data,
    });
  }

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || `Falha ao buscar TRP ${runId}`;
    if (isDev) {
      console.error(
        "[TRP API] Backend retornou success !== true:",
        errorMessage,
      );
    }
    throw new Error(errorMessage);
  }

  if (!wrapper.data) {
    const errorMessage = `TRP ${runId} não encontrado`;
    if (isDev) {
      console.error("[TRP API]", errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result = wrapper.data;

  // ✅ Garantir fileName no retorno (fallback do contexto_recebimento_raw)
  const ctxFileName = sanitizeFileName(
    result.contexto_recebimento_raw?.fileName,
  );
  const topFileName = sanitizeFileName(result.fileName);
  result.fileName = topFileName || ctxFileName || null;

  if (isDev) {
    console.debug("[TRP API] Run data:", {
      runId: result.runId,
      status: result.status,
      fileName: result.fileName,
      hasDocumentoMarkdownFinal: !!result.documento_markdown_final,
      hasCamposTrpNormalizados: !!result.campos_trp_normalizados,
      documentoMarkdownFinalLength: result.documento_markdown_final?.length,
      camposKeys: result.campos_trp_normalizados
        ? Object.keys(result.campos_trp_normalizados)
        : [],
      contextoKeys: result.contexto_recebimento_raw
        ? Object.keys(result.contexto_recebimento_raw)
        : [],
    });
  }

  return result;
}

/**
 * Lista os últimos TRPs gerados
 * Fonte da verdade: backend (Supabase)
 *
 * ✅ Backend retorna: { success: true, data: { items: [...], nextCursor: "..." } }
 */
export async function listTrpRuns(
  limit: number = 20,
): Promise<TrpRunListItem[]> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (isDev) {
    console.debug("[TRP API] Listing runs with limit:", limit);
  }

  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?limit=${limit}`,
  );

  if (isDev) {
    const d = response.data?.data as any;
    console.debug("[TRP API] List response:", {
      keys: Object.keys(response.data),
      hasSuccess: "success" in response.data,
      hasData: "data" in response.data,
      dataType: typeof response.data?.data,
      isArray: Array.isArray(response.data?.data),
      hasItems: !!(d && typeof d === "object" && "items" in d),
    });
  }

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || "Falha ao listar TRPs";
    if (isDev) {
      console.error(
        "[TRP API] Backend retornou success !== true:",
        errorMessage,
      );
    }
    throw new Error(errorMessage);
  }

  // ✅ CORRETO: Backend retorna { items: [...], nextCursor: "..." }
  // Se wrapper.data for um objeto com items, usar items
  // Se wrapper.data for um array (compatibilidade), usar diretamente
  if (
    wrapper.data &&
    typeof wrapper.data === "object" &&
    "items" in wrapper.data
  ) {
    return (wrapper.data as { items: TrpRunListItem[] }).items || [];
  }

  // Fallback para compatibilidade (se backend retornar array diretamente)
  if (Array.isArray(wrapper.data)) {
    return wrapper.data;
  }

  return [];
}

/**
 * Busca TRPs com filtros e paginação
 */
export interface FetchTrpRunsParams {
  limit?: number;
  cursor?: string;
  status?: "ALL" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING";
  q?: string; // Busca por número de contrato ou NF
}

export interface FetchTrpRunsResult {
  items: TrpRunListItem[];
  nextCursor?: string;
}

export async function fetchTrpRuns(
  params: FetchTrpRunsParams = {},
): Promise<FetchTrpRunsResult> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  const { limit = 20, cursor, status, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("limit", limit.toString());
  if (cursor) queryParams.set("cursor", cursor);
  if (status && status !== "ALL") queryParams.set("status", status);
  if (q) queryParams.set("q", q);

  if (isDev) {
    console.debug("[TRP API] Fetching runs with params:", {
      limit,
      cursor,
      status,
      q,
    });
  }

  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?${queryParams.toString()}`,
  );

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || "Falha ao buscar TRPs";
    if (isDev) {
      console.error(
        "[TRP API] Backend retornou success !== true:",
        errorMessage,
      );
    }
    throw new Error(errorMessage);
  }

  // ✅ CORRETO: Backend retorna { success: true, data: { items: [...], nextCursor: "..." } }
  // Se wrapper.data for um objeto com items, usar items e nextCursor de dentro
  // Se wrapper.data for um array (compatibilidade), usar diretamente
  if (
    wrapper.data &&
    typeof wrapper.data === "object" &&
    "items" in wrapper.data
  ) {
    const dataObj = wrapper.data as {
      items: TrpRunListItem[];
      nextCursor?: string;
    };
    return {
      items: dataObj.items || [],
      nextCursor: dataObj.nextCursor || wrapper.nextCursor,
    };
  }

  // Fallback para compatibilidade (se backend retornar array diretamente)
  if (Array.isArray(wrapper.data)) {
    return {
      items: wrapper.data,
      nextCursor: wrapper.nextCursor,
    };
  }

  return {
    items: [],
    nextCursor: wrapper.nextCursor,
  };
}

/**
 * Busca resumo de TRPs
 */
export async function fetchTrpRunsSummary(): Promise<TrpRunsSummary> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (isDev) {
    console.debug("[TRP API] Fetching runs summary");
  }

  const response =
    await api.get<TrpRunsSummaryApiResponse>("/trp/runs/summary");

  const wrapper = response.data;

  if (wrapper.success !== true) {
    const errorMessage = wrapper.message || "Falha ao buscar resumo de TRPs";
    if (isDev) {
      console.error(
        "[TRP API] Backend retornou success !== true:",
        errorMessage,
      );
    }
    throw new Error(errorMessage);
  }

  return wrapper.data || { total: 0, completed: 0, failed: 0 };
}

// ===================================================
// ⚠️ Funções antigas (mantidas para compatibilidade, mas não usadas no novo fluxo)
// (Você pode remover depois que confirmar que não há imports em lugar nenhum.)
// ===================================================

export interface UploadFileResponse {
  fileId: string;
}

export interface TrpRunRequest {
  fileId: string;
  dadosRecebimento: {
    dataRecebimento: string;
    condicaoPrazo: "NO_PRAZO" | "ATRASADO";
    condicaoQuantidade: "CONFORME_EMPENHO" | "MENOR" | "MAIOR";
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
  formData.append("file", file);

  const response = await api.post<UploadFileResponse>(
    "/files/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function runTrpAgent(
  data: TrpRunRequest,
): Promise<TrpRunResponse> {
  const response = await api.post<TrpRunResponse>("/agents/trp/run", data);
  return response.data;
}

/**
 * Extrai o filename do header Content-Disposition
 * Suporta formatos: filename="arquivo.pdf", filename=arquivo.pdf, filename*=UTF-8''arquivo.pdf
 */
function extractFilenameFromDisposition(header?: string | null): string | null {
  if (!header) return null;

  // Buscar por filename= ou filename*=
  const filenameMatch = header.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
  if (!filenameMatch) return null;

  let filename = filenameMatch[1];

  // Remover aspas
  if (filename.startsWith('"') && filename.endsWith('"')) {
    filename = filename.slice(1, -1);
  } else if (filename.startsWith("'") && filename.endsWith("'")) {
    filename = filename.slice(1, -1);
  }

  // Tratar formato filename*=UTF-8''arquivo.pdf
  if (filename.includes("''")) {
    filename = filename.split("''")[1];
  }

  // Decodificar URI encoding se necessário
  try {
    filename = decodeURIComponent(filename);
  } catch {
    // Se falhar, usar o filename como está
  }

  // Sanitizar mínimo: remover caracteres perigosos
  filename = filename.replace(/[<>:"/\\|?*]/g, "_").trim();

  return filename || null;
}

/**
 * Faz download de um TRP em PDF ou DOCX
 *
 * ✅ ENDPOINT SEMPRE: GET /api/trp/runs/${runId}/download?format=pdf|docx
 * ✅ runId DEVE vir do parâmetro da URL (TrpResultPage) ou do item da lista (TrpHistoryPage)
 * ✅ NUNCA usar estado global, "último run" ou qualquer outra fonte
 *
 * @param runId ID do run do TRP (obrigatório, deve ser validado antes de chamar esta função)
 * @param format Formato do arquivo: 'pdf' ou 'docx'
 * @throws Error com mensagem apropriada para cada tipo de erro
 */
export async function downloadTrpRun(
  runId: string,
  format: "pdf" | "docx",
): Promise<void> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  // ✅ VALIDAÇÃO CRÍTICA: runId é obrigatório e deve ser string não vazia
  if (!runId || typeof runId !== "string" || runId.trim() === "") {
    throw new Error("runId é obrigatório e deve ser uma string válida");
  }

  // ✅ VALIDAÇÃO: runId deve ser UUID válido
  if (!isUuid(runId)) {
    throw new Error("runId deve ser um UUID válido");
  }

  if (isDev) {
    console.debug("[TRP Download] Iniciando download:", { runId, format });
  }

  // IMPORTANT: validateStatus: () => true para tratar erros manualmente
  // Quando responseType: 'blob', erros HTTP ainda retornam como blob (JSON de erro)
  // ✅ Endpoint: GET /api/trp/runs/${runId}/download?format=${format}
  const res = await api.get(`/trp/runs/${runId}/download`, {
    params: { format },
    responseType: "blob",
    validateStatus: () => true, // Não lançar exceção automaticamente
  });

  if (isDev) {
    console.debug("[TRP Download] Resposta recebida:", {
      status: res.status,
      contentType: res.headers["content-type"] || res.headers["Content-Type"],
      contentDisposition:
        res.headers["content-disposition"] ||
        res.headers["Content-Disposition"],
    });
  }

  // Se backend retornou erro (status >= 400), o blob pode conter JSON de erro
  if (res.status >= 400) {
    try {
      // Tentar converter blob para texto e parsear como JSON
      const text = await new Response(res.data).text();
      let msg = `Falha no download (${res.status})`;

      try {
        const json = JSON.parse(text);
        msg = json.message || json.error || msg;
      } catch {
        // Se não for JSON, usar o texto como está (ou mensagem padrão)
        if (text && text.length < 200) {
          msg = text;
        }
      }

      if (isDev) {
        console.error("[TRP Download] Erro HTTP:", {
          status: res.status,
          message: msg,
        });
      }

      // Criar erro com status para tratamento específico
      const error = Object.assign(new Error(msg), { status: res.status });

      // Mapear status codes para mensagens específicas conforme requisitos
      switch (res.status) {
        case 401:
          throw Object.assign(new Error("Sessão expirada / sem permissão"), {
            status: 401,
          });
        case 403:
          throw Object.assign(new Error("Sessão expirada / sem permissão"), {
            status: 403,
          });
        case 404:
          throw Object.assign(new Error("Documento não encontrado"), {
            status: 404,
          });
        case 409:
          throw Object.assign(new Error("Documento ainda não finalizado"), {
            status: 409,
          });
        case 429:
          throw Object.assign(new Error("Aguarde antes de gerar novamente"), {
            status: 429,
          });
        default:
          throw error;
      }
    } catch (err: any) {
      // Se já é um erro nosso (com status), re-lançar
      if (err.status) {
        throw err;
      }
      // Caso contrário, lançar erro genérico
      throw Object.assign(
        new Error(err.message || `Erro ao baixar arquivo (${res.status})`),
        { status: res.status },
      );
    }
  }

  // Sucesso: extrair filename e fazer download
  const disposition =
    res.headers["content-disposition"] || res.headers["Content-Disposition"];
  let filename = extractFilenameFromDisposition(disposition);

  // ✅ Fallback: usar runId se não encontrar no header
  // O backend deve enviar o filename correto no Content-Disposition
  if (!filename) {
    filename = `TRP_${runId}.${format}`;
  }

  if (isDev) {
    console.debug("[TRP Download] Filename extraído:", filename);
  }

  // Criar blob com o tipo correto do header ou fallback
  const contentType =
    res.headers["content-type"] || res.headers["Content-Type"];
  const blob = new Blob([res.data], {
    type:
      contentType ||
      (format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  });

  // Criar link temporário e fazer download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  if (isDev) {
    console.debug("[TRP Download] Download concluído:", filename);
  }
}

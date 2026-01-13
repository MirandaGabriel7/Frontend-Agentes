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
const baseURL = import.meta.env.VITE_TRP_API_URL
  ? `${import.meta.env.VITE_TRP_API_URL}/api`
  : "/api";

export const api: AxiosInstance = axios.create({
  baseURL,
});

// Interceptor para injetar headers de autenticação
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isDev =
      import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

    let token: string | undefined;
    let orgIdValid: string | undefined;

    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      }

      const orgId = localStorage.getItem("planco_active_org_id");
      if (orgId && isUuid(orgId)) {
        orgIdValid = orgId;
      }

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        if (orgIdValid) {
          config.headers["x-org-id"] = orgIdValid;
        }
      }
    } catch (error) {
      if (isDev) {
        console.warn("[API] Erro inesperado ao injetar headers:", error);
      }
    }

    if (isDev) {
      console.debug(
        "[API]",
        config.method?.toUpperCase() || "UNKNOWN",
        config.url || "/",
        { hasAuth: !!token, hasOrg: !!orgIdValid }
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===================================================
// Tipos para a nova API de geração de TRP (Supabase-first)
// ===================================================

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

export interface TrpRunData {
  runId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

  fileName?: string | null;

  documento_markdown_final?: string;
  documento_markdown_prime?: string;
  documento_markdown?: string;

  campos_trp_normalizados?: Record<string, unknown>;
  campos_trp?: Record<string, unknown>;
  campos?: Record<string, unknown>;
  camposTrpNormalizados?: Record<string, unknown>;

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

export interface TrpRunListItem {
  runId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt?: string;

  fileName?: string | null;

  numero_contrato?: string;
  numero_nf?: string;
  valor_efetivo_numero?: number;
  valor_efetivo_formatado?: string;
}

export interface TrpListRunsApiResponse {
  success: boolean;
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
// ✅ Payload do generate (NOVO) — com itens_objeto
// ===================================================

export interface GenerateTrpParams {
  dadosRecebimento: {
    tipoContratacao: TrpTipoContrato;
    fileName?: string | null;

    itens_objeto: TrpItemObjetoPayload[];

    valor_total_geral?: number | null;

    competenciaMesAno?: string | null;
    tipoBasePrazo: TrpTipoBasePrazo;
    dataRecebimento?: string | null;
    dataConclusaoServico?: string | null;
    dataPrevistaEntregaContrato?: string | null;
    dataEntregaReal?: string | null;

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

export async function generateTrp(
  params: GenerateTrpParams
): Promise<TrpGenerateResponse> {
  if (
    !params.dadosRecebimento?.itens_objeto ||
    params.dadosRecebimento.itens_objeto.length === 0
  ) {
    throw new Error(
      'Informe pelo menos 1 item em "itens_objeto" para gerar o TRP.'
    );
  }

  const safeFileName = sanitizeFileName(params.dadosRecebimento?.fileName);
  const dadosRecebimentoFinal = safeFileName
    ? { ...params.dadosRecebimento, fileName: safeFileName }
    : { ...params.dadosRecebimento };

  const formData = new FormData();
  formData.append("dadosRecebimento", JSON.stringify(dadosRecebimentoFinal));

  if (params.files.fichaContratualizacao) {
    formData.append(
      "fichaContratualizacao",
      params.files.fichaContratualizacao
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
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  const wrapper = response.data;

  if (isDev) {
    console.debug("[TRP API] Generate response:", {
      success: wrapper?.success,
      hasData: !!wrapper?.data,
      message: wrapper?.message,
    });
  }

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || "Falha ao gerar TRP no servidor.");
  }

  if (!wrapper.data) {
    throw new Error("Resposta do servidor não contém data.");
  }

  return wrapper.data;
}

export async function fetchTrpRun(runId: string): Promise<TrpRunData> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (isDev) console.debug("[TRP API] Fetching run:", runId);

  const response = await api.get<TrpRunApiResponse>(`/trp/runs/${runId}`);

  const wrapper = response.data;

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || `Falha ao buscar TRP ${runId}`);
  }

  if (!wrapper.data) {
    throw new Error(`TRP ${runId} não encontrado`);
  }

  const result = wrapper.data;

  const ctxFileName = sanitizeFileName(
    result.contexto_recebimento_raw?.fileName
  );
  const topFileName = sanitizeFileName(result.fileName);
  result.fileName = topFileName || ctxFileName || null;

  if (isDev) {
    console.debug("[TRP API] Run data:", {
      runId: result.runId,
      status: result.status,
      fileName: result.fileName,
    });
  }

  return result;
}

export async function listTrpRuns(
  limit: number = 20
): Promise<TrpRunListItem[]> {
  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?limit=${limit}`
  );

  const wrapper = response.data;

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || "Falha ao listar TRPs");
  }

  if (
    wrapper.data &&
    typeof wrapper.data === "object" &&
    "items" in wrapper.data
  ) {
    return (wrapper.data as { items: TrpRunListItem[] }).items || [];
  }

  if (Array.isArray(wrapper.data)) return wrapper.data;

  return [];
}

export interface FetchTrpRunsParams {
  limit?: number;
  cursor?: string;
  status?: "ALL" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING";
  q?: string;
}

export interface FetchTrpRunsResult {
  items: TrpRunListItem[];
  nextCursor?: string;
}

export async function fetchTrpRuns(
  params: FetchTrpRunsParams = {}
): Promise<FetchTrpRunsResult> {
  const { limit = 20, cursor, status, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("limit", limit.toString());
  if (cursor) queryParams.set("cursor", cursor);
  if (status && status !== "ALL") queryParams.set("status", status);
  if (q) queryParams.set("q", q);

  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?${queryParams.toString()}`
  );

  const wrapper = response.data;

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || "Falha ao buscar TRPs");
  }

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

  if (Array.isArray(wrapper.data)) {
    return { items: wrapper.data, nextCursor: wrapper.nextCursor };
  }

  return { items: [], nextCursor: wrapper.nextCursor };
}

export async function fetchTrpRunsSummary(): Promise<TrpRunsSummary> {
  const response = await api.get<TrpRunsSummaryApiResponse>(
    "/trp/runs/summary"
  );

  const wrapper = response.data;

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || "Falha ao buscar resumo de TRPs");
  }

  return wrapper.data || { total: 0, completed: 0, failed: 0 };
}

// ===================================================
// ⚠️ Funções antigas (mantidas para compatibilidade)
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
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export async function runTrpAgent(
  data: TrpRunRequest
): Promise<TrpRunResponse> {
  const response = await api.post<TrpRunResponse>("/agents/trp/run", data);
  return response.data;
}

function extractFilenameFromDisposition(header?: string | null): string | null {
  if (!header) return null;

  const filenameMatch = header.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
  if (!filenameMatch) return null;

  let filename = filenameMatch[1];

  if (filename.startsWith('"') && filename.endsWith('"')) {
    filename = filename.slice(1, -1);
  } else if (filename.startsWith("'") && filename.endsWith("'")) {
    filename = filename.slice(1, -1);
  }

  if (filename.includes("''")) {
    filename = filename.split("''")[1];
  }

  try {
    filename = decodeURIComponent(filename);
  } catch {
    // ignore
  }

  filename = filename.replace(/[<>:"/\\|?*]/g, "_").trim();

  return filename || null;
}

export async function downloadTrpRun(
  runId: string,
  format: "pdf" | "docx"
): Promise<void> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  if (!runId || typeof runId !== "string" || runId.trim() === "") {
    throw new Error("runId é obrigatório e deve ser uma string válida");
  }

  if (!isUuid(runId)) {
    throw new Error("runId deve ser um UUID válido");
  }

  if (isDev)
    console.debug("[TRP Download] Iniciando download:", { runId, format });

  const res = await api.get(`/trp/runs/${runId}/download`, {
    params: { format },
    responseType: "blob",
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    try {
      const text = await new Response(res.data).text();
      let msg = `Falha no download (${res.status})`;

      try {
        const json = JSON.parse(text);
        msg = json.message || json.error || msg;
      } catch {
        if (text && text.length < 200) msg = text;
      }

      const error = Object.assign(new Error(msg), { status: res.status });

      switch (res.status) {
        case 401:
        case 403:
          throw Object.assign(new Error("Sessão expirada / sem permissão"), {
            status: res.status,
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
      if (err.status) throw err;
      throw Object.assign(
        new Error(err.message || `Erro ao baixar arquivo (${res.status})`),
        {
          status: res.status,
        }
      );
    }
  }

  const disposition =
    res.headers["content-disposition"] || res.headers["Content-Disposition"];
  let filename = extractFilenameFromDisposition(disposition);

  if (!filename) filename = `TRP_${runId}.${format}`;

  const contentType =
    res.headers["content-type"] || res.headers["Content-Type"];
  const blob = new Blob([res.data], {
    type:
      contentType ||
      (format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  if (isDev) console.debug("[TRP Download] Download concluído:", filename);
}

// ===================================================
// ✅ REVISÃO (EDIÇÃO) DE TRP — SEM ARQUIVOS
// ===================================================

export interface ReviseTrpResponse extends TrpGenerateResponse {}

export interface ReviseTrpApiResponse {
  success: boolean;
  data?: ReviseTrpResponse;
  message?: string;
}

type PrazosCalculadosFinal =
  | {
      provisorio?: string;
      definitivo?: string;
      liquidacao?: string;
      vencimento_nf?: string;
    }
  | null
  | undefined;

export interface ReviseTrpParams {
  runId: string;
  revisionReason?: string | null;

  // ✅ modo antigo (mantido) — revisão a partir do formulário de recebimento
  dadosRecebimento?: GenerateTrpParams["dadosRecebimento"];

  // ✅ modo novo: edição total do TRP gerado (clone do ResultPage)
  camposOverride?: Record<string, unknown>;

  // ✅ opcional: prazos final editável (se você mandar separado)
  prazosCalculadosFinal?: PrazosCalculadosFinal;
}

// remove undefined de objetos (não altera null)
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep) as any;
  }
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out;
  }
  return value;
}

function normalizePrazosPayload(
  p?: PrazosCalculadosFinal
): Record<string, string> | null {
  if (!p || typeof p !== "object") return null;

  const out: Record<string, string> = {};
  const add = (k: keyof NonNullable<PrazosCalculadosFinal>) => {
    const v = (p as any)[k];
    if (typeof v === "string" && v.trim()) out[String(k)] = v.trim();
  };

  add("provisorio");
  add("definitivo");
  add("liquidacao");
  add("vencimento_nf");

  return Object.keys(out).length ? out : null;
}

export async function reviseTrpRun(
  params: ReviseTrpParams
): Promise<ReviseTrpResponse> {
  const isDev =
    import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  const {
    runId,
    revisionReason,
    dadosRecebimento,
    camposOverride,
    prazosCalculadosFinal,
  } = params;

  if (!runId || !isUuid(runId)) {
    throw new Error("runId inválido");
  }

  const revisionReasonFinal =
    typeof revisionReason === "string"
      ? revisionReason.trim()
      : revisionReason ?? null;

  const prazosNorm = normalizePrazosPayload(prazosCalculadosFinal);

  // ✅ payload-base (não manda prazos vazio)
  const payloadBase: any = {
    revisionReason: revisionReasonFinal,
    ...(prazosNorm ? { prazosCalculadosFinal: prazosNorm } : {}),
  };

  // ✅ MODO NOVO: edição total do TRP (camposOverride)
  if (camposOverride && typeof camposOverride === "object") {
    const clean = stripUndefinedDeep({ ...(camposOverride as any) });

    // ✅ sanitiza fileName também no override
    const fileNameOverride = sanitizeFileName((clean as any).fileName);
    const cleanFinal =
      fileNameOverride !== null
        ? { ...clean, fileName: fileNameOverride }
        : clean;

    const payload = {
      ...payloadBase,
      camposOverride: cleanFinal,
    };

    const response = await api.post<ReviseTrpApiResponse>(
      `/trp/runs/${runId}/revise`,
      payload
    );

    const wrapper = response.data;

    if (isDev) {
      console.debug("[TRP API] Revise response:", {
        success: wrapper?.success,
        hasData: !!wrapper?.data,
        message: wrapper?.message,
        mode: "camposOverride",
        hasPrazos: !!prazosNorm,
      });
    }

    if (wrapper.success !== true) {
      throw new Error(wrapper.message || "Falha ao gerar nova versão do TRP.");
    }

    if (!wrapper.data) {
      throw new Error("Resposta do servidor não contém data.");
    }

    return wrapper.data;
  }

  // ✅ MODO LEGADO: revisão a partir do formulário (dadosRecebimento)
  if (!dadosRecebimento || typeof dadosRecebimento !== "object") {
    throw new Error(
      "Envie dadosRecebimento (modo legado) ou camposOverride (modo edição total)."
    );
  }

  // ✅ No legado, aí sim exigimos itens_objeto (regra atual do generate)
  if (
    !dadosRecebimento?.itens_objeto ||
    dadosRecebimento.itens_objeto.length === 0
  ) {
    throw new Error(
      'Informe pelo menos 1 item em "itens_objeto" para revisar o TRP.'
    );
  }

  const safeFileName = sanitizeFileName(dadosRecebimento?.fileName);
  const dadosRecebimentoFinal: any = safeFileName
    ? { ...dadosRecebimento, fileName: safeFileName }
    : { ...dadosRecebimento };

  const payload = {
    ...payloadBase,
    dadosRecebimento: stripUndefinedDeep(dadosRecebimentoFinal),
  };

  const response = await api.post<ReviseTrpApiResponse>(
    `/trp/runs/${runId}/revise`,
    payload
  );

  const wrapper = response.data;

  if (isDev) {
    console.debug("[TRP API] Revise response:", {
      success: wrapper?.success,
      hasData: !!wrapper?.data,
      message: wrapper?.message,
      mode: "dadosRecebimento",
      hasPrazos: !!prazosNorm,
    });
  }

  if (wrapper.success !== true) {
    throw new Error(wrapper.message || "Falha ao gerar nova versão do TRP.");
  }

  if (!wrapper.data) {
    throw new Error("Resposta do servidor não contém data.");
  }

  return wrapper.data;
}

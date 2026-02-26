// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { supabase } from "../infra/supabaseClient";
import { isUuid } from "@/features/trp/utils/uuid";

import type {
  TrpTipoContrato,
  TrpCondicaoPrazo,
  TrpCondicaoQuantidade,
  TrpTipoBasePrazo,
  TrpItemObjetoPayload,
  TrpVencimentoTipo,
} from "../lib/types/trp";

const isDev =
  import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();
  if (!s) return null;

  s = s
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  s = s
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

const baseURL = import.meta.env.VITE_TRP_API_URL
  ? `${import.meta.env.VITE_TRP_API_URL}/api`
  : "/api";

export const api: AxiosInstance = axios.create({ baseURL });

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
        { hasAuth: !!token, hasOrg: !!orgIdValid },
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface ApiWrapper<T> {
  success: boolean;
  data?: T;
  message?: string;
  nextCursor?: string;
}

function unwrapResponse<T>(wrapper: ApiWrapper<T>, fallbackMsg: string): T {
  if (wrapper.success !== true) {
    throw new Error(wrapper.message || fallbackMsg);
  }
  if (!wrapper.data) {
    throw new Error(fallbackMsg);
  }
  return wrapper.data;
}

function unwrapListItems<T>(
  wrapper: ApiWrapper<T[] | { items: T[]; nextCursor?: string }>,
  fallbackMsg: string,
): { items: T[]; nextCursor?: string | null } {
  if (wrapper.success !== true) {
    throw new Error(wrapper.message || fallbackMsg);
  }

  if (
    wrapper.data &&
    typeof wrapper.data === "object" &&
    "items" in wrapper.data
  ) {
    const dataObj = wrapper.data as { items: T[]; nextCursor?: string };
    return {
      items: dataObj.items || [],
      nextCursor: dataObj.nextCursor || wrapper.nextCursor || null,
    };
  }

  if (Array.isArray(wrapper.data)) {
    return { items: wrapper.data, nextCursor: wrapper.nextCursor || null };
  }

  return { items: [], nextCursor: wrapper.nextCursor || null };
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
    // keep as-is
  }

  filename = filename.replace(/[<>:"/\\|?*]/g, "_").trim();

  return filename || null;
}

function mapHttpStatusToMessage(status: number): string | null {
  switch (status) {
    case 401:
    case 403:
      return "Sessão expirada / sem permissão";
    case 404:
      return "Documento não encontrado";
    case 409:
      return "Documento ainda não finalizado";
    case 429:
      return "Aguarde antes de gerar novamente";
    default:
      return null;
  }
}

async function downloadRunBlob(
  endpoint: string,
  runId: string,
  format: "pdf" | "docx",
  filePrefix: string,
): Promise<void> {
  if (!runId || typeof runId !== "string" || runId.trim() === "") {
    throw new Error("runId é obrigatório e deve ser uma string válida");
  }

  const res = await api.get(endpoint, {
    params: { format },
    responseType: "blob",
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const text = await new Response(res.data).text();
    let msg = `Falha no download (${res.status})`;

    try {
      const json = JSON.parse(text);
      msg = json.message || json.error || msg;
    } catch {
      if (text && text.length < 200) msg = text;
    }

    const friendlyMsg = mapHttpStatusToMessage(res.status);
    throw Object.assign(new Error(friendlyMsg || msg), {
      status: res.status,
    });
  }

  const disposition =
    res.headers["content-disposition"] || res.headers["Content-Disposition"];
  const filename =
    extractFilenameFromDisposition(disposition) ||
    `${filePrefix}_${runId}.${format}`;

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
}

function requireNonNegativeFinite(
  value: unknown,
  fieldName: string,
): asserts value is number {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value as number) ||
    (value as number) < 0
  ) {
    throw new Error(`Informe "${fieldName}" (>= 0) para gerar o TRP.`);
  }
}

// ---------------------------------------------------------------------------
// TRP Types
// ---------------------------------------------------------------------------

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

export interface GenerateTrpParams {
  dadosRecebimento: {
    tipoContratacao: TrpTipoContrato;
    fileName?: string | null;

    itens_objeto: TrpItemObjetoPayload[];
    valor_total_geral?: number | null;

    competenciaMesAno?: string | null;
    tipoBasePrazo: TrpTipoBasePrazo;
    dataRecebimento?: string | null;
    dataInicioServico?: string | null;
    dataConclusaoServico?: string | null;
    dataPrevistaEntregaContrato?: string | null;
    dataEntregaReal?: string | null;

    prazoProvisorioDiasUteis?: number | null;
    prazoDefinitivoDiasUteis?: number | null;
    prazoLiquidacaoDiasCorridos?: number | null;

    vencimentoTipo?: TrpVencimentoTipo | null;
    vencimentoDiasCorridos?: number | null;
    vencimentoDiaFixo?: number | null;

    condicaoPrazo: TrpCondicaoPrazo;
    motivoAtraso?: string | null;

    condicaoQuantidadeOrdem: TrpCondicaoQuantidade;
    comentariosQuantidadeOrdem?: string | null;

    observacoesRecebimento?: string | null;

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

// ---------------------------------------------------------------------------
// TRP Functions
// ---------------------------------------------------------------------------

export async function generateTrp(
  params: GenerateTrpParams,
): Promise<TrpGenerateResponse> {
  const dr = params.dadosRecebimento;

  if (!dr?.itens_objeto || dr.itens_objeto.length === 0) {
    throw new Error(
      'Informe pelo menos 1 item em "itens_objeto" para gerar o TRP.',
    );
  }

  const base = dr.tipoBasePrazo;

  if (base === "DATA_RECEBIMENTO" && !dr.dataRecebimento) {
    throw new Error(
      'Informe "dataRecebimento" quando a base do prazo for DATA_RECEBIMENTO.',
    );
  }
  if (base === "INICIO_SERVICO" && !dr.dataInicioServico) {
    throw new Error(
      'Informe "dataInicioServico" quando a base do prazo for INICIO_SERVICO.',
    );
  }
  if (base === "SERVICO" && !dr.dataConclusaoServico) {
    throw new Error(
      'Informe "dataConclusaoServico" quando a base do prazo for SERVICO.',
    );
  }

  requireNonNegativeFinite(
    dr.prazoProvisorioDiasUteis,
    "prazoProvisorioDiasUteis",
  );
  requireNonNegativeFinite(
    dr.prazoDefinitivoDiasUteis,
    "prazoDefinitivoDiasUteis",
  );
  requireNonNegativeFinite(
    dr.prazoLiquidacaoDiasCorridos,
    "prazoLiquidacaoDiasCorridos",
  );

  const vTipo = dr.vencimentoTipo;

  if (!vTipo) {
    throw new Error('Informe "vencimentoTipo" para gerar o TRP.');
  }

  if (vTipo === "DIAS_CORRIDOS") {
    requireNonNegativeFinite(
      dr.vencimentoDiasCorridos,
      "vencimentoDiasCorridos",
    );
  }

  if (vTipo === "DIA_FIXO") {
    const dia = dr.vencimentoDiaFixo;
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

  const safeFileName = sanitizeFileName(dr?.fileName);
  const dadosRecebimentoFinal = safeFileName
    ? { ...dr, fileName: safeFileName }
    : { ...dr };

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
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return unwrapResponse(response.data, "Falha ao gerar TRP no servidor.");
}

export async function fetchTrpRun(runId: string): Promise<TrpRunData> {
  const response = await api.get<TrpRunApiResponse>(`/trp/runs/${runId}`);
  const result = unwrapResponse(response.data, `TRP ${runId} não encontrado`);

  const ctxFileName = sanitizeFileName(
    result.contexto_recebimento_raw?.fileName,
  );
  const topFileName = sanitizeFileName(result.fileName);
  result.fileName = topFileName || ctxFileName || null;

  return result;
}

export async function listTrpRuns(
  limit: number = 20,
): Promise<TrpRunListItem[]> {
  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?limit=${limit}`,
  );
  return unwrapListItems(response.data, "Falha ao listar TRPs").items;
}

export interface FetchTrpRunsParams {
  limit?: number;
  cursor?: string;
  status?: "ALL" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING";
  q?: string;
}

export interface FetchTrpRunsResult {
  items: TrpRunListItem[];
  nextCursor?: string | null;
}

export async function fetchTrpRuns(
  params: FetchTrpRunsParams = {},
): Promise<FetchTrpRunsResult> {
  const { limit = 20, cursor, status, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("limit", limit.toString());
  if (cursor) queryParams.set("cursor", cursor);
  if (status && status !== "ALL") queryParams.set("status", status);
  if (q) queryParams.set("q", q);

  const response = await api.get<TrpListRunsApiResponse>(
    `/trp/runs?${queryParams.toString()}`,
  );

  return unwrapListItems(response.data, "Falha ao buscar TRPs");
}

export async function fetchTrpRunsSummary(): Promise<TrpRunsSummary> {
  const response =
    await api.get<TrpRunsSummaryApiResponse>("/trp/runs/summary");

  if (response.data.success !== true) {
    throw new Error(response.data.message || "Falha ao buscar resumo de TRPs");
  }

  return response.data.data || { total: 0, completed: 0, failed: 0 };
}

export async function downloadTrpRun(
  runId: string,
  format: "pdf" | "docx",
): Promise<void> {
  if (!isUuid(runId)) {
    throw new Error("runId deve ser um UUID válido");
  }

  await downloadRunBlob(`/trp/runs/${runId}/download`, runId, format, "TRP");
}

// ---------------------------------------------------------------------------
// TRP Versioning (NEW)
// ---------------------------------------------------------------------------

export interface TrpRunVersionListItem {
  run_id: string;
  version_number: number;
  is_current: boolean;
  created_at: string;
  created_by?: string | null;

  status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  file_name?: string | null;

  // opcional, se o backend devolver
  family_id?: string | null;
}

export interface TrpListRunVersionsApiResponse {
  success: boolean;
  data?:
    | TrpRunVersionListItem[]
    | { items: TrpRunVersionListItem[]; nextCursor?: string };
  nextCursor?: string;
  message?: string;
}

export interface CreateTrpRunVersionPayload {
  // ✅ use o que a UI tem hoje:
  campos_trp_normalizados: Record<string, unknown>;

  // ✅ o markdown que você quer “fixar” como final nessa versão
  documento_markdown_final: string;

  // opcional: se você quiser guardar o prime também
  documento_markdown_prime?: string | null;

  // opcional: nome curto p/ aparecer no histórico
  file_name?: string | null;
}

export interface CreateTrpRunVersionResponse {
  run_id: string;
  version_number: number;
  is_current: boolean;
  created_at: string;

  // alguns backends devolvem isso também
  status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
}

export interface CreateTrpRunVersionApiResponse {
  success: boolean;
  data?: CreateTrpRunVersionResponse;
  message?: string;
}

export async function listTrpRunVersions(
  runId: string,
  limit: number = 50,
): Promise<TrpRunVersionListItem[]> {
  if (!isUuid(runId)) {
    throw new Error("runId deve ser um UUID válido");
  }

  const response = await api.get<TrpListRunVersionsApiResponse>(
    `/trp/runs/${runId}/versions?limit=${encodeURIComponent(String(limit))}`,
  );

  return unwrapListItems(response.data, "Falha ao listar versões do TRP").items;
}

export async function createTrpRunVersion(
  runId: string,
  payload: CreateTrpRunVersionPayload,
): Promise<CreateTrpRunVersionResponse> {
  if (!isUuid(runId)) {
    throw new Error("runId deve ser um UUID válido");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("payload é obrigatório");
  }

  const md =
    typeof payload.documento_markdown_final === "string"
      ? payload.documento_markdown_final.trim()
      : "";
  if (!md) {
    throw new Error("documento_markdown_final é obrigatório");
  }

  if (
    !payload.campos_trp_normalizados ||
    typeof payload.campos_trp_normalizados !== "object"
  ) {
    throw new Error("campos_trp_normalizados é obrigatório");
  }

  const safeFileName = sanitizeFileName(payload.file_name);

  const response = await api.post<CreateTrpRunVersionApiResponse>(
    `/trp/runs/${runId}/version`,
    {
      campos_trp_normalizados: payload.campos_trp_normalizados,
      documento_markdown_final: md,
      documento_markdown_prime: payload.documento_markdown_prime ?? null,
      file_name: safeFileName,
    },
  );

  return unwrapResponse(response.data, "Falha ao criar nova versão do TRP.");
}

// ---------------------------------------------------------------------------
// Legacy (kept for compatibility)
// ---------------------------------------------------------------------------

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
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

export async function runTrpAgent(
  data: TrpRunRequest,
): Promise<TrpRunResponse> {
  const response = await api.post<TrpRunResponse>("/agents/trp/run", data);
  return response.data;
}

// ---------------------------------------------------------------------------
// TRD Types
// ---------------------------------------------------------------------------

export type TrdRunStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface TrdGenerateResponse {
  runId: string;
  status: TrdRunStatus;
  createdAt: string;
}

export interface TrdGenerateApiResponse {
  success: boolean;
  data?: TrdGenerateResponse;
  message?: string;
}

export interface TrdRunData {
  runId: string;
  trpRunId?: string;
  status: TrdRunStatus;
  fileName?: string | null;

  documento_markdown_final?: string;
  documento_markdown_prime?: string;
  campos_trd_normalizados?: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;
}

export interface TrdRunApiResponse {
  success: boolean;
  data?: TrdRunData;
  message?: string;
}

export interface TrdRunListItem {
  runId: string;
  status: TrdRunStatus;
  createdAt: string;

  trp_run_id?: string;
  trp_created_at?: string;
  houve_ressalvas?: boolean;
}

export interface TrdListRunsApiResponse {
  success: boolean;
  data?: { items: TrdRunListItem[]; nextCursor?: string } | TrdRunListItem[];
  nextCursor?: string;
  message?: string;
}

export interface TrdRunsSummary {
  total_runs: number;
  total_completed: number;
  total_failed: number;
  last_run_at?: string | null;
  last_completed_at?: string | null;
}

export interface TrdRunsSummaryApiResponse {
  success: boolean;
  data?: TrdRunsSummary;
  message?: string;
}

export interface GenerateTrdParams {
  trp_run_id: string;
  houve_ressalvas: boolean;
  ressalvas_texto?: string | null;
}

// ---------------------------------------------------------------------------
// TRD Functions
// ---------------------------------------------------------------------------

export async function generateTrd(
  params: GenerateTrdParams,
): Promise<TrdGenerateResponse> {
  if (
    !params?.trp_run_id ||
    typeof params.trp_run_id !== "string" ||
    !params.trp_run_id.trim()
  ) {
    throw new Error("trp_run_id é obrigatório");
  }

  if (typeof params.houve_ressalvas !== "boolean") {
    throw new Error("houve_ressalvas é obrigatório (true/false)");
  }

  const rt = params.ressalvas_texto?.trim?.() ?? "";
  if (params.houve_ressalvas && rt.length === 0) {
    throw new Error("Informe o texto das ressalvas");
  }

  const response = await api.post<TrdGenerateApiResponse>("/trd/generate", {
    trp_run_id: params.trp_run_id,
    houve_ressalvas: params.houve_ressalvas,
    ressalvas_texto: params.ressalvas_texto ?? null,
    source: "UI",
  });

  return unwrapResponse(response.data, "Falha ao gerar TRD no servidor.");
}

export async function fetchTrdRun(runId: string): Promise<TrdRunData> {
  if (!runId || typeof runId !== "string" || runId.trim() === "") {
    throw new Error("runId é obrigatório e deve ser uma string válida");
  }

  const response = await api.get<TrdRunApiResponse>(`/trd/runs/${runId}`);
  return unwrapResponse(response.data, `TRD ${runId} não encontrado`);
}

export interface FetchTrdRunsParams {
  limit?: number;
  cursor?: string;
  status?: "ALL" | TrdRunStatus;
  q?: string;
}

export interface FetchTrdRunsResult {
  items: TrdRunListItem[];
  nextCursor?: string | null;
}

export async function fetchTrdRuns(
  params: FetchTrdRunsParams = {},
): Promise<FetchTrdRunsResult> {
  const { limit = 20, cursor, status, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  if (cursor) queryParams.set("cursor", cursor);
  if (status && status !== "ALL") queryParams.set("status", status);
  if (q) queryParams.set("q", q);

  const response = await api.get<TrdListRunsApiResponse>(
    `/trd/runs?${queryParams.toString()}`,
  );

  return unwrapListItems(response.data, "Falha ao buscar TRDs");
}

export async function fetchTrdRunsSummary(): Promise<TrdRunsSummary> {
  const response =
    await api.get<TrdRunsSummaryApiResponse>("/trd/runs/summary");

  if (response.data.success !== true) {
    throw new Error(response.data.message || "Falha ao buscar resumo de TRDs");
  }

  return (
    response.data.data || {
      total_runs: 0,
      total_completed: 0,
      total_failed: 0,
      last_run_at: null,
      last_completed_at: null,
    }
  );
}

export async function downloadTrdRun(
  runId: string,
  format: "pdf" | "docx",
): Promise<void> {
  if (!format || (format !== "pdf" && format !== "docx")) {
    throw new Error("format deve ser pdf ou docx");
  }

  await downloadRunBlob(`/trd/runs/${runId}/download`, runId, format, "TRD");
}

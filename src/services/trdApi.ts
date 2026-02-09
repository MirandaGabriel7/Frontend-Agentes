// src/services/trdApi.ts
import { api } from "./api"; // o seu axios/fetch wrapper padrão

export type TrdRunStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type TrdListItem = {
  runId: string;
  status: TrdRunStatus;
  trp_run_id: string;
  trp_created_at?: string;
  houve_ressalvas?: boolean;
  createdAt: string;
};

export type TrdListRunsResponseV2 = {
  success: boolean;
  data: { items: TrdListItem[]; nextCursor: string | null };
};

export type TrdGetRunResponse = {
  success: boolean;
  data: {
    runId: string;
    trpRunId: string;
    status: TrdRunStatus;
    fileName: string;
    schema_version: string;
    documento_markdown_final: string;
    documento_markdown_prime?: string;
    campos_trd_normalizados: Record<string, unknown>;
    createdAt: string;
    updatedAt?: string;
  };
};

export type TrdGenerateResponse = {
  success: boolean;
  message?: string;
  data?: { runId: string; status: TrdRunStatus; createdAt: string };
};

export async function trdGenerate(input: {
  trp_run_id: string;
  houve_ressalvas: boolean;
  ressalvas_texto?: string | null;
}) {
  const { data } = await api.post<TrdGenerateResponse>("/trd/generate", input);
  return data;
}

export async function trdListRuns(params: {
  limit?: number;
  cursor?: string | null;
  status?: string;
  q?: string;
}) {
  const { data } = await api.get<TrdListRunsResponseV2>("/trd/runs", { params });
  return data;
}

export async function trdGetRun(runId: string) {
  const { data } = await api.get<TrdGetRunResponse>(`/trd/runs/${runId}`);
  return data;
}

export async function trdGetSummary() {
  const { data } = await api.get("/trd/runs/summary");
  return data;
}

export function trdDownloadUrl(runId: string, format: "pdf" | "docx") {
  return `/trd/runs/${runId}/download?format=${format}`;
}

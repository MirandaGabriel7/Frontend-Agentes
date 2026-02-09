import { api } from "../../../services/api";

type TrdGenerateInput = {
  trp_run_id: string;
  houve_ressalvas: boolean;
  ressalvas_texto?: string | null;
};

export async function trdGenerate(input: TrdGenerateInput) {
  const { data } = await api.post("/api/trd/generate", input);
  return data;
}

export async function trdGetRun(runId: string) {
  const { data } = await api.get(`/api/trd/runs/${runId}`);
  return data;
}

export async function trdListRuns(params: {
  limit: number;
  cursor?: string | null;
  status?: string;
  q?: string;
}) {
  const { data } = await api.get("/api/trd/runs", { params });
  return data;
}

export async function trdGetSummary() {
  const { data } = await api.get("/api/trd/runs/summary");
  return data;
}

export function trdDownloadUrl(runId: string, format: "pdf" | "docx") {
  return `/api/trd/runs/${runId}/download?format=${format}`;
}

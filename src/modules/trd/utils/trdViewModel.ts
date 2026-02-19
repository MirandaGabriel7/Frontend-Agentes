// src/modules/trd/utils/trdViewModel.ts
import type { TrdRunData } from "../../../services/api";

export interface TrdViewModel {
  documento_markdown: string;
  campos: Record<string, unknown>;
  runId: string;
  createdAt?: string;
  updatedAt?: string;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isEmptyString(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v !== "string") return false;
  return v.trim() === "";
}

/**
 * ✅ Humanize mínimo (só para os enums que afetam a seção 4)
 * Se você mudar os valores no backend, atualiza aqui também.
 */
function humanizeCondicaoPrazo(value: string): string {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return "";
  const map: Record<string, string> = {
    NO_PRAZO: "No prazo",
    DENTRO_DO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    ATRASADO: "Atrasado",
  };
  return map[v] ?? value;
}

function humanizeCondicaoQuantidadeOrdem(value: string): string {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return "";
  const map: Record<string, string> = {
    TOTAL: "Total (conforme a ordem)",
    PARCIAL: "Parcial (divergente da ordem)",
    DIVERGENTE: "Divergente da ordem",
  };
  return map[v] ?? value;
}

function enrichCondicoesLabels(campos: Record<string, unknown>): Record<string, unknown> {
  const c = { ...campos };

  // prazo
  const condPrazo = c["condicao_prazo"];
  const condPrazoLabel = c["condicao_prazo_label"];
  if (condPrazo && (condPrazoLabel === null || isEmptyString(condPrazoLabel))) {
    const h = humanizeCondicaoPrazo(String(condPrazo));
    if (h) c["condicao_prazo_label"] = h;
  }

  // quantidade (ordem)
  const condQtd = c["condicao_quantidade_ordem"];
  const condQtdLabel = c["condicao_quantidade_ordem_label"];
  if (condQtd && (condQtdLabel === null || isEmptyString(condQtdLabel))) {
    const h = humanizeCondicaoQuantidadeOrdem(String(condQtd));
    if (h) c["condicao_quantidade_ordem_label"] = h;
  }

  return c;
}

export function createTrdViewModel(run: TrdRunData): TrdViewModel {
  const documento_markdown =
    typeof run.documento_markdown_final === "string" && run.documento_markdown_final.trim()
      ? run.documento_markdown_final
      : typeof (run as any).documento_markdown_prime === "string"
        ? String((run as any).documento_markdown_prime)
        : "";

  // ✅ Fonte preferida de campos (importante porque no DB do trd_runs NÃO existe "campos_trd_normalizados")
  const camposRaw =
    isObj((run as any)?.campos_trd_normalizados)
      ? ((run as any).campos_trd_normalizados as Record<string, unknown>)
      : isObj((run as any)?.campos_trp_normalizados_snapshot)
        ? ((run as any).campos_trp_normalizados_snapshot as Record<string, unknown>)
        : isObj((run as any)?.campos)
          ? ((run as any).campos as Record<string, unknown>)
          : {};

  const campos = enrichCondicoesLabels(camposRaw);

  return {
    documento_markdown,
    campos,
    runId: String((run as any).runId ?? (run as any).run_id ?? ""),
    createdAt: (run as any).createdAt ?? (run as any).created_at,
    updatedAt: (run as any).updatedAt ?? (run as any).updated_at,
  };
}

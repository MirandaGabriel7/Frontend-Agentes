// src/modules/trd/utils/trdViewModel.ts
import type { TrdRunData } from "../../../services/api";

export interface TrdViewModel {
  documento_markdown: string;
  campos: Record<string, unknown>;
  runId: string;
  createdAt?: string;
  updatedAt?: string;
}

export function createTrdViewModel(run: TrdRunData): TrdViewModel {
  const documento_markdown =
    typeof run.documento_markdown_final === "string" && run.documento_markdown_final.trim()
      ? run.documento_markdown_final
      : typeof (run as any).documento_markdown_prime === "string"
        ? String((run as any).documento_markdown_prime)
        : "";

  const campos =
    run.campos_trd_normalizados && typeof run.campos_trd_normalizados === "object"
      ? (run.campos_trd_normalizados as Record<string, unknown>)
      : {};

  return {
    documento_markdown,
    campos,
    runId: (run as any).runId,
    createdAt: (run as any).createdAt,
    updatedAt: (run as any).updatedAt,
  };
}

/**
 * src/features/pipeline/hooks/usePipelineStatus.ts
 *
 * Polling automático do status de um job de pipeline.
 *
 * Faz GET /api/v1/pipeline/jobs/:id?documentType=TRP|TRD
 * a cada POLL_INTERVAL_MS até o job terminar (COMPLETED | FAILED | CANCELLED).
 *
 * Uso:
 *   const { status, steps, result, error, elapsedMs } = usePipelineStatus({
 *     jobId: "uuid",
 *     documentType: "TRP",
 *     enabled: true,
 *   });
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PipelineJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface PipelineStepState {
  stepName: string;
  order: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  attempt: number;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error?: string;
  errorCode?: string;
}

export interface PipelineStatusResult {
  jobId: string;
  documentType: string;
  status: PipelineJobStatus;
  pipelineVersion: string;
  createdAt: string;
  updatedAt?: string;
  jobStatus: PipelineJobStatus;
  steps: PipelineStepState[];
  result?: Record<string, unknown>;
  errorMessage?: string;
}

export interface UsePipelineStatusOptions {
  jobId: string | null;
  documentType: "TRP" | "TRD";
  /** Se false, não faz polling (default: true) */
  enabled?: boolean;
  /** Intervalo entre polls em ms (default: 2000) */
  pollIntervalMs?: number;
}

export interface UsePipelineStatusReturn {
  status: PipelineJobStatus | null;
  steps: PipelineStepState[];
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  elapsedMs: number;
  isPolling: boolean;
  isDone: boolean;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES: PipelineJobStatus[] = ["COMPLETED", "FAILED", "CANCELLED"];
const DEFAULT_POLL_INTERVAL_MS = 2000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePipelineStatus({
  jobId,
  documentType,
  enabled = true,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UsePipelineStatusOptions): UsePipelineStatusReturn {
  const [status, setStatus] = useState<PipelineJobStatus | null>(null);
  const [steps, setSteps] = useState<PipelineStepState[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const isDone = status !== null && TERMINAL_STATUSES.includes(status);

  // Busca status do job
  const fetchStatus = useCallback(async () => {
    if (!jobId || !mountedRef.current) return;

    try {
      const res = await api.get<PipelineStatusResult>(
        `/v1/pipeline/jobs/${jobId}`,
        { params: { documentType } },
      );

      if (!mountedRef.current) return;

      const data = res.data;
      const jobStatus = data.status ?? data.jobStatus;

      setStatus(jobStatus);

      // Busca steps separadamente se não vieram junto
      if (!data.steps || data.steps.length === 0) {
        try {
          const stepsRes = await api.get<{ steps: PipelineStepState[] }>(
            `/v1/pipeline/jobs/${jobId}/steps`,
            { params: { documentType } },
          );
          if (mountedRef.current) {
            setSteps(stepsRes.data.steps ?? []);
          }
        } catch {
          // steps são opcionais — não bloqueia
        }
      } else {
        setSteps(data.steps);
      }

      if (data.result) setResult(data.result);
      if (data.errorMessage) setErrorMessage(data.errorMessage);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Erro ao buscar status do job";
      setErrorMessage(msg);
    }
  }, [jobId, documentType]);

  // Callback para re-fetch manual
  const refetch = useCallback(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // Loop de polling
  const scheduleNextPoll = useCallback(() => {
    if (!mountedRef.current) return;

    pollRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      await fetchStatus();

      if (mountedRef.current) {
        // Lê o status mais recente via closure do state — usa ref
        setStatus((current) => {
          if (current && TERMINAL_STATUSES.includes(current)) {
            setIsPolling(false);
          } else {
            scheduleNextPoll();
          }
          return current;
        });
      }
    }, pollIntervalMs);
  }, [fetchStatus, pollIntervalMs]);

  // Efeito principal
  useEffect(() => {
    mountedRef.current = true;

    if (!jobId || !enabled) {
      setIsPolling(false);
      return;
    }

    // Reseta ao mudar de job
    setStatus(null);
    setSteps([]);
    setResult(null);
    setErrorMessage(null);
    setElapsedMs(0);
    startTimeRef.current = Date.now();
    setIsPolling(true);

    // Timer de elapsed
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 500);

    // Primeiro fetch imediato
    void fetchStatus().then(() => {
      setStatus((current) => {
        if (current && TERMINAL_STATUSES.includes(current)) {
          setIsPolling(false);
        } else {
          scheduleNextPoll();
        }
        return current;
      });
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [jobId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Para o timer de elapsed quando termina
  useEffect(() => {
    if (isDone && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isDone]);

  return {
    status,
    steps,
    result,
    errorMessage,
    elapsedMs,
    isPolling,
    isDone,
    refetch,
  };
}
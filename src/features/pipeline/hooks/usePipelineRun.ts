/**
 * src/features/pipeline/hooks/usePipelineRun.ts
 *
 * Encapsula o disparo de um job de pipeline via POST /api/trp/generate.
 * Retorna o jobId para que usePipelineStatus faça o polling.
 *
 * Uso:
 *   const { jobId, isSubmitting, submitError, trigger } = usePipelineRun();
 *
 *   await trigger(params);   // dispara o job
 *   // jobId agora tem valor → usePipelineStatus começa a fazer polling
 */

import { useState, useCallback } from "react";
import { generateTrp, GenerateTrpParams, TrpGenerateResponse } from "@/services/api";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UsePipelineRunReturn {
  /** ID do job retornado pelo backend. Null antes do trigger. */
  jobId: string | null;
  /** Resposta completa do backend (inclui status inicial) */
  jobResponse: TrpGenerateResponse | null;
  isSubmitting: boolean;
  submitError: string | null;
  /** Dispara a geração e popula jobId */
  trigger: (params: GenerateTrpParams) => Promise<TrpGenerateResponse | null>;
  /** Reseta o estado (útil para gerar um novo TRP na mesma página) */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePipelineRun(): UsePipelineRunReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobResponse, setJobResponse] = useState<TrpGenerateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trigger = useCallback(
    async (params: GenerateTrpParams): Promise<TrpGenerateResponse | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      setJobId(null);
      setJobResponse(null);

      try {
        const response = await generateTrp(params);
        setJobId(response.runId);
        setJobResponse(response);
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao iniciar geração do TRP";
        setSubmitError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setJobId(null);
    setJobResponse(null);
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  return {
    jobId,
    jobResponse,
    isSubmitting,
    submitError,
    trigger,
    reset,
  };
}
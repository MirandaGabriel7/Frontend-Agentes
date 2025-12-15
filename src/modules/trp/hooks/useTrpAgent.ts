import { useState, useEffect, useCallback } from 'react';
import { TrpRun, TrpInputForm } from '../../../lib/types/trp';
import { listTrpRuns, getTrpRun, createTrpRun, simulateTrpAgent } from '../../../lib/services/trpService';

export interface UseTrpAgentResult {
  form: TrpInputForm;
  setForm: (updater: (prev: TrpInputForm) => TrpInputForm) => void;
  currentRun?: TrpRun;
  runs: TrpRun[];
  isLoadingRuns: boolean;
  isExecuting: boolean;
  error?: string;
  executeAgent: () => Promise<void>;
  resetCurrent: () => void;
  reloadRuns: () => Promise<void>;
  loadRunById: (id: string) => Promise<void>;
}

const initialForm: TrpInputForm = {
  data_recebimento: '',
  tipo_base_prazo: undefined,
  condicao_prazo: undefined,
  condicao_quantidade_ordem: undefined,
  condicao_quantidade_nf: undefined,
  observacoes_recebimento: '',
  arquivoTdrNome: '',
};

export function useTrpAgent(): UseTrpAgentResult {
  const [form, setForm] = useState<TrpInputForm>(initialForm);
  const [currentRun, setCurrentRun] = useState<TrpRun | undefined>();
  const [runs, setRuns] = useState<TrpRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reloadRuns = useCallback(async () => {
    setIsLoadingRuns(true);
    try {
      const loadedRuns = await listTrpRuns();
      setRuns(loadedRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar TRPs');
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    reloadRuns();
  }, [reloadRuns]);

  const executeAgent = useCallback(async () => {
    setIsExecuting(true);
    setError(undefined);
    
    try {
      const newRun = await createTrpRun(form);
      setCurrentRun(newRun);
      
      const completedRun = await simulateTrpAgent(newRun.id);
      setCurrentRun(completedRun);
      
      await reloadRuns();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar agente TRP';
      setError(errorMessage);
      if (currentRun) {
        const updatedRun = await getTrpRun(currentRun.id);
        if (updatedRun) {
          setCurrentRun(updatedRun);
        }
      }
    } finally {
      setIsExecuting(false);
    }
  }, [form, currentRun, reloadRuns]);

  const resetCurrent = useCallback(() => {
    setCurrentRun(undefined);
    setForm(initialForm);
    setError(undefined);
  }, []);

  const loadRunById = useCallback(async (id: string) => {
    try {
      const run = await getTrpRun(id);
      if (run) {
        setCurrentRun(run);
        setForm(run.input);
      } else {
        setError(`TRP com id ${id} não encontrado`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar TRP');
    }
  }, []);

  return {
    form,
    setForm,
    currentRun,
    runs,
    isLoadingRuns,
    isExecuting,
    error,
    executeAgent,
    resetCurrent,
    reloadRuns,
    loadRunById,
  };
}


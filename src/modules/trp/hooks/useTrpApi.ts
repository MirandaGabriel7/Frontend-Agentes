import { useState } from 'react';
import axios from 'axios';
import { TrpRunRequest, TrpRunResponse, TrpListItem } from '../types/trp.types';

const api = axios.create({
  baseURL: '/api',
});

export const useTrpApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTrp = async (data: TrpRunRequest): Promise<TrpRunResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<TrpRunResponse>('/agents/trp/run', data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao gerar TRP';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTrpById = async (id: string): Promise<TrpRunResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TrpRunResponse>(`/agents/trp/runs/${id}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar TRP';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const listTrps = async (): Promise<TrpListItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TrpListItem[]>('/agents/trp/runs');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao listar TRPs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createTrp,
    getTrpById,
    listTrps,
    loading,
    error,
  };
};


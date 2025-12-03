/**
 * Tipos TypeScript para a resposta da API de resultado do Agente DFD
 */

export type SemafaroGlobal = 'VERDE' | 'LARANJA' | 'VERMELHO';
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'MUITO_ALTO';
export type TipoContratacao = 'MEDICAMENTO' | 'MATERIAL' | 'SERVICO' | 'OBRA';

export interface DfdOverview {
  tipo_contratacao: TipoContratacao;
  subtipo: string;
  semaforo_global: SemafaroGlobal;
  nivel_risco_global: NivelRisco;
  percentual_atendimento_global: number;
  total_grupos_avaliados: number;
  total_itens_avaliados: number;
  total_pendencias_relevantes: number;
  visao_rapida: string;
}

export interface DfdDestaques {
  pontos_positivos: string[];
  pontos_de_atencao: string[];
  riscos_relevantes: string[];
}

export interface DfdQuantitativo {
  total_itens: number;
  itens_atendidos: number;
  itens_nao_atendidos: number;
  itens_parcialmente_atendidos: number;
  itens_nao_se_aplica: number;
}

export interface DfdGrupo {
  grupo_id: string;
  titulo_grupo: string;
  semaforo: SemafaroGlobal;
  nivel_risco: NivelRisco;
  percentual_atendimento: number;
  pontos_calculados: number;
  pendencias_relevantes: number;
  quantitativo: DfdQuantitativo;
  comentario_resumo: string;
}

export interface DfdMeta {
  gerado_por: string;
  versao_motor: string;
  timestamp_geracao: string;
}

export interface DfdAnalysis {
  tipo_contratacao: TipoContratacao;
  subtipo: string;
  overview: DfdOverview;
  destaques: DfdDestaques;
  grupos: DfdGrupo[];
  meta: DfdMeta;
}


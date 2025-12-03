/**
 * Tipos TypeScript para a resposta da API do Agente DFD
 */

export type SemafaroGlobal = 'VERDE' | 'LARANJA' | 'VERMELHO';
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type TipoContratacao = 'MEDICAMENTO' | 'MATERIAL' | 'SERVICO' | 'OBRA';
export type NivelCriticidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Overview do parecer executivo
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

// Recomendação prioritária
export interface DfdRecomendacaoPrioritaria {
  ordem?: number;
  descricao: string;
  grupo_impactado?: string;
  nivel_criticidade?: NivelCriticidade;
  percentual_atendimento?: number;
}

// Destaques
export interface DfdDestaques {
  pontos_positivos: string[];
  pontos_de_atencao: string[];
  riscos_relevantes: string[];
}

// Grupo detalhado (para parecer executivo)
export interface DfdGrupo {
  titulo?: string;
  descricao?: string;
  [key: string]: unknown;
}

// Parecer executivo completo
export interface DfdParecerExecutivo {
  overview: DfdOverview;
  recomendacoes_prioritarias: DfdRecomendacaoPrioritaria[];
  destaques: DfdDestaques;
  grupos: DfdGrupo[];
  parecer_narrativo: string;
}

// Resumo geral técnico
export interface DfdResumoGeral {
  tipo_contratacao?: TipoContratacao;
  subtipo?: string;
  semaforo_global?: SemafaroGlobal;
  nivel_risco_global?: NivelRisco;
  percentual_atendimento_global?: number;
  total_grupos_avaliados?: number;
  total_itens_avaliados?: number;
  total_pendencias_relevantes?: number;
  [key: string]: unknown;
}

// Score global
export interface DfdScoreGlobal {
  percentual_atendimento?: number;
  nivel_risco?: NivelRisco;
  semaforo?: SemafaroGlobal;
  total_pendencias?: number;
  [key: string]: unknown;
}

// Regra avaliada
export interface DfdRegra {
  codigo?: string;
  tipo_elemento?: string;
  status?: string;
  nivel_criticidade?: NivelCriticidade;
  descricao?: string;
  [key: string]: unknown;
}

// Score de grupo
export interface DfdScoreGrupo {
  nivel_risco?: NivelRisco;
  semaforo?: SemafaroGlobal;
  percentual_atendimento?: number;
  total_pendencias?: number;
  [key: string]: unknown;
}

// Grupo detalhado técnico
export interface DfdGrupoDetalhado {
  titulo_grupo: string;
  comentario_resumo?: string;
  score?: DfdScoreGrupo;
  total_itens?: number;
  itens_atendidos?: number;
  itens_nao_atendidos?: number;
  itens_parcialmente_atendidos?: number;
  itens_nao_se_aplica?: number;
  regras?: DfdRegra[];
  [key: string]: unknown;
}

// Detalhamento técnico completo
export interface DfdDetalhamentoTecnico {
  tipo_contratacao: TipoContratacao;
  subtipo: string;
  resumo_geral: DfdResumoGeral;
  score_global: DfdScoreGlobal;
  grupos_detalhados: DfdGrupoDetalhado[];
}

// Meta informações
export interface DfdMeta {
  gerado_por: string;
  versao_layout: string;
  timestamp_geracao: string;
}

// Resposta completa da API (array com um único item)
export interface DfdAnaliseResponse {
  parecer_executivo: DfdParecerExecutivo;
  detalhamento_tecnico: DfdDetalhamentoTecnico;
  bruto_prime: Record<string, unknown>;
  meta: DfdMeta;
}


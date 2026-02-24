import { useState, useEffect } from 'react';
import { DfdAnalysis } from '../../../lib/types/dfdResult';

/**
 * Hook mock para simular a busca de uma análise DFD
 */
export const useMockDfdAnalysis = (analysisId?: string) => {
  const [analysis, setAnalysis] = useState<DfdAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simular delay de carregamento
    const timer = setTimeout(() => {
      try {
        // Dados mockados baseados no exemplo fornecido
        const mockAnalysis: DfdAnalysis = {
          tipo_contratacao: 'MEDICAMENTO',
          subtipo: 'GERAL',
          overview: {
            tipo_contratacao: 'MEDICAMENTO',
            subtipo: 'GERAL',
            semaforo_global: 'LARANJA',
            nivel_risco_global: 'ALTO',
            percentual_atendimento_global: 48.44,
            total_grupos_avaliados: 6,
            total_itens_avaliados: 32,
            total_pendencias_relevantes: 19,
            visao_rapida: 'O DFD apresenta justificativas técnicas relevantes e memória de cálculo detalhada para o fornecimento de medicamentos ao SAMU 192. Entretanto, a análise de riscos e a documentação comprobatória apresentam lacunas que comprometem a completude do planejamento. Aspectos específicos do escopo e custos estão coerentes, mas faltam evidências claras para alguns documentos e riscos.',
          },
          destaques: {
            pontos_positivos: [
              'Justificativas técnicas bem fundamentadas para o fornecimento de medicamentos',
              'Memória de cálculo detalhada e transparente',
              'Escopo e custos coerentes com a necessidade identificada',
              'Documentação básica do DFD está presente',
            ],
            pontos_de_atencao: [
              'Análise de riscos apresenta lacunas significativas',
              'Documentação comprobatória incompleta em alguns aspectos',
              'Faltam evidências claras para alguns documentos mencionados',
              'Planejamento poderia ser mais completo em relação aos riscos',
            ],
            riscos_relevantes: [
              'Risco de não atendimento completo da demanda devido a lacunas na documentação',
              'Possível necessidade de complementação de informações durante a execução',
              'Risco de questionamentos sobre a completude do planejamento',
            ],
          },
          grupos: [
            {
              grupo_id: 'GLOBAL_PLANEJAMENTO_CONTRATACAO',
              titulo_grupo: 'Regras globais de planejamento da contratação',
              semaforo: 'VERDE',
              nivel_risco: 'BAIXO',
              percentual_atendimento: 83.33,
              pontos_calculados: 5,
              pendencias_relevantes: 2,
              quantitativo: {
                total_itens: 6,
                itens_atendidos: 4,
                itens_nao_atendidos: 0,
                itens_parcialmente_atendidos: 2,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'O planejamento global da contratação está bem estruturado, com a maioria dos itens atendidos. Existem algumas pendências parciais que podem ser facilmente resolvidas com complementação de informações.',
            },
            {
              grupo_id: 'ANALISE_RISCOS',
              titulo_grupo: 'Análise de riscos e mitigação',
              semaforo: 'LARANJA',
              nivel_risco: 'MEDIO',
              percentual_atendimento: 45.0,
              pontos_calculados: 3,
              pendencias_relevantes: 5,
              quantitativo: {
                total_itens: 8,
                itens_atendidos: 2,
                itens_nao_atendidos: 1,
                itens_parcialmente_atendidos: 5,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'A análise de riscos apresenta lacunas significativas. Muitos itens estão parcialmente atendidos, indicando necessidade de complementação na identificação e mitigação de riscos.',
            },
            {
              grupo_id: 'DOCUMENTACAO_COMPROBATORIA',
              titulo_grupo: 'Documentação comprobatória',
              semaforo: 'LARANJA',
              nivel_risco: 'MEDIO',
              percentual_atendimento: 60.0,
              pontos_calculados: 4,
              pendencias_relevantes: 4,
              quantitativo: {
                total_itens: 10,
                itens_atendidos: 4,
                itens_nao_atendidos: 2,
                itens_parcialmente_atendidos: 4,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'A documentação comprobatória está parcialmente completa. Alguns documentos estão presentes, mas outros necessitam de complementação ou apresentam informações incompletas.',
            },
            {
              grupo_id: 'JUSTIFICATIVA_TECNICA',
              titulo_grupo: 'Justificativa técnica e memória de cálculo',
              semaforo: 'VERDE',
              nivel_risco: 'BAIXO',
              percentual_atendimento: 90.0,
              pontos_calculados: 5,
              pendencias_relevantes: 1,
              quantitativo: {
                total_itens: 5,
                itens_atendidos: 4,
                itens_nao_atendidos: 0,
                itens_parcialmente_atendidos: 1,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'A justificativa técnica e a memória de cálculo estão bem detalhadas e fundamentadas, apresentando informações claras e coerentes.',
            },
            {
              grupo_id: 'ESCOPO_CUSTOS',
              titulo_grupo: 'Escopo e custos',
              semaforo: 'VERDE',
              nivel_risco: 'BAIXO',
              percentual_atendimento: 85.0,
              pontos_calculados: 4,
              pendencias_relevantes: 2,
              quantitativo: {
                total_itens: 6,
                itens_atendidos: 4,
                itens_nao_atendidos: 0,
                itens_parcialmente_atendidos: 2,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'O escopo e os custos estão bem definidos e coerentes com a necessidade identificada. Algumas informações complementares seriam benéficas.',
            },
            {
              grupo_id: 'CONFORMIDADE_LEGAL',
              titulo_grupo: 'Conformidade legal e regulatória',
              semaforo: 'VERMELHO',
              nivel_risco: 'ALTO',
              percentual_atendimento: 35.0,
              pontos_calculados: 2,
              pendencias_relevantes: 7,
              quantitativo: {
                total_itens: 8,
                itens_atendidos: 1,
                itens_nao_atendidos: 3,
                itens_parcialmente_atendidos: 4,
                itens_nao_se_aplica: 0,
              },
              comentario_resumo: 'A conformidade legal e regulatória apresenta várias pendências. É necessário revisar e complementar a documentação para garantir o atendimento completo dos requisitos legais.',
            },
          ],
          meta: {
            gerado_por: 'Agentes Gov DFD � PRIME_SCORE + OUTPUT_FORMATTER',
            versao_motor: '1.0.0',
            timestamp_geracao: new Date().toISOString(),
          },
        };

        setAnalysis(mockAnalysis);
        setIsLoading(false);
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 800); // Simular delay de 800ms

    return () => clearTimeout(timer);
  }, [analysisId]);

  return { analysis, isLoading, hasError };
};


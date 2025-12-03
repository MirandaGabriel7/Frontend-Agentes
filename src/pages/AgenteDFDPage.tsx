import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  alpha,
  useTheme,
  Chip,
  Tabs,
  Tab,
  Grid,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore,
  ContentCopy,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

import { DfdAnaliseResponse } from '../lib/types/dfd';
import { DfdUploadCard } from '../modules/dfd/components/DfdUploadCard';
import { DfdActionsBar } from '../modules/dfd/components/DfdActionsBar';
import { DfdHistoryCard, DfdHistoryItem } from '../modules/dfd/components/DfdHistoryCard';

// Constante para o endpoint da API
const AGENTE_DFD_API_URL = import.meta.env.VITE_AGENTE_DFD_API_URL || '/api/dfd/analisar';

// Estados da página
type PageState = 'idle' | 'fileSelected' | 'loading' | 'success' | 'error';

/**
 * Componente principal da página do Agente DFD
 */
const AgenteDFDPage: React.FC = () => {
  const theme = useTheme();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analiseResult, setAnaliseResult] = useState<DfdAnaliseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Manipula a seleção de arquivo
   */
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setPageState('fileSelected');
      setErrorMessage('');
    } else {
      setPageState('idle');
    }
  };

  /**
   * Executa a análise do DFD
   */
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo PDF primeiro.');
      setPageState('error');
      return;
    }

    setPageState('loading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post<DfdAnaliseResponse[]>(AGENTE_DFD_API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // A API retorna um array com um único item
      if (!response.data || response.data.length === 0) {
        throw new Error('Resposta vazia do servidor');
      }

      const result = response.data[0];
      if (!result.parecer_executivo) {
        throw new Error('Formato de resposta inválido');
      }

      setAnaliseResult(result);
      setPageState('success');
    } catch (error: unknown) {
      let message = 'Não foi possível interpretar o resultado da análise. Revise o DFD ou tente novamente.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400 || error.response?.status === 500) {
          message = error.response?.data?.message || message;
        } else if (error.message) {
          message = `Erro na requisição: ${error.message}`;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
      setPageState('error');
    }
  };

  /**
   * Reseta o estado para permitir nova análise
   */
  const handleReset = () => {
    setSelectedFile(null);
    setAnaliseResult(null);
    setPageState('idle');
    setErrorMessage('');
    setActiveTab(0);
  };

  /**
   * Copia o JSON bruto para a área de transferência
   */
  const handleCopyJson = async () => {
    if (!analiseResult?.bruto_prime) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(analiseResult.bruto_prime, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar JSON:', error);
    }
  };

  const canExecute = Boolean(selectedFile && pageState !== 'loading');

  /**
   * Retorna os itens do histórico (mockado por enquanto)
   * TODO: Integrar com API real
   */
  const getHistoryItems = (): DfdHistoryItem[] => {
    const items: DfdHistoryItem[] = [];

    // Adiciona o resultado atual se existir
    if (analiseResult) {
      items.push({
        id: 'current',
        fileName: selectedFile?.name || 'DFD_Analisado.pdf',
        status: 'completed',
        createdAt: new Date().toISOString(),
        semaforo: analiseResult.parecer_executivo.overview.semaforo_global,
        nivelRisco: analiseResult.parecer_executivo.overview.nivel_risco_global,
        percentualAtendimento: analiseResult.parecer_executivo.overview.percentual_atendimento_global,
        totalPendencias: analiseResult.parecer_executivo.overview.total_pendencias_relevantes,
      });
    }

    // Adiciona itens mockados para demonstração
    if (items.length === 0) {
      items.push(
        {
          id: '1',
          fileName: 'DFD_Projeto_Final_v3.pdf',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          semaforo: 'VERDE',
          nivelRisco: 'BAIXO',
          percentualAtendimento: 92.5,
          totalPendencias: 3,
        },
        {
          id: '2',
          fileName: 'DFD_Infraestrutura_v4.pdf',
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
          semaforo: 'LARANJA',
          nivelRisco: 'MEDIO',
          percentualAtendimento: 68.2,
          totalPendencias: 12,
        },
        {
          id: '3',
          fileName: 'DFD_Sistema_Principal.pdf',
          status: 'processing',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
        }
      );
    }

    return items;
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1000px', lg: '1100px' },
        mx: 'auto',
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      {/* Cabeçalho da página */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          Analisador de DFD
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '1rem',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Envie o DFD em PDF para que o agente aplique as regras e gere um parecer automático.
        </Typography>
        {analiseResult?.meta?.versao_layout && (
          <Chip
            label={`Versão ${analiseResult.meta.versao_layout}`}
            size="small"
            sx={{ mt: 2 }}
          />
        )}
      </Box>

      {/* Mensagem de erro */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Card de Upload */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, mb: 4 }}>
        <DfdUploadCard
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          disabled={pageState === 'loading'}
        />
      </Box>

      {/* Barra de Ações */}
      <DfdActionsBar
        onExecute={handleAnalyze}
        onReset={handleReset}
        isExecuting={pageState === 'loading'}
        canExecute={canExecute}
      />

      {/* Área de Resultados */}
      {pageState === 'success' && analiseResult && (
        <Box sx={{ mt: 6 }}>
          <ResultadosTabs
            analiseResult={analiseResult}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCopyJson={handleCopyJson}
            copySuccess={copySuccess}
          />
        </Box>
      )}

      {/* Histórico de Análises */}
      {pageState !== 'loading' && (
        <Box sx={{ mt: 6 }}>
          <DfdHistoryCard
            items={getHistoryItems()}
            onView={(id) => {
              // TODO: Implementar navegação para detalhes
              console.log('Ver análise:', id);
            }}
            onDownload={(id) => {
              // TODO: Implementar download
              console.log('Baixar análise:', id);
            }}
          />
        </Box>
      )}

      {/* Snackbar para feedback de cópia */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        message="JSON copiado para a área de transferência!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

/**
 * Componente de abas de resultados
 */
interface ResultadosTabsProps {
  analiseResult: DfdAnaliseResponse;
  activeTab: number;
  onTabChange: (value: number) => void;
  onCopyJson: () => void;
  copySuccess: boolean;
}

const ResultadosTabs: React.FC<ResultadosTabsProps> = ({
  analiseResult,
  activeTab,
  onTabChange,
  onCopyJson,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9375rem',
          },
        }}
      >
        <Tab label="Parecer Executivo" />
        <Tab label="Detalhamento Técnico" />
        <Tab label="JSON Bruto (debug)" />
      </Tabs>

      {/* Conteúdo da aba "Parecer Executivo" */}
      {activeTab === 0 && (
        <Box sx={{ p: 5 }}>
          <ParecerExecutivoTab parecer={analiseResult.parecer_executivo} />
        </Box>
      )}

      {/* Conteúdo da aba "Detalhamento Técnico" */}
      {activeTab === 1 && (
        <Box sx={{ p: 5 }}>
          <DetalhamentoTecnicoTab detalhamento={analiseResult.detalhamento_tecnico} />
        </Box>
      )}

      {/* Conteúdo da aba "JSON Bruto" */}
      {activeTab === 2 && (
        <Box sx={{ p: 5 }}>
          <JsonBrutoTab
            jsonData={analiseResult.bruto_prime}
            onCopy={() => {
              if (analiseResult?.bruto_prime) {
                navigator.clipboard.writeText(JSON.stringify(analiseResult.bruto_prime, null, 2)).then(() => {
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                });
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

/**
 * Aba de Parecer Executivo
 */
interface ParecerExecutivoTabProps {
  parecer: DfdAnaliseResponse['parecer_executivo'];
}

const ParecerExecutivoTab: React.FC<ParecerExecutivoTabProps> = ({ parecer }) => {
  const theme = useTheme();

  const getSemafaroColor = (semaforo: string) => {
    switch (semaforo) {
      case 'VERDE':
        return 'success';
      case 'LARANJA':
        return 'warning';
      case 'VERMELHO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSemafaroIcon = (semaforo: string): React.ReactElement | undefined => {
    switch (semaforo) {
      case 'VERDE':
        return <CheckCircle />;
      case 'LARANJA':
        return <Warning />;
      case 'VERMELHO':
        return <ErrorIcon />;
      default:
        return undefined;
    }
  };

  return (
    <Stack spacing={4}>
      {/* Resumo Global */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Resumo global da análise
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {parecer.overview.percentual_atendimento_global.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Atendimento Global
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {parecer.overview.total_grupos_avaliados}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Grupos Avaliados
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {parecer.overview.total_itens_avaliados}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Itens Avaliados
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {parecer.overview.total_pendencias_relevantes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendências Relevantes
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            {...(getSemafaroIcon(parecer.overview.semaforo_global) ? { icon: getSemafaroIcon(parecer.overview.semaforo_global) } : {})}
            label={`Semáforo: ${parecer.overview.semaforo_global}`}
            color={getSemafaroColor(parecer.overview.semaforo_global) as 'success' | 'warning' | 'error'}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Risco: ${parecer.overview.nivel_risco_global}`}
            color={parecer.overview.nivel_risco_global === 'ALTO' || parecer.overview.nivel_risco_global === 'CRITICO' ? 'error' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.primary' }}>
          {parecer.overview.visao_rapida}
        </Typography>
      </Paper>

      {/* Recomendações Prioritárias */}
      {parecer.recomendacoes_prioritarias && parecer.recomendacoes_prioritarias.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Recomendações prioritárias
          </Typography>
          <List>
            {parecer.recomendacoes_prioritarias.map((rec, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {rec.ordem ? `${rec.ordem}.` : `${index + 1}.`} {rec.descricao}
                        </Typography>
                        {rec.nivel_criticidade && (
                          <Chip
                            label={rec.nivel_criticidade}
                            size="small"
                            color={rec.nivel_criticidade === 'CRITICA' || rec.nivel_criticidade === 'ALTA' ? 'error' : 'default'}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {rec.grupo_impactado && (
                          <Typography variant="caption" color="text.secondary">
                            Grupo impactado: {rec.grupo_impactado}
                          </Typography>
                        )}
                        {rec.percentual_atendimento !== undefined && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            Atendimento: {rec.percentual_atendimento.toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < parecer.recomendacoes_prioritarias.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Destaques */}
      {parecer.destaques && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Destaques
          </Typography>
          <Grid container spacing={3}>
            {/* Pontos Positivos */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                Pontos positivos
              </Typography>
              <List dense>
                {parecer.destaques.pontos_positivos?.map((ponto, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main', mt: 0.25, flexShrink: 0 }} />
                          {ponto}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Pontos de Atenção */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'warning.main' }}>
                Pontos de atenção
              </Typography>
              <List dense>
                {parecer.destaques.pontos_de_atencao?.map((ponto, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Warning sx={{ fontSize: 16, color: 'warning.main', mt: 0.25, flexShrink: 0 }} />
                          {ponto}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Riscos Relevantes */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                Principais riscos
              </Typography>
              <List dense>
                {parecer.destaques.riscos_relevantes?.map((risco, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <ErrorIcon sx={{ fontSize: 16, color: 'error.main', mt: 0.25, flexShrink: 0 }} />
                          {risco}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Parecer Narrativo */}
      {parecer.parecer_narrativo && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Parecer narrativo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: 'text.primary',
              whiteSpace: 'pre-wrap',
            }}
          >
            {parecer.parecer_narrativo}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};

/**
 * Aba de Detalhamento Técnico
 */
interface DetalhamentoTecnicoTabProps {
  detalhamento: DfdAnaliseResponse['detalhamento_tecnico'];
}

const DetalhamentoTecnicoTab: React.FC<DetalhamentoTecnicoTabProps> = ({ detalhamento }) => {
  const theme = useTheme();

  const getSemafaroColor = (semaforo?: string) => {
    switch (semaforo) {
      case 'VERDE':
        return 'success';
      case 'LARANJA':
        return 'warning';
      case 'VERMELHO':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Stack spacing={4}>
      {/* Resumo Técnico */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Resumo técnico
        </Typography>

        <Grid container spacing={3}>
          {detalhamento.score_global?.percentual_atendimento !== undefined && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {detalhamento.score_global.percentual_atendimento.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Atendimento Global
                </Typography>
              </Box>
            </Grid>
          )}

          {detalhamento.score_global?.semaforo && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Chip
                  label={`Semáforo: ${detalhamento.score_global.semaforo}`}
                  color={getSemafaroColor(detalhamento.score_global.semaforo) as 'success' | 'warning' | 'error'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          )}

          {detalhamento.resumo_geral?.total_pendencias_relevantes !== undefined && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {detalhamento.resumo_geral.total_pendencias_relevantes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pendências Relevantes
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Grupos Detalhados com Acordeão */}
      {detalhamento.grupos_detalhados && detalhamento.grupos_detalhados.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Grupos detalhados
          </Typography>
          {detalhamento.grupos_detalhados.map((grupo, index) => (
            <Accordion
              key={index}
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                    {grupo.titulo_grupo}
                  </Typography>
                  {grupo.score?.semaforo && (
                    <Chip
                      label={grupo.score.semaforo}
                      size="small"
                      color={getSemafaroColor(grupo.score.semaforo) as 'success' | 'warning' | 'error'}
                    />
                  )}
                  {grupo.score?.percentual_atendimento !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      {grupo.score.percentual_atendimento.toFixed(1)}%
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {grupo.comentario_resumo && (
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {grupo.comentario_resumo}
                    </Typography>
                  )}

                  {/* Estatísticas do grupo */}
                  {(grupo.total_itens !== undefined ||
                    grupo.itens_atendidos !== undefined ||
                    grupo.itens_nao_atendidos !== undefined) && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }}
                    >
                      <Grid container spacing={2}>
                        {grupo.total_itens !== undefined && (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Total de itens
                            </Typography>
                            <Typography variant="h6">{grupo.total_itens}</Typography>
                          </Grid>
                        )}
                        {grupo.itens_atendidos !== undefined && (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'success.main' }}>
                              {grupo.itens_atendidos}
                            </Typography>
                          </Grid>
                        )}
                        {grupo.itens_nao_atendidos !== undefined && (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Não atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'error.main' }}>
                              {grupo.itens_nao_atendidos}
                            </Typography>
                          </Grid>
                        )}
                        {grupo.itens_parcialmente_atendidos !== undefined && (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Parcialmente atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'warning.main' }}>
                              {grupo.itens_parcialmente_atendidos}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}

                  {/* Tabela de regras */}
                  {grupo.regras && grupo.regras.length > 0 && (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Criticidade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grupo.regras.map((regra, regraIndex) => (
                            <TableRow key={regraIndex}>
                              <TableCell>{regra.codigo || '-'}</TableCell>
                              <TableCell>{regra.tipo_elemento || '-'}</TableCell>
                              <TableCell>{regra.status || '-'}</TableCell>
                              <TableCell>
                                {regra.nivel_criticidade ? (
                                  <Chip
                                    label={regra.nivel_criticidade}
                                    size="small"
                                    color={
                                      regra.nivel_criticidade === 'CRITICA' || regra.nivel_criticidade === 'ALTA'
                                        ? 'error'
                                        : 'default'
                                    }
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Stack>
  );
};

/**
 * Aba de JSON Bruto
 */
interface JsonBrutoTabProps {
  jsonData: Record<string, unknown>;
  onCopy: () => void;
}

const JsonBrutoTab: React.FC<JsonBrutoTabProps> = ({ jsonData, onCopy }) => {
  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          JSON Bruto (debug)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ContentCopy />}
          onClick={onCopy}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Copiar JSON
        </Button>
      </Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: alpha(theme.palette.grey[900], 0.05),
          overflow: 'auto',
          maxHeight: '70vh',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <code>{JSON.stringify(jsonData, null, 2)}</code>
        </pre>
      </Paper>
    </Box>
  );
};

export default AgenteDFDPage;

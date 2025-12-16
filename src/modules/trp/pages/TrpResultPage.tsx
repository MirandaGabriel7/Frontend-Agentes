import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Stack,
  Chip,
  Fab,
  Zoom,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Description as WordIcon,
} from '@mui/icons-material';
import { TrpAgentOutput } from '../../../lib/types/trp';
import { fetchTrpResult, fetchTrpResultMock } from '../../../lib/services/trpService';
import { TrpSummaryCards } from '../components/TrpSummaryCards';
import { TrpMarkdownView } from '../components/TrpMarkdownView';
import { TrpStructuredDataPanel } from '../components/TrpStructuredDataPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const TrpResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrpAgentOutput | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Se temos um ID, tenta buscar do serviço real, senão usa mock
        let result: TrpAgentOutput;
        if (id) {
          try {
            result = await fetchTrpResult(id);
          } catch (err) {
            // Se não encontrar no serviço real, usa mock para demonstração
            console.warn('TRP não encontrado no serviço, usando mock:', err);
            result = await fetchTrpResultMock();
          }
        } else {
          // Sem ID, usa mock
          result = await fetchTrpResultMock();
        }
        
        // Debug: verificar o que foi carregado
        const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
        if (isDev) {
          console.debug('[TrpResultPage] Dados carregados:', {
            hasDocumentoMarkdown: !!result.documento_markdown,
            documentoMarkdownLength: result.documento_markdown?.length,
            hasCampos: !!result.campos,
            camposKeys: result.campos ? Object.keys(result.campos) : [],
            camposCriticos: {
              vencimento_nf: result.campos?.vencimento_nf,
              data_entrega: result.campos?.data_entrega,
              condicao_prazo: result.campos?.condicao_prazo,
              condicao_quantidade: result.campos?.condicao_quantidade,
              observacoes: result.campos?.observacoes,
            },
          });
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar TRP');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadWord = () => {
    // TODO: Implement Word download
    console.log('Baixar Word');
  };

  const handleDownloadPdf = () => {
    // TODO: Implement PDF download
    console.log('Baixar PDF');
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          }
        >
          {error || 'Não foi possível carregar o TRP. Tente novamente.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '1400px' },
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Termo de Recebimento Provisório
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Revisão do documento gerado pela IA
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Chip
              label={`Arquivo: ${data.meta.fileName}`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                fontWeight: 500,
              }}
            />
            <Chip
              label={`ID: ${data.meta.hash_tdr.substring(0, 8)}...`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.grey[500], 0.08),
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* Informational Banner */}
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            bgcolor: alpha(theme.palette.info.main, 0.06),
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box
            sx={{
              color: theme.palette.info.main,
              mt: 0.5,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
              />
            </svg>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: theme.palette.info.dark,
                mb: 1,
              }}
            >
              Revisão do Documento
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                lineHeight: 1.6,
              }}
            >
              Por favor, revise cuidadosamente todas as informações apresentadas no Termo de Recebimento Provisório antes de salvar o documento no processo. Verifique se os dados do contrato, fornecedor, nota fiscal e condições de recebimento estão corretos e completos. Após a revisão, você poderá baixar o documento em PDF ou Word e salvá-lo no sistema de gestão de processos.
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Summary Cards */}
      <TrpSummaryCards campos={data.campos} />

      {/* Main Content Card with Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: alpha(theme.palette.grey[50], 0.5),
            px: { xs: 2, sm: 3 },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 64,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                minHeight: 64,
                px: { xs: 2, sm: 3 },
                color: theme.palette.text.secondary,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: theme.palette.primary.main,
              },
            }}
          >
            <Tab
              label="Visualização do Documento"
              sx={{
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            />
            <Tab
              label="Dados Estruturados"
              sx={{
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            />
          </Tabs>
        </Box>

        {/* Tab 1: Visualização do Documento */}
        <TabPanel value={activeTab} index={0}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 4,
              p: { xs: 3, sm: 4, md: 5 },
            }}
          >
            {/* Markdown Viewer - Left (2/3) */}
            {/* data.documento_markdown já contém documento_markdown_final (mapeado em generateTrp) */}
            <Box sx={{ flex: { xs: 1, lg: 2 }, minWidth: 0 }}>
              <TrpMarkdownView content={data.documento_markdown} showTitle={false} />
            </Box>

            {/* Actions Card - Right (1/3) */}
            <Box sx={{ flex: { xs: 1, lg: 1 }, minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  position: { lg: 'sticky' },
                  top: { lg: 24 },
                }}
              >
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PdfIcon />}
                    onClick={handleDownloadPdf}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                      },
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                    }}
                  >
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WordIcon />}
                    onClick={handleDownloadWord}
                    sx={{
                      borderColor: alpha(theme.palette.divider, 0.2),
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: theme.palette.primary.main,
                      },
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                    }}
                  >
                    Baixar Word
                  </Button>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      mt: 1,
                    }}
                  >
                    Gerado automaticamente pela IA a partir dos documentos de recebimento.
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 2: Dados Estruturados */}
        {/* data.campos já contém campos_trp_normalizados (mapeado em generateTrp) */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <TrpStructuredDataPanel campos={data.campos} />
          </Box>
        </TabPanel>

      </Paper>


      {/* Floating scroll to top button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={handleScrollToTop}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
          aria-label="Voltar ao topo"
        >
          <ArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};


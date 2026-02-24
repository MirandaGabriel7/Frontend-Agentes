// src/modules/trd/pages/TrdResultPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
  Zoom,
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as WordIcon,
  KeyboardArrowUp as ArrowUpIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { downloadTrdRun, fetchTrdRun, TrdRunData } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";
import { TrpMarkdownView } from "../../trp/components/TrpMarkdownView";
import { TrpStructuredDataPanel } from "../../trp/components/TrpStructuredDataPanel";
import { TrpSummaryCards } from "../../trp/components/TrpSummaryCards";
import { createTrdViewModel, TrdViewModel } from "../utils/trdViewModel";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const OBJETO_ROW_REGEX = /^(\|\s*Objeto\s*\|\s*)(.*?)(\s*\|\s*)$/gim;

function normalizeIdentificacaoObjetoMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return markdown;

  const sectionRegex =
    /(\n#{2,3}\s*1\.\s*Identificação do Contrato\s*\n)([\s\S]*?)(\n#{2,3}\s*2\.\s*Objeto fornecido\/prestado\s*\n|\n#{2,3}\s*2\.\s*Objeto\s*\n|$)/i;

  const cleanCell = (cell: unknown) =>
    String(cell)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const replaceObjetoRow = (_all: string, p1: string, cell: string, p3: string) => `${p1}${cleanCell(cell)}${p3}`;

  const m = markdown.match(sectionRegex);
  if (!m) return markdown.replace(OBJETO_ROW_REGEX, replaceObjetoRow);

  const before = m[1];
  const body = m[2];
  const after = m[3];

  const bodyFixed = body.replace(OBJETO_ROW_REGEX, replaceObjetoRow);
  return markdown.replace(sectionRegex, `${before}${bodyFixed}${after}`);
}

function stripTrdInfoSection(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return markdown;

  const sectionRegex =
    /(\n#{2,3}\s*0\.\s*Informações do TRD\s*\n)([\s\S]*?)(?=\n#{2,3}\s*[1-9]\d*\.\s|\s*$)/i;

  return markdown.replace(sectionRegex, "\n");
}

function labelCondicaoPrazo(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (!s) return null;

  const map: Record<string, string> = {
    NO_PRAZO: "No prazo",
    DENTRO_DO_PRAZO: "Dentro do prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    ATRASADO: "Fora do prazo",
  };

  return map[s] ?? null;
}

function labelCondicaoQuantidadeOrdem(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (!s) return null;

  const map: Record<string, string> = {
    TOTAL: "Total (conforme a ordem)",
    PARCIAL: "Parcial (conforme a ordem)",
    INCOMPLETO: "Parcial (conforme a ordem)",
    DIVERGENTE: "Divergente (fora da ordem)",
  };

  return map[s] ?? null;
}

function pickTrdFileName(run: TrdRunData | null, fallbackId?: string | null): string {
  const s = typeof (run as any)?.fileName === "string" ? String((run as any).fileName).trim() : "";
  if (s) return s;
  return fallbackId ? `TRD_${fallbackId}` : "TRD_Gerado";
}

type SnackbarState = { open: boolean; message: string; severity?: "error" | "success" | "warning" };
type ApiErrorLike = { status?: number; message?: string };

const getApiError = (err: unknown): ApiErrorLike => {
  if (typeof err === "object" && err !== null) return err as ApiErrorLike;
  return {};
};

export const TrdResultPage: React.FC = () => {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runData, setRunData] = useState<TrdRunData | null>(null);
  const [viewModel, setViewModel] = useState<TrdViewModel | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "" });

  const contentRef = useRef<HTMLDivElement>(null);

  const isDev = import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

  const handleAuthError = useCallback(async () => {
    setSnackbar({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
    await signOut();
    navigate("/login", {
      replace: true,
      state: { message: "Sua sessão expirou. Faça login novamente." },
    });
  }, [navigate, signOut]);

  const loadData = useCallback(async () => {
    if (!runId) {
      setError("ID do TRD não fornecido na URL");
      setLoading(false);
      return;
    }

    if (!isUuid(runId)) {
      setError("ID do TRD inválido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const run = await fetchTrdRun(runId);

      if (run.runId !== runId) {
        console.error(
          "[TrdResultPage]",
          `Inconsistência: runId da rota (${runId}) não corresponde ao run retornado (${run.runId})`
        );
        setError("Erro ao carregar TRD: inconsistência de dados");
        setLoading(false);
        return;
      }

      setRunData(run);

      const vm = createTrdViewModel(run);
      setViewModel(vm);

      if (isDev) {
        console.debug("[TRD][DEBUG] Run carregado:", {
          runId: run.runId,
          status: run.status,
          hasDocumentoMarkdownFinal: !!(run as any)?.documento_markdown_final,
          documentoMarkdownFinalLength: (run as any)?.documento_markdown_final?.length,
          hasCamposTrd: !!(run as any)?.campos_trd_normalizados,
          hasCamposSnapshot: !!(run as any)?.campos_trp_normalizados_snapshot,
        });

        console.debug(
          "[TRD][DEBUG] keys de campos disponíveis:",
          Object.keys((run as any).campos_trd_normalizados ?? (run as any).campos_trp_normalizados_snapshot ?? {})
        );
      }
    } catch (err) {
      console.error("[TrdResultPage] Erro ao carregar TRD:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar TRD");
    } finally {
      setLoading(false);
    }
  }, [isDev, runId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const camposUi = useMemo(() => {
    const base =
      (((runData as any)?.campos_trd_normalizados &&
        typeof (runData as any)?.campos_trd_normalizados === "object" &&
        ((runData as any).campos_trd_normalizados as Record<string, unknown>)) ||
        ((runData as any)?.campos_trp_normalizados_snapshot &&
          typeof (runData as any)?.campos_trp_normalizados_snapshot === "object" &&
          ((runData as any).campos_trp_normalizados_snapshot as Record<string, unknown>)) ||
        ((viewModel as any)?.campos &&
          typeof (viewModel as any)?.campos === "object" &&
          ((viewModel as any).campos as Record<string, unknown>)) ||
        ({} as Record<string, unknown>)) as Record<string, unknown>;

    const enriched: Record<string, unknown> = { ...base };

    const cp = enriched.condicao_prazo;
    const cpl = enriched.condicao_prazo_label;
    if ((cpl == null || String(cpl).trim() === "") && cp != null) {
      const lbl = labelCondicaoPrazo(cp);
      if (lbl) enriched.condicao_prazo_label = lbl;
    }

    const cq = enriched.condicao_quantidade_ordem;
    const cql = enriched.condicao_quantidade_ordem_label;
    if ((cql == null || String(cql).trim() === "") && cq != null) {
      const lbl = labelCondicaoQuantidadeOrdem(cq);
      if (lbl) enriched.condicao_quantidade_ordem_label = lbl;
    }

    return enriched;
  }, [runData, viewModel]);

  const markdownUi = useMemo(() => {
    const mdBackend = typeof (runData as any)?.documento_markdown_final === "string" ? String((runData as any).documento_markdown_final) : "";
    const mdVm = typeof (viewModel as any)?.documento_markdown === "string" ? String((viewModel as any).documento_markdown) : "";
    const raw = mdBackend.trim() ? mdBackend : mdVm;
    return stripTrdInfoSection(normalizeIdentificacaoObjetoMarkdown(raw));
  }, [runData, viewModel]);

  const termoNome = useMemo(() => pickTrdFileName(runData, runId || null), [runData, runId]);

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!runId) {
      setSnackbar({ open: true, message: "ID do TRD não encontrado na URL", severity: "error" });
      return;
    }

    if (!isUuid(runId)) {
      setSnackbar({ open: true, message: "ID do TRD inválido", severity: "error" });
      return;
    }

    if (runData && runData.runId !== runId) {
      setSnackbar({
        open: true,
        message: "Inconsistência: o documento carregado não corresponde ao ID da URL",
        severity: "error",
      });
      return;
    }

    if (runData?.status !== "COMPLETED") {
      setSnackbar({
        open: true,
        message: "Documento ainda não concluído. Aguarde a finalização do processamento.",
        severity: "warning",
      });
      return;
    }

    const setDownloading = format === "pdf" ? setDownloadingPdf : setDownloadingDocx;

    try {
      setDownloading(true);
      await downloadTrdRun(runId, format);
      setSnackbar({
        open: true,
        message: `Exportando documento oficial do TRD em ${format.toUpperCase()}...`,
        severity: "success",
      });
    } catch (err) {
      const apiErr = getApiError(err);
      const status = apiErr.status;
      const errorMessage = apiErr.message || "Erro ao baixar arquivo";

      if (status === 401 || status === 403) {
        await handleAuthError();
        return;
      }

      if (status === 404) {
        setSnackbar({ open: true, message: "Documento não encontrado", severity: "error" });
      } else if (status === 409) {
        setSnackbar({ open: true, message: "Documento ainda não finalizado", severity: "warning" });
      } else if (status === 429) {
        setSnackbar({ open: true, message: "Aguarde antes de gerar novamente", severity: "warning" });
      } else {
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = () => handleDownload("pdf");
  const handleDownloadWord = () => handleDownload("docx");
  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (runData && runData.status !== "COMPLETED") {
    const statusLabels: Record<string, string> = {
      PENDING: "Pendente",
      PROCESSING: "Em processamento",
      FAILED: "Falhou",
    };

    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity={runData.status === "FAILED" ? "error" : "info"}>
          <Typography variant="h6" gutterBottom>
            Status: {statusLabels[runData.status] || runData.status}
          </Typography>
          <Typography variant="body2">
            {runData.status === "PENDING" && "O TRD está aguardando processamento."}
            {runData.status === "PROCESSING" &&
              "O TRD está sendo processado. Aguarde alguns instantes e recarregue a página."}
            {runData.status === "FAILED" && "O processamento do TRD falhou. Tente gerar novamente."}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => runId && window.location.reload()} sx={{ mt: 2 }}>
            Recarregar
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!runData) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity="warning">Não foi possível carregar os dados do TRD.</Alert>
      </Box>
    );
  }

  const data = {
    documento_markdown: markdownUi,
    campos: camposUi,
    meta: {
      fileName: termoNome,
      hash_tdr: runId || "",
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: "1400px" },
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
      }}
      ref={contentRef}
    >
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
              Termo de Recebimento Definitivo
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Revisão do documento gerado pela IA
            </Typography>
          </Box>

          <Stack
            spacing={1}
            sx={{
              alignItems: { xs: "flex-start", sm: "flex-end" },
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100%", sm: 520 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "flex-start", sm: "flex-end" },
                gap: 0.5,
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                Nome do TRD:
              </Typography>

              <Typography variant="body2" sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 420 }}>
                {data.meta.fileName}
              </Typography>

              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 0.5 }}>
                ID:
              </Typography>

              <Typography variant="body2" sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 420 }}>
                {data.meta.hash_tdr}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            bgcolor: alpha(theme.palette.info.main, 0.06),
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ color: theme.palette.info.main, mt: 0.5 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
              />
            </svg>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.dark, mb: 1 }}>
              Revisão do Documento
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}>
              Por favor, revise cuidadosamente todas as informações apresentadas no Termo de Recebimento Definitivo antes de salvar o
              documento no processo. Verifique se os dados do contrato, fornecedor, nota fiscal e condições de recebimento estão corretos
              e completos. Após a revisão, você poderá baixar o documento em PDF ou Word e salvá-lo no sistema.
            </Typography>
          </Box>
        </Paper>
      </Box>

      <TrpSummaryCards campos={data.campos} />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha("#000", 0.04)}, 0 8px 24px ${alpha("#000", 0.04)}`,
          overflow: "hidden",
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
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                minHeight: 64,
                px: { xs: 2, sm: 3 },
                color: theme.palette.text.secondary,
                transition: "all 0.2s ease",
                "&:hover": { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                "&.Mui-selected": { color: theme.palette.primary.main, fontWeight: 700 },
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                bgcolor: theme.palette.primary.main,
              },
            }}
          >
            <Tab label="Visualização do Documento" sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }} />
            <Tab label="Dados Estruturados" sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 2, sm: 2.5, md: 0 }, pb: { xs: 3, sm: 4, md: 5 } }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1.25 }}>
              <Tooltip
                title={
                  !runId || !isUuid(runId)
                    ? "ID do TRD inválido"
                    : runData?.status !== "COMPLETED"
                    ? "Aguarde processamento"
                    : downloadingPdf
                    ? "Exportando documento oficial do TRD..."
                    : "Exportar PDF"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={downloadingPdf ? <CircularProgress size={22} color="inherit" /> : <PdfIcon sx={{ fontSize: 22 }} />}
                    onClick={handleDownloadPdf}
                    disabled={!runId || !isUuid(runId) || downloadingPdf || downloadingDocx || runData?.status !== "COMPLETED"}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 999,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.18)}`,
                      "&:hover": { boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.26)}` },
                    }}
                  >
                    {downloadingPdf ? "Exportando..." : "Baixar PDF"}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  !runId || !isUuid(runId)
                    ? "ID do TRD inválido"
                    : runData?.status !== "COMPLETED"
                    ? "Aguarde processamento"
                    : downloadingDocx
                    ? "Exportando documento oficial do TRD..."
                    : "Exportar DOCX"
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={downloadingDocx ? <CircularProgress size={22} /> : <WordIcon sx={{ fontSize: 22 }} />}
                    onClick={handleDownloadWord}
                    disabled={!runId || !isUuid(runId) || downloadingPdf || downloadingDocx || runData?.status !== "COMPLETED"}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: alpha(theme.palette.primary.main, 0.35),
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06), borderColor: theme.palette.primary.main },
                      "&:disabled": { borderColor: alpha(theme.palette.divider, 0.12), color: alpha(theme.palette.text.primary, 0.45) },
                    }}
                  >
                    {downloadingDocx ? "Exportando..." : "Baixar Word"}
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <TrpMarkdownView content={data.documento_markdown} showTitle={false} />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <TrpStructuredDataPanel campos={data.campos} />
          </Box>
        </TabPanel>
      </Paper>

      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={handleScrollToTop}
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            "&:hover": { boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}` },
          }}
          aria-label="Voltar ao topo"
        >
          <ArrowUpIcon />
        </Fab>
      </Zoom>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};
// src/modules/trp/pages/TrpResultPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Zoom,
} from "@mui/material";
import {
  Description as WordIcon,
  Gavel as TrdIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { TrpAgentOutput } from "../../../lib/types/trp";
import { downloadTrpRun, fetchTrpRun, generateTrd, TrpRunData } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";
import { TrpSummaryCards } from "../components/TrpSummaryCards";
import { TrpMarkdownView } from "../components/TrpMarkdownView";
import { TrpStructuredDataPanel } from "../components/TrpStructuredDataPanel";
import { createTrpViewModel, TrpViewModel } from "../utils/trpViewModel";

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

  const replaceObjetoRow = (input: string) =>
    input.replace(/^(\|\s*Objeto\s*\|\s*)(.*?)(\s*\|\s*)$/gim, (_all, p1, cell, p3) => {
      return `${p1}${cleanCell(cell)}${p3}`;
    });

  const m = markdown.match(sectionRegex);
  if (!m) return replaceObjetoRow(markdown);

  const before = m[1];
  const body = m[2];
  const after = m[3];

  return markdown.replace(sectionRegex, `${before}${replaceObjetoRow(body)}${after}`);
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity?: "error" | "success" | "warning";
};

type ApiErrorLike = {
  status?: number;
  message?: string;
};

const isDevMode = (): boolean =>
  import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

const getApiError = (err: unknown): ApiErrorLike => {
  if (typeof err === "object" && err !== null) return err as ApiErrorLike;
  return {};
};

export const TrpResultPage: React.FC = () => {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [runData, setRunData] = useState<TrpRunData | null>(null);
  const [viewModel, setViewModel] = useState<TrpViewModel | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "" });

  const contentRef = useRef<HTMLDivElement>(null);

  const [trdDialogOpen, setTrdDialogOpen] = useState(false);
  const [trdHouveRessalvas, setTrdHouveRessalvas] = useState<"NAO" | "SIM">("NAO");
  const [trdRessalvasTexto, setTrdRessalvasTexto] = useState("");
  const [trdSubmitting, setTrdSubmitting] = useState(false);

  const canGenerateTrd = !!runId && isUuid(runId) && runData?.status === "COMPLETED";

  const pickTrpFileName = (run: TrpRunData | null, fallbackId?: string | null): string => {
    const s = typeof run?.fileName === "string" ? run.fileName.trim() : "";
    if (s) return s;
    return fallbackId ? `TRP_${fallbackId}` : "TRP_Gerado";
  };

  const notify = (next: SnackbarState) => setSnackbar(next);

  const handleAuthError = async () => {
    notify({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
    await signOut();
    navigate("/login", {
      replace: true,
      state: { message: "Sua sessão expirou. Faça login novamente." },
    });
  };

  const loadData = async () => {
    if (!runId) {
      setError("ID do TRP não fornecido na URL");
      setLoading(false);
      return;
    }

    if (!isUuid(runId)) {
      setError("ID do TRP inválido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const run = await fetchTrpRun(runId);

      if (run.runId !== runId) {
        console.error(
          "[TrpResultPage]",
          `Inconsistência: runId da rota (${runId}) não corresponde ao run retornado (${run.runId})`
        );
        setError("Erro ao carregar TRP: inconsistência de dados");
        setLoading(false);
        return;
      }

      if (isDevMode()) {
        console.debug("[TrpResultPage] Run carregado:", {
          runId: run.runId,
          status: run.status,
          hasDocumentoMarkdownFinal: !!run.documento_markdown_final,
          documentoMarkdownFinalLength: run.documento_markdown_final?.length,
          hasCamposTrpNormalizados: !!run.campos_trp_normalizados,
          hasContextoRecebimentoRaw: !!run.contexto_recebimento_raw,
          camposKeys: run.campos_trp_normalizados ? Object.keys(run.campos_trp_normalizados) : [],
          contextoKeys: run.contexto_recebimento_raw ? Object.keys(run.contexto_recebimento_raw) : [],
        });
      }

      setRunData(run);
      setViewModel(createTrpViewModel(run));
    } catch (err) {
      console.error("[TrpResultPage] Erro ao carregar TRP:", err);
      setError(getErrorMessage(err, "Erro desconhecido ao carregar TRP"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!runId) {
      notify({ open: true, message: "ID do TRP não encontrado na URL", severity: "error" });
      return;
    }

    if (!isUuid(runId)) {
      notify({ open: true, message: "ID do TRP inválido", severity: "error" });
      return;
    }

    if (runData && runData.runId !== runId) {
      notify({
        open: true,
        message: "Inconsistência: o documento carregado não corresponde ao ID da URL",
        severity: "error",
      });
      return;
    }

    if (runData?.status !== "COMPLETED") {
      notify({
        open: true,
        message: "Documento ainda não concluído. Aguarde a finalização do processamento.",
        severity: "warning",
      });
      return;
    }

    const setDownloading = format === "pdf" ? setDownloadingPdf : setDownloadingDocx;

    try {
      setDownloading(true);
      await downloadTrpRun(runId, format);
      notify({
        open: true,
        message: `Exportando documento oficial do TRP em ${format.toUpperCase()}...`,
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
        notify({ open: true, message: "Documento não encontrado", severity: "error" });
      } else if (status === 409) {
        notify({ open: true, message: "Documento ainda não finalizado", severity: "warning" });
      } else if (status === 429) {
        notify({ open: true, message: "Aguarde antes de gerar novamente", severity: "warning" });
      } else {
        notify({ open: true, message: errorMessage, severity: "error" });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = () => void handleDownload("pdf");
  const handleDownloadWord = () => void handleDownload("docx");

  const handleOpenTrdDialog = () => {
    if (!canGenerateTrd) {
      notify({
        open: true,
        message: "TRP ainda não concluído. Aguarde a finalização para gerar o TRD.",
        severity: "warning",
      });
      return;
    }
    setTrdHouveRessalvas("NAO");
    setTrdRessalvasTexto("");
    setTrdDialogOpen(true);
  };

  const handleCloseTrdDialog = () => {
    if (trdSubmitting) return;
    setTrdDialogOpen(false);
  };

  const handleConfirmGenerateTrd = async () => {
    if (!runId || !isUuid(runId)) {
      notify({ open: true, message: "ID do TRP inválido", severity: "error" });
      return;
    }

    if (runData?.status !== "COMPLETED") {
      notify({
        open: true,
        message: "TRP ainda não concluído. Aguarde a finalização para gerar o TRD.",
        severity: "warning",
      });
      return;
    }

    const houve_ressalvas = trdHouveRessalvas === "SIM";
    const ressalvas_texto = trdRessalvasTexto?.trim() ?? "";

    if (houve_ressalvas && ressalvas_texto.length === 0) {
      notify({
        open: true,
        message: "Informe o texto das ressalvas para gerar o TRD.",
        severity: "warning",
      });
      return;
    }

    try {
      setTrdSubmitting(true);

      const res = await generateTrd({
        trp_run_id: runId,
        houve_ressalvas,
        ressalvas_texto: houve_ressalvas ? ressalvas_texto : null,
      });

      notify({ open: true, message: "TRD gerado com sucesso. Abrindo resultado...", severity: "success" });
      setTrdDialogOpen(false);
      navigate(`/agents/trd/resultado/${res.runId}`);
    } catch (err) {
      const apiErr = getApiError(err);
      const status = apiErr.status;
      const msg = apiErr.message || "Erro ao gerar TRD. Tente novamente em instantes.";

      if (status === 401 || status === 403) {
        await handleAuthError();
        return;
      }

      notify({ open: true, message: msg, severity: "error" });
    } finally {
      setTrdSubmitting(false);
    }
  };

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      PENDING: "Pendente",
      RUNNING: "Em processamento",
      FAILED: "Falhou",
    }),
    []
  );

  const termoNome = useMemo(() => pickTrpFileName(runData, viewModel?.runId || null), [runData, viewModel]);

  const markdownUi = useMemo(
    () => normalizeIdentificacaoObjetoMarkdown(viewModel?.documento_markdown || ""),
    [viewModel]
  );

  const data: TrpAgentOutput | null = useMemo(() => {
    if (!viewModel) return null;
    return {
      documento_markdown: markdownUi,
      campos: viewModel.campos,
      meta: {
        fileName: termoNome,
        hash_tdr: viewModel.runId || "",
      },
    };
  }, [markdownUi, termoNome, viewModel]);

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
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity={runData.status === "FAILED" ? "error" : "info"}>
          <Typography variant="h6" gutterBottom>
            Status: {statusLabels[runData.status] || runData.status}
          </Typography>
          <Typography variant="body2">
            {runData.status === "PENDING" && "O TRP está aguardando processamento."}
            {runData.status === "RUNNING" &&
              "O TRP está sendo processado. Aguarde alguns instantes e recarregue a página."}
            {runData.status === "FAILED" && "O processamento do TRP falhou. Tente gerar novamente."}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => runId && window.location.reload()} sx={{ mt: 2 }}>
            Recarregar
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!viewModel || !runData || !data) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity="warning">Não foi possível carregar os dados do TRP.</Alert>
      </Box>
    );
  }

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
              Termo de Recebimento Provisório
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
                Nome do TRP:
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 420 }}
              >
                {data.meta.fileName}
              </Typography>

              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 0.5 }}>
                ID:
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 420 }}
              >
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
              Por favor, revise cuidadosamente todas as informações apresentadas no Termo de Recebimento Provisório antes
              de salvar o documento no processo. Verifique se os dados do contrato, fornecedor, nota fiscal e condições
              de recebimento estão corretos e completos. Após a revisão, você poderá baixar o documento em PDF ou Word e
              salvá-lo no sistema de gestão de processos.
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
                "&:hover": {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                "&.Mui-selected": {
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                },
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                bgcolor: theme.palette.primary.main,
              },
            }}
          >
            <Tab
              label="Visualização do Documento"
              sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
            />
            <Tab
              label="Dados Estruturados"
              sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box
            sx={{
              px: { xs: 3, sm: 4, md: 5 },
              pt: { xs: 2, sm: 2.5, md: 0 },
              pb: { xs: 3, sm: 4, md: 5 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                mb: 1.25,
              }}
            >
              <Tooltip
                title={
                  !canGenerateTrd
                    ? "Aguarde o TRP finalizar para gerar o TRD"
                    : "Gerar Termo de Recebimento Definitivo (TRD)"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    startIcon={<TrdIcon sx={{ fontSize: 22 }} />}
                    onClick={handleOpenTrdDialog}
                    disabled={!canGenerateTrd || trdSubmitting}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      px: 2.25,
                      py: 1.25,
                      borderRadius: 999,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.18)}`,
                      "&:hover": {
                        boxShadow: `0 10px 24px ${alpha(theme.palette.secondary.main, 0.26)}`,
                      },
                      "&:disabled": { opacity: 0.65 },
                    }}
                  >
                    Gerar TRD
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  !runId || !isUuid(runId)
                    ? "ID do TRP inválido"
                    : runData?.status !== "COMPLETED"
                    ? "Aguarde processamento"
                    : downloadingPdf
                    ? "Exportando documento oficial do TRP..."
                    : "Exportar PDF"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      downloadingPdf ? <CircularProgress size={22} color="inherit" /> : <PdfIcon sx={{ fontSize: 22 }} />
                    }
                    onClick={handleDownloadPdf}
                    disabled={
                      !runId ||
                      !isUuid(runId) ||
                      downloadingPdf ||
                      downloadingDocx ||
                      runData?.status !== "COMPLETED"
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 999,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.18)}`,
                      "&:hover": {
                        boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.26)}`,
                      },
                    }}
                  >
                    {downloadingPdf ? "Exportando..." : "Baixar PDF"}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  !runId || !isUuid(runId)
                    ? "ID do TRP inválido"
                    : runData?.status !== "COMPLETED"
                    ? "Aguarde processamento"
                    : downloadingDocx
                    ? "Exportando documento oficial do TRP..."
                    : "Exportar DOCX"
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={downloadingDocx ? <CircularProgress size={22} /> : <WordIcon sx={{ fontSize: 22 }} />}
                    onClick={handleDownloadWord}
                    disabled={
                      !runId ||
                      !isUuid(runId) ||
                      downloadingPdf ||
                      downloadingDocx ||
                      runData?.status !== "COMPLETED"
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: alpha(theme.palette.primary.main, 0.35),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderColor: theme.palette.primary.main,
                      },
                      "&:disabled": {
                        borderColor: alpha(theme.palette.divider, 0.12),
                        color: alpha(theme.palette.text.primary, 0.45),
                      },
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
            "&:hover": {
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
          aria-label="Voltar ao topo"
        >
          <ArrowUpIcon />
        </Fab>
      </Zoom>

      <Dialog open={trdDialogOpen} onClose={handleCloseTrdDialog} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          Gerar TRD (Recebimento Definitivo)
          <IconButton onClick={handleCloseTrdDialog} disabled={trdSubmitting} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe se houve ressalvas no recebimento definitivo. Se houver, descreva as ressalvas para constarem no TRD.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              bgcolor: alpha(theme.palette.grey[50], 0.65),
            }}
          >
            <FormControl component="fieldset" fullWidth>
              <FormLabel sx={{ fontWeight: 700, mb: 1 }}>Houve ressalvas?</FormLabel>

              <RadioGroup
                row
                value={trdHouveRessalvas}
                onChange={(e) => setTrdHouveRessalvas(e.target.value as "NAO" | "SIM")}
              >
                <FormControlLabel value="NAO" control={<Radio />} label="Não" />
                <FormControlLabel value="SIM" control={<Radio />} label="Sim" />
              </RadioGroup>
            </FormControl>

            {trdHouveRessalvas === "SIM" && (
              <>
                <Divider sx={{ my: 2 }} />
                <TextField
                  label="Descreva as ressalvas"
                  value={trdRessalvasTexto}
                  onChange={(e) => setTrdRessalvasTexto(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Ex.: Entregas parciais, divergência de especificação, pendências documentais, etc."
                />
              </>
            )}
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseTrdDialog} disabled={trdSubmitting} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleConfirmGenerateTrd}
            disabled={
              trdSubmitting ||
              !canGenerateTrd ||
              (trdHouveRessalvas === "SIM" && (trdRessalvasTexto?.trim()?.length ?? 0) === 0)
            }
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, px: 2.25 }}
            startIcon={trdSubmitting ? <CircularProgress size={18} color="inherit" /> : <TrdIcon />}
          >
            {trdSubmitting ? "Gerando..." : "Gerar TRD"}
          </Button>
        </DialogActions>
      </Dialog>

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
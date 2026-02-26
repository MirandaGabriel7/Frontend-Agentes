// src/modules/trp/pages/TrpResultPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  alpha,
  Box,
  Button,
  ButtonGroup,
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
  Menu,
  MenuItem,
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
  EditNote as EditNoteIcon,
  Gavel as TrdIcon,
  History as HistoryIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Save as SaveIcon,
  
} from "@mui/icons-material";
import { TrpAgentOutput } from "../../../lib/types/trp";
import {
  createTrpRunVersion,
  downloadTrpRun,
  fetchTrpRun,
  generateTrd,
  listTrpRunVersions,
  TrpRunData,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";
import { TrpSummaryCards } from "../components/TrpSummaryCards";
import { TrpMarkdownView } from "../components/TrpMarkdownView";
import { TrpStructuredDataPanel } from "../components/TrpStructuredDataPanel";
import { TrpInteractiveView } from "../components/TrpInteractiveView";
import { createTrpViewModel, TrpViewModel } from "../utils/trpViewModel";
import {
  buildTrpMarkdownWithTokens,
  resolveTemplateToMarkdown,
  setValueByPath,
} from "../utils/trpTemplate";
import { canonicalizeCampos } from "../utils/canonicalizeCampos";

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

const isDevMode = () =>
  import.meta.env?.MODE === "development" || import.meta.env?.DEV === true;

const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

const getApiError = (err: unknown): { status?: number; message?: string } =>
  typeof err === "object" && err !== null
    ? (err as { status?: number; message?: string })
    : {};

function tryFormatDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleString("pt-BR") : value;
}

function normalizeIdentificacaoObjetoMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return markdown;

  const cleanCell = (cell: unknown) =>
    String(cell)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const replaceObjetoRow = (input: string) =>
    input.replace(
      /^(\|\s*Objeto\s*\|\s*)(.*?)(\s*\|\s*)$/gim,
      (_all, p1, cell, p3) => `${p1}${cleanCell(cell)}${p3}`,
    );

  const sectionRegex =
    /(\n#{2,3}\s*1\.\s*Identificação do Contrato\s*\n)([\s\S]*?)(\n#{2,3}\s*2\.\s*Objeto fornecido\/prestado\s*\n|\n#{2,3}\s*2\.\s*Objeto\s*\n|$)/i;

  const m = markdown.match(sectionRegex);
  if (!m) return replaceObjetoRow(markdown);

  const [, before, body, after] = m;
  return markdown.replace(sectionRegex, `${before}${replaceObjetoRow(body)}${after}`);
}

function pickTrpFileName(run: TrpRunData | null, fallbackId?: string | null): string {
  const s = typeof run?.fileName === "string" ? run.fileName.trim() : "";
  return s || (fallbackId ? `TRP_${fallbackId}` : "TRP_Gerado");
}

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

type SnackbarState = {
  open: boolean;
  message: string;
  severity?: "error" | "success" | "warning";
};

type TrpVersionItem = {
  runId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  fileName?: string;
  createdAt: string;
  familyId: string;
  versionNumber: number | null;
  isCurrent: boolean;
  baseRunId: string | null;
};

// ---------------------------------------------------------------------------
// Sub-componentes pequenos
// ---------------------------------------------------------------------------

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  RUNNING: "Em processamento",
  PROCESSING: "Em processamento",
  COMPLETED: "Concluído",
  FAILED: "Falhou",
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export const TrpResultPage: React.FC = () => {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { signOut } = useAuth();

  // ── Dados ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runData, setRunData] = useState<TrpRunData | null>(null);
  const [viewModel, setViewModel] = useState<TrpViewModel | null>(null);

  // ── UI geral ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "" });
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Downloads ──────────────────────────────────────────────────────────────
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  // ── TRD ───────────────────────────────────────────────────────────────────
  const [trdDialogOpen, setTrdDialogOpen] = useState(false);
  const [trdHouveRessalvas, setTrdHouveRessalvas] = useState<"NAO" | "SIM">("NAO");
  const [trdRessalvasTexto, setTrdRessalvasTexto] = useState("");
  const [trdSubmitting, setTrdSubmitting] = useState(false);

  // ── Versões ────────────────────────────────────────────────────────────────
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<TrpVersionItem[]>([]);

  // ── Inline editing ─────────────────────────────────────────────────────────
  const originalCamposRef = useRef<Record<string, any>>({});
  const [draftCampos, setDraftCampos] = useState<Record<string, any>>({});
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveVersionDialogOpen, setSaveVersionDialogOpen] = useState(false);
  const [saveVersionFileName, setSaveVersionFileName] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  const canOperateRun = !!runId && isUuid(runId) && runData?.status === "COMPLETED";
  const canGenerateTrd = canOperateRun;

  // markdown base (original do backend) — fonte para injetar tokens
  const [draftMarkdownBase, setDraftMarkdownBase] = useState<string>("");

  const markdownWithTokens = useMemo(
    () =>
      draftMarkdownBase
        ? buildTrpMarkdownWithTokens(draftMarkdownBase, draftCampos)
        : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftMarkdownBase, draftCampos],
  );

  const resolvedMarkdown = useMemo(
    () => resolveTemplateToMarkdown(markdownWithTokens, draftCampos),
    [markdownWithTokens, draftCampos],
  );

  // ---------------------------------------------------------------------------
  // Notificações
  // ---------------------------------------------------------------------------

  const notify = useCallback((next: SnackbarState) => setSnackbar(next), []);

  const handleAuthError = useCallback(async () => {
    notify({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
    await signOut();
    navigate("/login", {
      replace: true,
      state: { message: "Sua sessão expirou. Faça login novamente." },
    });
  }, [notify, signOut, navigate]);

  // ---------------------------------------------------------------------------
  // Carregamento de dados
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    if (!runId) { setError("ID do TRP não fornecido na URL"); setLoading(false); return; }
    if (!isUuid(runId)) { setError("ID do TRP inválido"); setLoading(false); return; }

    try {
      setLoading(true);
      setError(null);

      const run = await fetchTrpRun(runId);

      if (run.runId !== runId) {
        setError("Erro ao carregar TRP: inconsistência de dados");
        setLoading(false);
        return;
      }

      if (isDevMode()) {
        console.debug("[TrpResultPage] Run carregado:", {
          runId: run.runId,
          status: run.status,
          hasMarkdown: !!run.documento_markdown_final,
          hasCampos: !!run.campos_trp_normalizados,
        });
      }

      setRunData(run);
      const vm = createTrpViewModel(run);
      setViewModel(vm);

      // Inicializa draft campos com os dados carregados
      const campos = (vm.campos ?? {}) as Record<string, any>;
      originalCamposRef.current = JSON.parse(JSON.stringify(campos));
      setDraftCampos(JSON.parse(JSON.stringify(campos)));
      // Salva o markdown real do backend como base para injeção de tokens
      setDraftMarkdownBase(vm.documento_markdown ?? "");
    } catch (err) {
      setError(getErrorMessage(err, "Erro desconhecido ao carregar TRP"));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Fecha todos os dialogs ao trocar de versão (runId muda)
  useEffect(() => {
    setVersionsDialogOpen(false);
    setSaveVersionDialogOpen(false);
    setTrdDialogOpen(false);
    setEditMode(false);
    setHasUnsavedChanges(false);
  }, [runId]);

  useEffect(() => {
    const handleScroll = () =>
      setShowScrollTop((window.pageYOffset || document.documentElement.scrollTop) > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------------------------------------------------------------------------
  // Downloads
  // ---------------------------------------------------------------------------

  const handleDownload = useCallback(
    async (format: "pdf" | "docx") => {
      if (!runId || !isUuid(runId)) {
        notify({ open: true, message: "ID do TRP inválido", severity: "error" });
        return;
      }
      if (runData?.status !== "COMPLETED") {
        notify({ open: true, message: "Documento ainda não concluído.", severity: "warning" });
        return;
      }

      const setDownloading = format === "pdf" ? setDownloadingPdf : setDownloadingDocx;
      try {
        setDownloading(true);
        await downloadTrpRun(runId, format);
        notify({ open: true, message: `Exportando TRP em ${format.toUpperCase()}...`, severity: "success" });
      } catch (err) {
        const apiErr = getApiError(err);
        if (apiErr.status === 401 || apiErr.status === 403) { await handleAuthError(); return; }
        notify({ open: true, message: apiErr.message || "Erro ao baixar arquivo", severity: "error" });
      } finally {
        setDownloading(false);
      }
    },
    [runId, runData, notify, handleAuthError],
  );

  // ---------------------------------------------------------------------------
  // Inline editing
  // ---------------------------------------------------------------------------

  const handleCommit = useCallback((fieldId: string, value: any) => {
    setDraftCampos((prev) => setValueByPath(prev, fieldId, value));
    setHasUnsavedChanges(true);
  }, []);

  const handleCancelEdits = useCallback(() => {
    setDraftCampos(JSON.parse(JSON.stringify(originalCamposRef.current)));
    setHasUnsavedChanges(false);
    setEditMode(false);
  }, []);

  const handleSaveVersion = useCallback(async () => {
    if (!runId || !isUuid(runId)) return;

    try {
      setSavingVersion(true);
      const res = await createTrpRunVersion(runId, {
        campos_trp_normalizados: canonicalizeCampos(draftCampos),
        documento_markdown_final: resolvedMarkdown,
        file_name: saveVersionFileName.trim() || null,
      });

      originalCamposRef.current = JSON.parse(JSON.stringify(draftCampos));
      setHasUnsavedChanges(false);
      setSaveVersionDialogOpen(false);
      setEditMode(false);

      notify({ open: true, message: `Nova versão criada com sucesso! (v${res.version_number})`, severity: "success" });

      const newRunId = (res as any)?.runId || (res as any)?.run_id;
      if (typeof newRunId === "string" && isUuid(newRunId)) {
        navigate(`/agents/trp/resultado/${newRunId}`);
      }
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.status === 401 || apiErr.status === 403) { await handleAuthError(); return; }
      notify({ open: true, message: apiErr.message || "Erro ao criar nova versão", severity: "error" });
    } finally {
      setSavingVersion(false);
    }
  }, [runId, draftCampos, resolvedMarkdown, saveVersionFileName, notify, handleAuthError, navigate]);

  // ---------------------------------------------------------------------------
  // Versões
  // ---------------------------------------------------------------------------

  const refreshVersions = useCallback(async (targetRunId: string) => {
    const result = await listTrpRunVersions(targetRunId);
    // O backend retorna { data: { items: [...] } } ou array direto
    const raw = (result as any)?.data?.items ?? (result as any)?.items ?? result ?? [];
    setVersions(
      (raw as any[]).map((v: any) => ({
        // backend já retorna camelCase (listVersionsByRunId no repository)
        runId:         v.runId         ?? v.run_id         ?? "",
        status:        v.status        ?? "COMPLETED",
        fileName:      v.fileName      ?? v.file_name      ?? undefined,
        createdAt:     v.createdAt     ?? v.created_at     ?? "",
        familyId:      v.familyId      ?? v.family_id      ?? "",
        versionNumber: v.versionNumber ?? v.version_number ?? null,
        isCurrent:     v.isCurrent     ?? v.is_current     ?? false,
        baseRunId:     v.baseRunId     ?? v.base_run_id    ?? null,
      }))
    );
  }, []);

  const handleOpenVersionsDialog = useCallback(async () => {
    if (!runId || !isUuid(runId)) {
      notify({ open: true, message: "ID do TRP inválido", severity: "error" });
      return;
    }
    try {
      setVersionsDialogOpen(true);
      setVersionsLoading(true);
      await refreshVersions(runId);
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.status === 401 || apiErr.status === 403) { await handleAuthError(); return; }
      notify({ open: true, message: apiErr.message || "Falha ao carregar versões", severity: "error" });
    } finally {
      setVersionsLoading(false);
    }
  }, [runId, notify, handleAuthError, refreshVersions]);

  // ---------------------------------------------------------------------------
  // TRD
  // ---------------------------------------------------------------------------

  const handleConfirmGenerateTrd = useCallback(async () => {
    if (!runId || !isUuid(runId) || runData?.status !== "COMPLETED") return;

    const houve_ressalvas = trdHouveRessalvas === "SIM";
    if (houve_ressalvas && !trdRessalvasTexto.trim()) {
      notify({ open: true, message: "Informe o texto das ressalvas.", severity: "warning" });
      return;
    }

    try {
      setTrdSubmitting(true);
      const res = await generateTrd({
        trp_run_id: runId,
        houve_ressalvas,
        ressalvas_texto: houve_ressalvas ? trdRessalvasTexto.trim() : null,
      });
      notify({ open: true, message: "TRD gerado com sucesso!", severity: "success" });
      setTrdDialogOpen(false);
      navigate(`/agents/trd/resultado/${res.runId}`);
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.status === 401 || apiErr.status === 403) { await handleAuthError(); return; }
      notify({ open: true, message: apiErr.message || "Erro ao gerar TRD.", severity: "error" });
    } finally {
      setTrdSubmitting(false);
    }
  }, [runId, runData, trdHouveRessalvas, trdRessalvasTexto, notify, handleAuthError, navigate]);

  // ---------------------------------------------------------------------------
  // Dados derivados para a UI
  // ---------------------------------------------------------------------------

  const termoNome = useMemo(
    () => pickTrpFileName(runData, viewModel?.runId || null),
    [runData, viewModel],
  );

  const markdownUi = useMemo(
    () => normalizeIdentificacaoObjetoMarkdown(viewModel?.documento_markdown || ""),
    [viewModel],
  );

  const data: TrpAgentOutput | null = useMemo(() => {
    if (!viewModel) return null;
    return {
      documento_markdown: markdownUi,
      campos: viewModel.campos,
      meta: { fileName: termoNome, hash_tdr: viewModel.runId || "" },
    };
  }, [markdownUi, termoNome, viewModel]);

  // ---------------------------------------------------------------------------
  // Estados de loading / erro
  // ---------------------------------------------------------------------------

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
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Tentar novamente</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (runData && runData.status !== "COMPLETED") {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity={runData.status === "FAILED" ? "error" : "info"}>
          <Typography variant="h6" gutterBottom>Status: {STATUS_LABELS[runData.status] || runData.status}</Typography>
          <Typography variant="body2">
            {runData.status === "PENDING" && "O TRP está aguardando processamento."}
            {(runData.status === "RUNNING" || (runData.status as any) === "PROCESSING") && "O TRP está sendo processado. Aguarde e recarregue."}
            {runData.status === "FAILED" && "O processamento do TRP falhou. Tente gerar novamente."}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => window.location.reload()} sx={{ mt: 2 }}>Recarregar</Button>
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

  // ---------------------------------------------------------------------------
  // Render principal
  // ---------------------------------------------------------------------------

  return (
    <Box
      ref={contentRef}
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: "1400px" },
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 0.75 }}>
              Termo de Recebimento Provisório
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Revisão e edição do documento gerado pela IA
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, bgcolor: alpha(theme.palette.grey[50], 0.55), width: { xs: "100%", md: "auto" }, minWidth: { md: 520 } }}>
            <Stack spacing={0.75} sx={{ alignItems: { xs: "flex-start", md: "flex-end" } }}>
              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>Nome do TRP</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 520 }}>{data.meta.fileName}</Typography>
              <Divider flexItem sx={{ my: 0.5 }} />
              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>ID</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, wordBreak: "break-all", maxWidth: 520 }}>{data.meta.hash_tdr}</Typography>
            </Stack>
          </Paper>
        </Box>
      </Box>



      {/* ── Cards resumo ───────────────────────────────────────────────────── */}
      <TrpSummaryCards campos={data.campos} />

      {/* ── Painel principal ───────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha("#000", 0.04)}, 0 8px 24px ${alpha("#000", 0.04)}`,
          overflow: "hidden",
        }}
      >
        {/* Tabs + Ações */}
        <Box
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: alpha(theme.palette.grey[50], 0.55),
            px: { xs: 2, sm: 3 },
            py: 1.25,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 1.25,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 48,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem", minHeight: 48, px: { xs: 1.5, sm: 2.5 }, color: theme.palette.text.secondary, transition: "all 0.2s ease", "&:hover": { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) }, "&.Mui-selected": { color: theme.palette.primary.main, fontWeight: 900 } },
              "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: theme.palette.primary.main },
            }}
          >
            <Tab label="Documento" />
            <Tab label="Dados estruturados" />
          </Tabs>

          <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <ButtonGroup variant="outlined" size="medium" sx={{ "& .MuiButton-root": { textTransform: "none", fontWeight: 800, borderColor: alpha(theme.palette.divider, 0.18) } }}>
              <Tooltip title={editMode ? "Sair do modo de edição" : "Editar valores diretamente no documento"}>
                <span>
                  <Button
                    onClick={() => editMode ? handleCancelEdits() : setEditMode(true)}
                    disabled={!canOperateRun || savingVersion || trdSubmitting}
                    startIcon={<EditNoteIcon />}
                    color={editMode ? "warning" : "primary"}
                    sx={{ borderRadius: 999, px: 2, ...(editMode && { borderColor: theme.palette.warning.main, color: theme.palette.warning.dark }) }}
                  >
                    {editMode ? "Cancelar edição" : "Editar documento"}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Histórico de versões">
                <span>
                  <Button
                    onClick={handleOpenVersionsDialog}
                    disabled={!runId || !isUuid(runId) || savingVersion}
                    startIcon={<HistoryIcon />}
                    sx={{ borderRadius: 999, px: 2 }}
                  >
                    Versões
                  </Button>
                </span>
              </Tooltip>
            </ButtonGroup>

            <Tooltip title={!canGenerateTrd ? "Aguarde o TRP finalizar" : "Gerar Termo de Recebimento Definitivo"}>
              <span>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => { setTrdHouveRessalvas("NAO"); setTrdRessalvasTexto(""); setTrdDialogOpen(true); }}
                  disabled={!canGenerateTrd || trdSubmitting || savingVersion}
                  startIcon={<TrdIcon />}
                  sx={{ textTransform: "none", fontWeight: 900, px: 2.25, borderRadius: 999, boxShadow: `0 10px 24px ${alpha(theme.palette.secondary.main, 0.18)}` }}
                >
                  Gerar TRD
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={!canOperateRun ? "Aguarde processamento" : "Exportar documento"}>
              <span>
                <Button
                  variant="contained"
                  onClick={(e) => setExportAnchorEl(e.currentTarget)}
                  disabled={!canOperateRun || downloadingPdf || downloadingDocx || savingVersion || trdSubmitting}
                  endIcon={<ArrowDownIcon />}
                  startIcon={(downloadingPdf || downloadingDocx) ? <CircularProgress size={18} color="inherit" /> : <PdfIcon />}
                  sx={{ textTransform: "none", fontWeight: 900, px: 2.25, borderRadius: 999, boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.18)}` }}
                >
                  Exportar
                </Button>
              </span>
            </Tooltip>

            <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={() => { setExportAnchorEl(null); void handleDownload("pdf"); }} disabled={downloadingPdf || downloadingDocx}>
                <PdfIcon fontSize="small" style={{ marginRight: 10 }} /> Baixar PDF
              </MenuItem>
              <MenuItem onClick={() => { setExportAnchorEl(null); void handleDownload("docx"); }} disabled={downloadingPdf || downloadingDocx}>
                <WordIcon fontSize="small" style={{ marginRight: 10 }} /> Baixar Word
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* ── Tab 0: Documento (com inline editing) ─────────────────────── */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, pb: { xs: 3, sm: 4, md: 5 } }}>

            {/* Banner contextual + toolbar de edição — só aparecem em editMode */}
            {editMode && (
              <>
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, bgcolor: alpha(theme.palette.warning.main, 0.06), display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ color: theme.palette.warning.dark, mt: 0.25, flexShrink: 0 }}>
                    <EditNoteIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.warning.dark, mb: 0.5 }}>Modo de edição ativo</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}>
                      Clique em qualquer valor no documento para editá-lo. Ao finalizar, clique em <b>Salvar nova versão</b>.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={savingVersion ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    size="medium"
                    disabled={!hasUnsavedChanges || savingVersion}
                    onClick={() => { setSaveVersionFileName(termoNome); setSaveVersionDialogOpen(true); }}
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.25 }}
                  >
                    Salvar nova versão
                  </Button>
                  {hasUnsavedChanges && (
                    <Typography variant="caption" color="warning.dark" sx={{ fontStyle: "italic" }}>
                      ● Alterações não salvas
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Documento interativo (ou estático fora do modo de edição) */}
            {editMode ? (
              <TrpInteractiveView
                markdownWithTokens={markdownWithTokens}
                campos={draftCampos}
                editMode={editMode}
                onCommit={handleCommit}
              />
            ) : (
              <TrpMarkdownView content={data.documento_markdown} showTitle={false} />
            )}
          </Box>
        </TabPanel>

        {/* ── Tab 1: Dados estruturados ──────────────────────────────────── */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <TrpStructuredDataPanel campos={data.campos} />
          </Box>
        </TabPanel>
      </Paper>

      {/* ── Scroll to top ──────────────────────────────────────────────────── */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000, boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` }}
          aria-label="Voltar ao topo"
        >
          <ArrowUpIcon />
        </Fab>
      </Zoom>

      {/* ── Dialog: Salvar nova versão (inline editing) ────────────────────── */}
      <Dialog open={saveVersionDialogOpen} onClose={() => !savingVersion && setSaveVersionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Salvar nova versão
          <IconButton onClick={() => setSaveVersionDialogOpen(false)} disabled={savingVersion} size="small"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Isso cria uma nova versão do TRP com as edições feitas. O documento original não é modificado.
          </Typography>
          <TextField
            label="Nome do TRP (opcional)"
            fullWidth
            value={saveVersionFileName}
            onChange={(e) => setSaveVersionFileName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleSaveVersion(); } }}
            size="small"
            disabled={savingVersion}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSaveVersionDialogOpen(false)} disabled={savingVersion} sx={{ textTransform: "none", fontWeight: 800 }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveVersion()}
            disabled={savingVersion}
            startIcon={savingVersion ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2.5, px: 2.25 }}
          >
            {savingVersion ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: TRD ───────────────────────────────────────────────────── */}
      <Dialog open={trdDialogOpen} onClose={() => !trdSubmitting && setTrdDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          Gerar TRD (Recebimento Definitivo)
          <IconButton onClick={() => setTrdDialogOpen(false)} disabled={trdSubmitting} size="small"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe se houve ressalvas no recebimento definitivo.
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, bgcolor: alpha(theme.palette.grey[50], 0.65) }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel sx={{ fontWeight: 800, mb: 1 }}>Houve ressalvas?</FormLabel>
              <RadioGroup row value={trdHouveRessalvas} onChange={(e) => setTrdHouveRessalvas(e.target.value as "NAO" | "SIM")}>
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
                  placeholder="Ex.: Entregas parciais, divergência de especificação, etc."
                />
              </>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setTrdDialogOpen(false)} disabled={trdSubmitting} sx={{ textTransform: "none", fontWeight: 800 }}>Cancelar</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => void handleConfirmGenerateTrd()}
            disabled={trdSubmitting || !canGenerateTrd || (trdHouveRessalvas === "SIM" && !trdRessalvasTexto.trim())}
            startIcon={trdSubmitting ? <CircularProgress size={18} color="inherit" /> : <TrdIcon />}
            sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2.5, px: 2.25 }}
          >
            {trdSubmitting ? "Gerando..." : "Gerar TRD"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Histórico de versões ────────────────────────────────────── */}
      <Dialog open={versionsDialogOpen} onClose={() => !savingVersion && setVersionsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          Histórico de versões do TRP
          <IconButton onClick={() => setVersionsDialogOpen(false)} disabled={savingVersion} size="small"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A versão marcada como <b>Atual</b> é a corrente (is_current=true).
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.grey[50], 0.7), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography sx={{ fontWeight: 950 }}>Versões</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {versionsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
              ) : versions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhuma versão encontrada.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {[...versions]
                    .sort((a, b) => {
                      const diff = (b.versionNumber ?? 0) - (a.versionNumber ?? 0);
                      return diff !== 0 ? diff : String(b.createdAt).localeCompare(String(a.createdAt));
                    })
                    .map((v) => (
                      <Paper key={v.runId} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, bgcolor: v.isCurrent ? alpha(theme.palette.primary.main, 0.06) : "transparent" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                          <Box sx={{ minWidth: 260 }}>
                            <Typography sx={{ fontWeight: 950 }}>
                              Versão {v.versionNumber ?? "-"}{v.isCurrent ? " • Atual" : ""}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                              Criada em: {tryFormatDateTime(v.createdAt)}
                            </Typography>
                            {v.fileName && (
                              <Typography variant="body2" color="text.secondary">Nome: {v.fileName}</Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                              Run ID: <Box component="span" sx={{ fontFamily: "monospace" }}>{v.runId}</Box>
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                if (isUuid(v.runId)) {
                                  setVersionsDialogOpen(false);
                                  navigate(`/agents/trp/resultado/${v.runId}`);
                                }
                              }}
                              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                            >
                              Abrir
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                </Box>
              )}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setVersionsDialogOpen(false)} disabled={savingVersion} sx={{ textTransform: "none", fontWeight: 900 }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity ?? "info"}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 300 }}
          action={
            <IconButton size="small" color="inherit" onClick={() => setSnackbar((s) => ({ ...s, open: false }))}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
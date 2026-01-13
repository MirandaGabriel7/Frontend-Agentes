import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Snackbar,
  Tooltip,
  IconButton,
  TextField,
  Divider,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import { TrpAgentOutput } from "../../../lib/types/trp";
import {
  fetchTrpRun,
  downloadTrpRun,
  reviseTrpRun,
  TrpRunData,
} from "../../../services/api";
import { TrpSummaryCards } from "../components/TrpSummaryCards";
import { TrpMarkdownView } from "../components/TrpMarkdownView";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";
import { createTrpViewModel, TrpViewModel } from "../utils/trpViewModel";
import { TrpStructuredDataEditor } from "../components/TrpStructuredDataEditor";

// =======================
// Helpers (Edit Draft)
// =======================
function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ").replace(/\s{2,}/g, " ").trim();

  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function deepMergeKeepRight(base: any, override: any): any {
  // merge simples: override ganha, mas mantém chaves do base
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override !== undefined ? override : base;
  }

  const out: Record<string, any> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    if (isPlainObject(out[k]) && isPlainObject(v)) out[k] = deepMergeKeepRight(out[k], v);
    else out[k] = v;
  }
  return out;
}

/**
 * ✅ Campos defaults para garantir "edição total"
 * (mesmo se o run não trouxer, o editor consegue renderizar vazio)
 *
 * Obs: se você tiver outros campos no schema, adicione aqui.
 */
const DEFAULT_TRP_FIELDS: Record<string, any> = {
  // Identificação
  fileName: null,
  numero_contrato: "",
  processo_licitatorio: "",
  objeto_contrato: "",
  tipo_contrato: "",
  contratada: "",
  cnpj: "",
  vigencia: "",
  competencia_mes_ano: "",

  // Itens (novo)
  itens_objeto: [],
  valor_total_itens: null,
  valor_total_geral: null,

  // Fiscal / Documento fiscal
  numero_nf: "",
  vencimento_nf: "",
  numero_empenho: "",
  numero_ordem_compra: "",

  // Valores compat
  valor_efetivo_numero: null,
  valor_efetivo_formatado: "",

  // Datas / Prazos
  tipo_base_prazo: "",
  data_recebimento: "",
  data_entrega: "",
  data_conclusao_servico: "",
  data_prevista_entrega_contrato: "",
  data_entrega_real: "",
  condicao_prazo: "",
  motivo_atraso: "",

  // Quantidade
  condicao_quantidade_ordem: "",
  condicao_quantidade_nf: "",
  comentarios_quantidade_ordem: "",
  comentarios_quantidade_nf: "",

  // Observações
  observacoes: "",
  observacoes_recebimento: "",

  // Assinaturas
  fiscal_contrato_nome: "",
  data_assinatura: "",

  // Prazos editáveis finais (se você usa)
  prazos_calculados_final: null,

  // Legado (se ainda existir em runs antigos)
  objeto_fornecido: "",
  unidade_medida: "",
  quantidade_recebida: null,
  valor_unitario: null,
  valor_total_calculado: null,
};

function buildDraftCamposFromRun(run: TrpRunData): Record<string, any> {
  // 1) base defaults (para forçar existência de tudo)
  const base = { ...DEFAULT_TRP_FIELDS };

  // 2) pega campos do run (sem filtro)
  const camposRaw =
    (run.campos_trp_normalizados ??
      run.camposTrpNormalizados ??
      run.campos_trp ??
      run.campos ??
      {}) as Record<string, unknown>;

  // 3) contexto raw (pode complementar)
  const contextoRaw = (run.contexto_recebimento_raw ?? {}) as Record<string, unknown>;

  // 4) merge: defaults -> camposRaw -> contextoRaw -> fileName topo (se existir)
  let merged = deepMergeKeepRight(base, camposRaw);
  merged = deepMergeKeepRight(merged, contextoRaw);

  // 5) fileName prioriza topo / contexto, sanitiza
  const top = sanitizeFileName(run.fileName);
  const ctx = sanitizeFileName((run.contexto_recebimento_raw as any)?.fileName);
  const fn = top || ctx || sanitizeFileName((merged as any)?.fileName);
  merged.fileName = fn;

  return merged;
}

// =======================
// UI helpers
// =======================
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

export const TrpEditPage: React.FC = () => {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [runData, setRunData] = useState<TrpRunData | null>(null);
  const [viewModel, setViewModel] = useState<TrpViewModel | null>(null);

  // ✅ draft editável TOTAL (sem filtro)
  const [draftCampos, setDraftCampos] = useState<Record<string, any>>({ ...DEFAULT_TRP_FIELDS });

  const [activeTab, setActiveTab] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [revisionReason, setRevisionReason] = useState<string>("");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "error" | "success" | "warning";
  }>({
    open: false,
    message: "",
  });

  const contentRef = useRef<HTMLDivElement>(null);

  function pickTrpFileName(run: TrpRunData | null, fallbackId?: string | null): string {
    const raw =
      run?.fileName ??
      (typeof run?.contexto_recebimento_raw?.fileName === "string"
        ? run.contexto_recebimento_raw.fileName
        : null);

    const s = typeof raw === "string" ? raw.trim() : "";
    if (s) return s;
    return fallbackId ? `TRP_${fallbackId}` : "TRP_Gerado";
  }

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
        console.error("[TrpEditPage] Inconsistência de runId:", {
          route: runId,
          returned: run.runId,
        });
        setError("Erro ao carregar TRP: inconsistência de dados");
        setLoading(false);
        return;
      }

      if (run.status !== "COMPLETED") {
        setError("Só é possível editar um TRP com status COMPLETED.");
        setLoading(false);
        return;
      }

      setRunData(run);

      // ✅ viewModel apenas para renderizar documento/resultado atual
      const vm = createTrpViewModel(run);
      setViewModel(vm);

      // ✅ draft REAL = bruto do run (sem filtros)
const draft = buildDraftCamposFromRun(run);
setDraftCampos(deepMergeKeepRight({ ...DEFAULT_TRP_FIELDS }, draft));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao carregar TRP";
      console.error("[TrpEditPage] Erro ao carregar TRP:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!runId || !isUuid(runId)) {
      setSnackbar({ open: true, message: "ID do TRP inválido", severity: "error" });
      return;
    }

    if (runData?.status !== "COMPLETED") {
      setSnackbar({ open: true, message: "Documento ainda não concluído.", severity: "warning" });
      return;
    }

    const setDownloading = format === "pdf" ? setDownloadingPdf : setDownloadingDocx;

    try {
      setDownloading(true);
      await downloadTrpRun(runId, format);
      setSnackbar({
        open: true,
        message: `Exportando documento oficial em ${format.toUpperCase()}...`,
        severity: "success",
      });
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao baixar arquivo";
      const status = err.status;

      if (status === 401 || status === 403) {
        setSnackbar({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
        await signOut();
        navigate("/login", {
          replace: true,
          state: { message: "Sua sessão expirou. Faça login novamente." },
        });
        return;
      }

      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveNewVersion = async () => {
    if (!runId || !isUuid(runId)) {
      setSnackbar({ open: true, message: "ID inválido.", severity: "error" });
      return;
    }

    try {
      setSaving(true);

      // ✅ modo edição total: manda o draft inteiro
      // (backend decide o que validar; você quis opção A = permitir correção manual)
      const result = await reviseTrpRun({
        runId,
        revisionReason: revisionReason.trim() || null,
        camposOverride: draftCampos,
        // prazosCalculadosFinal: (draftCampos as any)?.prazos_calculados_final ?? null,
      });

      setSnackbar({
        open: true,
        message: "Nova versão do TRP gerada. Abrindo resultado...",
        severity: "success",
      });

      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err: any) {
      const status = err?.status;
      const msg = err?.message || "Erro ao salvar nova versão.";

      if (status === 401 || status === 403) {
        setSnackbar({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
        await signOut();
        navigate("/login", {
          replace: true,
          state: { message: "Sua sessão expirou. Faça login novamente." },
        });
        return;
      }

      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ✅ SummaryCards deve refletir o draft (para o usuário ver o que está alterando)
  const summaryCampos = useMemo(() => {
    // segurança: sempre retorna objeto
    return (draftCampos && typeof draftCampos === "object" ? draftCampos : {}) as any;
  }, [draftCampos]);

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

  if (!viewModel || !runData) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity="warning">Não foi possível carregar os dados do TRP.</Alert>
      </Box>
    );
  }

  const termoNome = pickTrpFileName(runData, viewModel.runId || null);

  const data: TrpAgentOutput = {
    documento_markdown: viewModel.documento_markdown,
    campos: viewModel.campos,
    meta: {
      fileName: termoNome,
      hash_tdr: viewModel.runId || "",
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
      {/* Header */}
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
              Editar TRP (nova versão)
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Você está editando o TRP gerado. Ao salvar, será criada uma nova versão com novo ID.
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

        {/* Motivo */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            bgcolor: alpha(theme.palette.grey[50], 0.5),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
            Motivo da alteração (opcional)
          </Typography>
          <TextField
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            placeholder="Ex: corrigir CNPJ, ajustar número da NF, corrigir item..."
            fullWidth
            size="small"
            disabled={saving}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Divider sx={{ my: 2, opacity: 0.5 }} />

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/agents/trp/resultado/${runId}`)}
              disabled={saving}
              sx={{ textTransform: "none", borderRadius: 999, px: 2.5, py: 1.1 }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveNewVersion}
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999, px: 2.5, py: 1.1 }}
            >
              {saving ? "Salvando..." : "Salvar nova versão"}
            </Button>

            <Tooltip title={downloadingPdf ? "Exportando..." : "Baixar PDF"}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={downloadingPdf ? <CircularProgress size={18} /> : <PdfIcon />}
                  onClick={() => handleDownload("pdf")}
                  disabled={saving || downloadingPdf || downloadingDocx}
                  sx={{ textTransform: "none", borderRadius: 999, px: 2.5, py: 1.1 }}
                >
                  PDF
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={downloadingDocx ? "Exportando..." : "Baixar Word"}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={downloadingDocx ? <CircularProgress size={18} /> : <WordIcon />}
                  onClick={() => handleDownload("docx")}
                  disabled={saving || downloadingPdf || downloadingDocx}
                  sx={{ textTransform: "none", borderRadius: 999, px: 2.5, py: 1.1 }}
                >
                  Word
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Box>

      {/* ✅ Summary Cards refletindo o DRAFT */}
      <TrpSummaryCards campos={summaryCampos} />

      {/* Main Card com Tabs */}
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
              label="Visualização do Documento (atual)"
              sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
            />
            <Tab
              label="Dados Estruturados (Editar)"
              sx={{ "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
            />
          </Tabs>
        </Box>

        {/* Tab 1: Documento atual (só muda após salvar nova versão) */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <TrpMarkdownView content={data.documento_markdown} showTitle={false} />
          </Box>
        </TabPanel>

        {/* Tab 2: Editor total */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
<TrpStructuredDataEditor
  campos={draftCampos as any}
  onChange={(next: Record<string, unknown>) => {
    // ✅ se o editor mandar só um "patch", não pode substituir tudo
    // ✅ faz merge mantendo o que já existia
    setDraftCampos((prev) => {
      const merged = deepMergeKeepRight(prev, next);

      // ✅ garante que o objeto continua tendo todas as chaves do default
      // (evita sumir campos na UI por falta de chave)
      return deepMergeKeepRight({ ...DEFAULT_TRP_FIELDS }, merged);
    });
  }}
  disabled={saving}
/>
          </Box>
        </TabPanel>
      </Paper>

      {/* Snackbar */}
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

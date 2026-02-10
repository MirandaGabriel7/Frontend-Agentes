// src/modules/trd/pages/TrdPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Stack,
  Divider,
  Tooltip,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle,
  Error as ErrorIcon,
  Sync,
  Schedule,
  ArrowForward as ArrowForwardIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  fetchTrdRuns,
  fetchTrdRunsSummary,
  downloadTrdRun,
  TrdRunListItem,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

const getStatusChip = (status: TrdRunListItem["status"]) => {
  switch (status) {
    case "COMPLETED":
      return <Chip icon={<CheckCircle />} label="Concluído" color="success" size="small" />;
    case "FAILED":
      return <Chip icon={<ErrorIcon />} label="Falhou" color="error" size="small" />;
    case "PROCESSING":
      return <Chip icon={<Sync />} label="Processando" color="info" size="small" />;
    case "PENDING":
      return <Chip icon={<Schedule />} label="Pendente" color="warning" size="small" />;
    default:
      return <Chip label={String(status)} size="small" />;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return dayjs(dateString).format("DD/MM/YYYY [às] HH:mm");
};

const getDisplayFileName = (run: TrdRunListItem) => {
  const raw = (run as any)?.fileName;
  const name = typeof raw === "string" ? raw.trim() : "";
  const fallback = `TRD_${String(run.runId || "").slice(0, 8)}.pdf`;
  return name || fallback;
};

export const TrdPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recent, setRecent] = useState<TrdRunListItem[]>([]);
  const [summary, setSummary] = useState<{
    total_runs: number;
    total_completed: number;
    total_failed: number;
    last_run_at?: string | null;
    last_completed_at?: string | null;
  } | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "error" | "success" | "warning";
  }>({ open: false, message: "" });

  const [downloading, setDownloading] = useState<Record<string, "pdf" | "docx" | null>>({});

  const goTrdHistory = useCallback(() => {
    navigate("/agents/trd/historico");
  }, [navigate]);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [s, r] = await Promise.all([
        fetchTrdRunsSummary(),
        fetchTrdRuns({ limit: 10, status: "ALL" }),
      ]);

      setSummary({
        total_runs: typeof (s as any)?.total_runs === "number" ? (s as any).total_runs : 0,
        total_completed:
          typeof (s as any)?.total_completed === "number" ? (s as any).total_completed : 0,
        total_failed: typeof (s as any)?.total_failed === "number" ? (s as any).total_failed : 0,
        last_run_at: (s as any)?.last_run_at ?? null,
        last_completed_at: (s as any)?.last_completed_at ?? null,
      });

      const items = Array.isArray(r?.items) ? r.items : [];
      setRecent(items);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados do TRD.");
      setRecent([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = useMemo(() => !loading && !error && recent.length === 0, [loading, error, recent.length]);

  const subtitle = useMemo(() => {
    const lastCompleted = summary?.last_completed_at ? dayjs(summary.last_completed_at).fromNow() : null;
    if (lastCompleted) return `Último TRD concluído ${lastCompleted}.`;
    return "Crie TRDs a partir de TRPs já gerados.";
  }, [summary?.last_completed_at]);

  const handleDownload = useCallback(
    async (run: TrdRunListItem, format: "pdf" | "docx") => {
      const runId = run?.runId;

      if (!runId) {
        setSnackbar({ open: true, message: "ID do TRD não encontrado", severity: "error" });
        return;
      }

      if (!isUuid(runId)) {
        setSnackbar({ open: true, message: "ID do TRD inválido", severity: "error" });
        return;
      }

      if (run.status !== "COMPLETED") {
        setSnackbar({
          open: true,
          message: "Documento ainda não concluído. Aguarde a finalização do processamento.",
          severity: "warning",
        });
        return;
      }

      try {
        setDownloading((prev) => ({ ...prev, [runId]: format }));
        await downloadTrdRun(runId, format);

        setSnackbar({
          open: true,
          message: `Exportando documento oficial do TRD em ${format.toUpperCase()}...`,
          severity: "success",
        });
      } catch (err: any) {
        const errorMessage = err?.message || "Erro ao baixar arquivo";
        const status = err?.status;

        if (status === 401 || status === 403) {
          setSnackbar({ open: true, message: "Sessão expirada / sem permissão", severity: "error" });
          await signOut();
          navigate("/login", {
            replace: true,
            state: { message: "Sua sessão expirou. Faça login novamente." },
          });
          return;
        }

        if (status === 404) {
          setSnackbar({ open: true, message: "Documento não encontrado", severity: "error" });
          return;
        }

        if (status === 429) {
          setSnackbar({ open: true, message: "Aguarde antes de gerar novamente", severity: "warning" });
          return;
        }

        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      } finally {
        setDownloading((prev) => ({ ...prev, [runId]: null }));
      }
    },
    [navigate, signOut],
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: "900px", md: "1000px", lg: "1100px" },
        mx: "auto",
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      {/* TÍTULO FORA (PADRÃO TRP) */}
      <Box sx={{ mb: 8, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: theme.palette.text.primary,
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              }}
            >
              Termo de Recebimento Definitivo
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "1rem",
                maxWidth: "680px",
                mx: "auto",
              }}
            >
              {subtitle}
            </Typography>

          </Box>

          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={goTrdHistory}
            sx={{ textTransform: "none", minWidth: "auto" }}
          >
            Histórico
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* COMO CRIAR TRD (SEM BOTÕES) */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(
            theme.palette.background.paper,
            0.95,
          )} 55%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Como criar um TRD (passo a passo)</Typography>
          <Typography variant="body2" color="text.secondary">
            O TRD é o termo definitivo do recebimento e depende de um TRP já gerado e concluído.
          </Typography>

          <Divider sx={{ my: 2.5 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 12 }}>1</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Gere um TRP</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Preencha os dados do recebimento, anexe os documentos e conclua a geração do TRP.
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 12 }}>2</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>No TRP, clique em “Criar TRD”</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Após concluir o TRP, o botão “Criar TRD” aparece no resultado do TRP.
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 12 }}>3</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Acompanhe os últimos 10</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Abaixo você pode abrir e exportar os 10 TRDs mais recentes (PDF/DOCX).
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2.5 }}>
            Dica: se algum TRD estiver “Processando”, aguarde e depois clique em “Atualizar lista”.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Atualizar lista
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* AÇÕES (PADRÃO) */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/agents/trp")}
              sx={{ textTransform: "none" }}
            >
              Ir para TRP
            </Button>

            <Button
              variant="text"
              startIcon={<HistoryIcon />}
              onClick={() => navigate("/agents/trp/historico")}
              sx={{ textTransform: "none" }}
            >
              Ver histórico do TRP
            </Button>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={goTrdHistory}
            sx={{ textTransform: "none" }}
          >
            Ver histórico completo do TRD
          </Button>
        </Stack>
      </Paper>

      {/* ÚLTIMOS 10 TRDs (MESMO LAYOUT/FUNÇÕES DO HISTÓRICO: PDF, DOCX, ABRIR) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 900 }}>Últimos 10 TRDs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Sempre visível nesta tela. Para ver todos, use “Histórico” no topo.
          </Typography>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Carregando...
            </Typography>
          </Box>
        ) : empty ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Nenhum TRD encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ainda não há TRDs gerados. Gere um TRP e depois crie o TRD a partir dele.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/agents/trp")}
                sx={{ textTransform: "none" }}
              >
                Ir para TRP
              </Button>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => navigate("/agents/trp/historico")}
                sx={{ textTransform: "none" }}
              >
                Ver histórico do TRP
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ p: 0 }}>
            {recent.map((run) => {
              const displayFileName = getDisplayFileName(run);

              const trpRef = (run as any)?.trp_run_id;
              const trpDate = (run as any)?.trp_created_at;
              const houveRessalvas = (run as any)?.houve_ressalvas === true;

              const isCompleted = run.status === "COMPLETED";
              const busy = downloading[run.runId];

              return (
                <Box
                  key={run.runId}
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
                        {getStatusChip(run.status)}
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(run.createdAt)}
                        </Typography>
                        {houveRessalvas ? (
                          <Chip label="Com ressalvas" size="small" color="warning" variant="outlined" />
                        ) : (
                          <Chip label="Sem ressalvas" size="small" color="success" variant="outlined" />
                        )}
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          mb: 0.75,
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                      >
                        {displayFileName}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            TRP referência
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trpRef ? String(trpRef).slice(0, 8) + "…" : "—"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Data do TRP
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trpDate ? dayjs(trpDate).format("DD/MM/YYYY") : "—"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      {isCompleted ? (
                        <>
                          <Tooltip
                            title={
                              busy === "pdf"
                                ? "Exportando documento oficial do TRD..."
                                : "Exportar documento oficial do TRD em PDF"
                            }
                          >
                            <span>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={busy === "pdf" ? <CircularProgress size={16} /> : <PdfIcon />}
                                onClick={() => handleDownload(run, "pdf")}
                                disabled={!!busy}
                                sx={{
                                  textTransform: "none",
                                  minWidth: "auto",
                                  color: theme.palette.error.main,
                                  borderColor: alpha(theme.palette.error.main, 0.5),
                                  "&:hover": {
                                    borderColor: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                  },
                                  "&:disabled": {
                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                    color: alpha(theme.palette.error.main, 0.5),
                                  },
                                }}
                              >
                                {busy === "pdf" ? "Exportando..." : "PDF"}
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={
                              busy === "docx"
                                ? "Exportando documento oficial do TRD..."
                                : "Exportar documento oficial do TRD em DOCX"
                            }
                          >
                            <span>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={busy === "docx" ? <CircularProgress size={16} /> : <WordIcon />}
                                onClick={() => handleDownload(run, "docx")}
                                disabled={!!busy}
                                sx={{
                                  textTransform: "none",
                                  minWidth: "auto",
                                  color: theme.palette.info.main,
                                  borderColor: alpha(theme.palette.info.main, 0.5),
                                  "&:hover": {
                                    borderColor: theme.palette.info.main,
                                    bgcolor: alpha(theme.palette.info.main, 0.08),
                                  },
                                  "&:disabled": {
                                    borderColor: alpha(theme.palette.info.main, 0.3),
                                    color: alpha(theme.palette.info.main, 0.5),
                                  },
                                }}
                              >
                                {busy === "docx" ? "Exportando..." : "DOCX"}
                              </Button>
                            </span>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Documento ainda não concluído">
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              disabled
                              sx={{
                                textTransform: "none",
                                minWidth: "auto",
                                color: theme.palette.text.disabled,
                                borderColor: alpha(theme.palette.divider, 0.2),
                                cursor: "not-allowed",
                              }}
                            >
                              Exportar
                            </Button>
                          </span>
                        </Tooltip>
                      )}

                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        onClick={() => navigate(`/agents/trd/resultado/${run.runId}`)}
                        sx={{ textTransform: "none" }}
                      >
                        Abrir
                      </Button>

                      <Tooltip title="Ver histórico completo do TRD">
                        <IconButton
                          size="small"
                          onClick={goTrdHistory}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
                            borderRadius: 2,
                          }}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={closeSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

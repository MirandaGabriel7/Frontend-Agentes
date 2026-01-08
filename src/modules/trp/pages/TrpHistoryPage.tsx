// src/modules/trp/pages/TrpHistoryPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Search as SearchIcon,
  CheckCircle,
  Error as ErrorIcon,
  Sync,
  Schedule,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  fetchTrpRuns,
  fetchTrpRunsSummary,
  TrpRunListItem,
  FetchTrpRunsParams,
  downloadTrpRun,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Snackbar, IconButton, Tooltip } from "@mui/material";
import { isUuid } from "../../../utils/uuid";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "FAILED", label: "Falhas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "RUNNING", label: "Em processamento" },
] as const;

const getStatusChip = (status: TrpRunListItem["status"]) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Chip
          icon={<CheckCircle />}
          label="Concluído"
          color="success"
          size="small"
        />
      );
    case "FAILED":
      return (
        <Chip icon={<ErrorIcon />} label="Falhou" color="error" size="small" />
      );
    case "RUNNING":
      return (
        <Chip icon={<Sync />} label="Processando" color="info" size="small" />
      );
    case "PENDING":
      return (
        <Chip
          icon={<Schedule />}
          label="Pendente"
          color="warning"
          size="small"
        />
      );
    default:
      return <Chip label={status} size="small" />;
  }
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format("DD/MM/YYYY [às] HH:mm");
};

/**
 * ✅ NOVO: nome amigável do TRP no histórico (prioriza fileName vindo do backend).
 * Fallback seguro: "TRP_<8 primeiros do runId>.pdf"
 */
const getDisplayFileName = (run: TrpRunListItem) => {
  const raw = (run as any)?.fileName;
  const name = typeof raw === "string" ? raw.trim() : "";
  const fallback = `TRP_${String(run.runId || "").slice(0, 8)}.pdf`;
  return name || fallback;
};

export const TrpHistoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // ✅ FIX DO ERRO: aceitar "warning" também
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "error" | "success" | "warning";
  }>({
    open: false,
    message: "",
  });

  const [downloading, setDownloading] = useState<{
    [runId: string]: "pdf" | "docx" | null;
  }>({});

  const [runs, setRuns] = useState<TrpRunListItem[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    completed: number;
    failed: number;
    lastExecution?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FetchTrpRunsParams["status"]>("ALL");
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const didFetchSummary = useRef(false);
  const lastFetchAt = useRef<number | null>(null);

  // Debounce do campo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Carregar resumo
  const loadSummary = useCallback(async () => {
    if (didFetchSummary.current) return;
    didFetchSummary.current = true;

    try {
      const data = await fetchTrpRunsSummary();
      if (data && typeof data === "object") {
        setSummary({
          total: typeof data.total === "number" ? data.total : 0,
          completed: typeof data.completed === "number" ? data.completed : 0,
          failed: typeof data.failed === "number" ? data.failed : 0,
          lastExecution: data.lastExecution || undefined,
        });
      } else {
        setSummary({ total: 0, completed: 0, failed: 0 });
      }
    } catch (err) {
      console.warn("[TrpHistoryPage] Erro ao carregar resumo:", err);
      setSummary({ total: 0, completed: 0, failed: 0 });
    }
  }, []);

  // Carregar runs
  const loadRuns = useCallback(
    async (append = false) => {
      const now = Date.now();

      // Cache de 10 segundos apenas para primeira carga
      if (
        !append &&
        lastFetchAt.current !== null &&
        now - lastFetchAt.current < 10000
      ) {
        setLoading(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params: FetchTrpRunsParams = {
          limit: 20,
          cursor: append ? nextCursor : undefined,
          status: statusFilter,
          q: debouncedQuery || undefined,
        };

        const result = await fetchTrpRuns(params);

        const items = Array.isArray(result.items) ? result.items : [];

        if (append) {
          setRuns((prev) => {
            const prevArray = Array.isArray(prev) ? prev : [];
            return [...prevArray, ...items];
          });
        } else {
          setRuns(items);
          lastFetchAt.current = Date.now();
        }

        setNextCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao carregar histórico de TRPs";
        setError(errorMessage);
        if (!append) {
          setRuns([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, statusFilter, nextCursor]
  );

  // Carregar dados iniciais
  useEffect(() => {
    loadSummary();
    loadRuns(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarregar quando filtros mudarem
  useEffect(() => {
    setNextCursor(undefined);
    setRuns([]);
    loadRuns(false);
  }, [debouncedQuery, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadRuns(true);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadSummary();
    loadRuns(false);
  };

  const handleDownload = async (runId: string, format: "pdf" | "docx") => {
    if (!runId) {
      setSnackbar({
        open: true,
        message: "ID do TRP não encontrado",
        severity: "error",
      });
      return;
    }

    if (!isUuid(runId)) {
      setSnackbar({
        open: true,
        message: "ID do TRP inválido",
        severity: "error",
      });
      return;
    }

    const runsArray = Array.isArray(runs) ? runs : [];

    const run = runsArray.find((r) => r && r.runId === runId);
    if (!run) {
      setSnackbar({
        open: true,
        message: "TRP não encontrado na lista",
        severity: "error",
      });
      return;
    }

    if (run.status !== "COMPLETED") {
      setSnackbar({
        open: true,
        message:
          "Documento ainda não concluído. Aguarde a finalização do processamento.",
        severity: "warning",
      });
      return;
    }

    try {
      setDownloading({ ...downloading, [runId]: format });

      await downloadTrpRun(runId, format);
      setSnackbar({
        open: true,
        message: `Exportando documento oficial do TRP em ${format.toUpperCase()}...`,
        severity: "success",
      });
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao baixar arquivo";
      const status = err.status;

      if (status === 401 || status === 403) {
        setSnackbar({
          open: true,
          message: "Sessão expirada / sem permissão",
          severity: "error",
        });
        await signOut();
        navigate("/login", {
          replace: true,
          state: { message: "Sua sessão expirou. Faça login novamente." },
        });
        return;
      }

      if (status === 404) {
        setSnackbar({
          open: true,
          message: "Documento não encontrado",
          severity: "error",
        });
      } else if (status === 409) {
        setSnackbar({
          open: true,
          message: "Documento ainda não finalizado",
          severity: "warning",
        });
      } else if (status === 429) {
        setSnackbar({
          open: true,
          message: "Aguarde antes de gerar novamente",
          severity: "warning",
        });
      } else {
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      }
    } finally {
      setDownloading({ ...downloading, [runId]: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <HistoryIcon
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: theme.palette.text.primary }}
            >
              Histórico de TRPs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Visualize e gerencie todos os TRPs gerados
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Resumo */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                >
                  {summary.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.1
                )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.palette.success.main }}
                >
                  {summary.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Concluídos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.error.main,
                  0.1
                )} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.palette.error.main }}
                >
                  {summary.failed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Falhas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.1
                )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: theme.palette.info.main }}
                >
                  {summary.lastExecution
                    ? formatDate(summary.lastExecution)
                    : "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Última execução
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Buscar por número de contrato ou NF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) =>
                setStatusFilter(e.target.value as FetchTrpRunsParams["status"])
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Erro */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Tentar novamente
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Lista */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: "hidden",
        }}
      >
        {loading && runs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton
                  variant="rectangular"
                  height={80}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            ))}
          </Box>
        ) : runs.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Nenhum TRP encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {debouncedQuery || statusFilter !== "ALL"
                ? "Tente ajustar os filtros de busca"
                : "Ainda não há TRPs gerados"}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 0 }}>
              {Array.isArray(runs) && runs.length > 0
                ? runs.map((run) => {
                    const displayFileName = getDisplayFileName(run);

                    return (
                      <Box
                        key={run.runId}
                        sx={{
                          p: 3,
                          borderBottom: `1px solid ${alpha(
                            theme.palette.divider,
                            0.08
                          )}`,
                          "&:last-child": {
                            borderBottom: "none",
                          },
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.02
                            ),
                          },
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
                          <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                                mb: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {getStatusChip(run.status)}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(run.createdAt)}
                              </Typography>
                            </Box>

                            {/* ✅ NOVO: Nome amigável escolhido (fileName) */}
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

                            <Box
                              sx={{
                                display: "flex",
                                gap: 3,
                                flexWrap: "wrap",
                                mt: 1,
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Contrato
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {run.numero_contrato || "Sem número"}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  NF
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {run.numero_nf || "Sem NF"}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Valor
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {run.valor_efetivo_formatado || "-"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {run.status === "COMPLETED" ? (
                              <>
                                <Tooltip
                                  title={
                                    downloading[run.runId] === "pdf"
                                      ? "Exportando documento oficial do TRP..."
                                      : "Exportar documento oficial do TRP em PDF"
                                  }
                                >
                                  <span>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={
                                        downloading[run.runId] === "pdf" ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <PdfIcon />
                                        )
                                      }
                                      onClick={() =>
                                        handleDownload(run.runId, "pdf")
                                      }
                                      disabled={!!downloading[run.runId]}
                                      sx={{
                                        textTransform: "none",
                                        minWidth: "auto",
                                        color: theme.palette.error.main,
                                        borderColor: alpha(
                                          theme.palette.error.main,
                                          0.5
                                        ),
                                        "&:hover": {
                                          borderColor: theme.palette.error.main,
                                          bgcolor: alpha(
                                            theme.palette.error.main,
                                            0.08
                                          ),
                                        },
                                        "&:disabled": {
                                          borderColor: alpha(
                                            theme.palette.error.main,
                                            0.3
                                          ),
                                          color: alpha(
                                            theme.palette.error.main,
                                            0.5
                                          ),
                                        },
                                      }}
                                    >
                                      {downloading[run.runId] === "pdf"
                                        ? "Exportando..."
                                        : "PDF"}
                                    </Button>
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    downloading[run.runId] === "docx"
                                      ? "Exportando documento oficial do TRP..."
                                      : "Exportar documento oficial do TRP em DOCX"
                                  }
                                >
                                  <span>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={
                                        downloading[run.runId] === "docx" ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <WordIcon />
                                        )
                                      }
                                      onClick={() =>
                                        handleDownload(run.runId, "docx")
                                      }
                                      disabled={!!downloading[run.runId]}
                                      sx={{
                                        textTransform: "none",
                                        minWidth: "auto",
                                        color: theme.palette.info.main,
                                        borderColor: alpha(
                                          theme.palette.info.main,
                                          0.5
                                        ),
                                        "&:hover": {
                                          borderColor: theme.palette.info.main,
                                          bgcolor: alpha(
                                            theme.palette.info.main,
                                            0.08
                                          ),
                                        },
                                        "&:disabled": {
                                          borderColor: alpha(
                                            theme.palette.info.main,
                                            0.3
                                          ),
                                          color: alpha(
                                            theme.palette.info.main,
                                            0.5
                                          ),
                                        },
                                      }}
                                    >
                                      {downloading[run.runId] === "docx"
                                        ? "Exportando..."
                                        : "DOCX"}
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
                                      borderColor: alpha(
                                        theme.palette.divider,
                                        0.2
                                      ),
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
                              onClick={() =>
                                navigate(`/agents/trp/resultado/${run.runId}`)
                              }
                              sx={{ textTransform: "none" }}
                            >
                              Abrir
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                : null}
            </Box>

            {/* Load More */}
            {hasMore && (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  startIcon={
                    loadingMore ? <CircularProgress size={16} /> : null
                  }
                >
                  {loadingMore ? "Carregando..." : "Carregar mais"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

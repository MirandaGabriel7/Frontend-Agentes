import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { ExpandMore, ContentCopy, CheckCircle, Warning, Error as ErrorIcon } from "@mui/icons-material";
import axios from "axios";

import type { DfdAnaliseResponse } from "../lib/types/dfd";
import { DfdUploadCard } from "../modules/dfd/components/DfdUploadCard";
import { DfdActionsBar } from "../modules/dfd/components/DfdActionsBar";
import type { DfdHistoryItem } from "../modules/dfd/components/DfdHistoryCard";
import { DfdHistoryCard } from "../modules/dfd/components/DfdHistoryCard";

const AGENTE_DFD_API_URL = import.meta.env.VITE_AGENTE_DFD_API_URL || "/api/dfd/analisar";
type PageState = "idle" | "fileSelected" | "loading" | "success" | "error";

function safeNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function formatPct(v: unknown): string {
  const n = safeNumber(v, NaN);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "-";
}

function semaforoColor(semaforo?: string) {
  switch (String(semaforo ?? "").toUpperCase()) {
    case "VERDE":
      return "success";
    case "LARANJA":
      return "warning";
    case "VERMELHO":
      return "error";
    default:
      return "default";
  }
}

function semaforoIcon(semaforo?: string): React.ReactElement | undefined {
  switch (String(semaforo ?? "").toUpperCase()) {
    case "VERDE":
      return <CheckCircle />;
    case "LARANJA":
      return <Warning />;
    case "VERMELHO":
      return <ErrorIcon />;
    default:
      return undefined;
  }
}

function buildHistoryItems(selectedFile: File | null, analiseResult: DfdAnaliseResponse | null): DfdHistoryItem[] {
  const items: DfdHistoryItem[] = [];

  if (analiseResult) {
    items.push({
      id: "current",
      fileName: selectedFile?.name || "DFD_Analisado.pdf",
      status: "completed",
      createdAt: new Date().toISOString(),
      semaforo: analiseResult.parecer_executivo.overview.semaforo_global,
      nivelRisco: analiseResult.parecer_executivo.overview.nivel_risco_global,
      percentualAtendimento: analiseResult.parecer_executivo.overview.percentual_atendimento_global,
      totalPendencias: analiseResult.parecer_executivo.overview.total_pendencias_relevantes,
    });
  }

  if (items.length === 0) {
    items.push(
      {
        id: "1",
        fileName: "DFD_Projeto_Final_v3.pdf",
        status: "completed",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        semaforo: "VERDE",
        nivelRisco: "BAIXO",
        percentualAtendimento: 92.5,
        totalPendencias: 3,
      },
      {
        id: "2",
        fileName: "DFD_Infraestrutura_v4.pdf",
        status: "completed",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        semaforo: "LARANJA",
        nivelRisco: "MEDIO",
        percentualAtendimento: 68.2,
        totalPendencias: 12,
      },
      {
        id: "3",
        fileName: "DFD_Sistema_Principal.pdf",
        status: "processing",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    );
  }

  return items;
}

async function copyToClipboardJson(value: unknown): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Página do Agente DFD
 */
const AgenteDFDPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analiseResult, setAnaliseResult] = useState<DfdAnaliseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState(0);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const canExecute = Boolean(selectedFile && pageState !== "loading");

  const historyItems = useMemo(() => buildHistoryItems(selectedFile, analiseResult), [selectedFile, analiseResult]);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setErrorMessage("");
    setAnaliseResult(null);
    setActiveTab(0);
    setPageState(file ? "fileSelected" : "idle");
  }, []);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setAnaliseResult(null);
    setPageState("idle");
    setErrorMessage("");
    setActiveTab(0);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage("Por favor, selecione um arquivo PDF primeiro.");
      setPageState("error");
      return;
    }

    setPageState("loading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post<DfdAnaliseResponse[]>(AGENTE_DFD_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = response.data;
      if (!Array.isArray(payload) || payload.length === 0) throw new Error("Resposta vazia do servidor");

      const result = payload[0];
      if (!result?.parecer_executivo) throw new Error("Formato de resposta inválido");

      setAnaliseResult(result);
      setPageState("success");
    } catch (error: unknown) {
      let message = "Não foi possível interpretar o resultado da análise. Revise o DFD ou tente novamente.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const apiMsg = (error.response?.data as any)?.message;
        if (status === 400 || status === 500) message = typeof apiMsg === "string" && apiMsg ? apiMsg : message;
        else if (error.message) message = `Erro na requisição: ${error.message}`;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
      setPageState("error");
    }
  }, [selectedFile]);

  const handleCopyJson = useCallback(async () => {
    if (!analiseResult?.bruto_prime) return;

    const ok = await copyToClipboardJson(analiseResult.bruto_prime);
    if (ok) setSnackbar({ open: true, message: "JSON copiado para a área de transferência!" });
    else setSnackbar({ open: true, message: "Não foi possível copiar o JSON." });
  }, [analiseResult]);

  const versaoLayout = analiseResult?.meta?.versao_layout;

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
      {/* Cabeçalho */}
      <Box sx={{ mb: 8, textAlign: "center" }}>
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
          Analisador de DFD
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "1rem",
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          Envie o DFD em PDF para que o agente aplique as regras e gere um parecer automático.
        </Typography>

        {versaoLayout ? <Chip label={`Versão ${versaoLayout}`} size="small" sx={{ mt: 2 }} /> : null}
      </Box>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {/* Upload */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5, mb: 4 }}>
        <DfdUploadCard onFileSelect={handleFileSelect} selectedFile={selectedFile} disabled={pageState === "loading"} />
      </Box>

      {/* Ações */}
      <DfdActionsBar
        onExecute={handleAnalyze}
        onReset={handleReset}
        isExecuting={pageState === "loading"}
        canExecute={canExecute}
      />

      {/* Resultados */}
      {pageState === "success" && analiseResult ? (
        <Box sx={{ mt: 6 }}>
          <ResultadosTabs analiseResult={analiseResult} activeTab={activeTab} onTabChange={setActiveTab} onCopyJson={handleCopyJson} />
        </Box>
      ) : null}

      {/* Histórico */}
      {pageState !== "loading" ? (
        <Box sx={{ mt: 6 }}>
          <DfdHistoryCard
            items={historyItems}
            onView={(id) => navigate(`/agents/dfd/resultado/${id}`)}
            onDownload={(id) => console.log("Baixar análise:", id)}
          />
        </Box>
      ) : null}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

interface ResultadosTabsProps {
  analiseResult: DfdAnaliseResponse;
  activeTab: number;
  onTabChange: (value: number) => void;
  onCopyJson: () => void;
}

const ResultadosTabs: React.FC<ResultadosTabsProps> = ({ analiseResult, activeTab, onTabChange, onCopyJson }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        overflow: "hidden",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.9375rem",
          },
        }}
      >
        <Tab label="Parecer Executivo" />
        <Tab label="Detalhamento Técnico" />
        <Tab label="JSON Bruto (debug)" />
      </Tabs>

      {activeTab === 0 ? (
        <Box sx={{ p: 5 }}>
          <ParecerExecutivoTab parecer={analiseResult.parecer_executivo} />
        </Box>
      ) : null}

      {activeTab === 1 ? (
        <Box sx={{ p: 5 }}>
          <DetalhamentoTecnicoTab detalhamento={analiseResult.detalhamento_tecnico} />
        </Box>
      ) : null}

      {activeTab === 2 ? (
        <Box sx={{ p: 5 }}>
          <JsonBrutoTab jsonData={analiseResult.bruto_prime} onCopy={onCopyJson} />
        </Box>
      ) : null}
    </Paper>
  );
};

interface ParecerExecutivoTabProps {
  parecer: DfdAnaliseResponse["parecer_executivo"];
}

const ParecerExecutivoTab: React.FC<ParecerExecutivoTabProps> = ({ parecer }) => {
  const theme = useTheme();
  const semaforo = parecer?.overview?.semaforo_global;

  return (
    <Stack spacing={4}>
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
            <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                {formatPct(parecer.overview.percentual_atendimento_global)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Atendimento Global
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                {safeNumber(parecer.overview.total_grupos_avaliados, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Grupos Avaliados
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                {safeNumber(parecer.overview.total_itens_avaliados, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Itens Avaliados
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
                {safeNumber(parecer.overview.total_pendencias_relevantes, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendências Relevantes
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip
            {...(semaforoIcon(semaforo) ? { icon: semaforoIcon(semaforo) } : {})}
            label={`Semáforo: ${String(semaforo ?? "-")}`}
            color={semaforoColor(semaforo) as "success" | "warning" | "error"}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Risco: ${String(parecer.overview.nivel_risco_global ?? "-")}`}
            color={
              parecer.overview.nivel_risco_global === "ALTO" || parecer.overview.nivel_risco_global === "CRITICO"
                ? "error"
                : "default"
            }
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.primary" }}>
          {parecer.overview.visao_rapida}
        </Typography>
      </Paper>

      {Array.isArray(parecer.recomendacoes_prioritarias) && parecer.recomendacoes_prioritarias.length > 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: "background.paper",
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
                    disableTypography
                    primary={
                      <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" component="div" sx={{ fontWeight: 600 }}>
                          {rec.ordem ? `${rec.ordem}.` : `${index + 1}.`} {rec.descricao}
                        </Typography>
                        {rec.nivel_criticidade ? (
                          <Chip
                            label={rec.nivel_criticidade}
                            size="small"
                            color={rec.nivel_criticidade === "CRITICA" || rec.nivel_criticidade === "ALTA" ? "error" : "default"}
                          />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <Box component="div" sx={{ mt: 1 }}>
                        {rec.grupo_impactado ? (
                          <Typography variant="caption" component="div" color="text.secondary">
                            Grupo impactado: {rec.grupo_impactado}
                          </Typography>
                        ) : null}
                        {rec.percentual_atendimento !== undefined ? (
                          <Typography variant="caption" component="div" color="text.secondary" sx={{ ml: 2 }}>
                            Atendimento: {safeNumber(rec.percentual_atendimento, 0).toFixed(1)}%
                          </Typography>
                        ) : null}
                      </Box>
                    }
                  />
                </ListItem>
                {index < parecer.recomendacoes_prioritarias.length - 1 ? <Divider /> : null}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : null}

      {parecer.destaques ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Destaques
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "success.main" }}>
                Pontos positivos
              </Typography>
              <List dense>
                {parecer.destaques.pontos_positivos?.map((ponto, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2" component="div" sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: "success.main", mt: 0.25, flexShrink: 0 }} />
                          {ponto}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "warning.main" }}>
                Pontos de atenção
              </Typography>
              <List dense>
                {parecer.destaques.pontos_de_atencao?.map((ponto, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2" component="div" sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <Warning sx={{ fontSize: 16, color: "warning.main", mt: 0.25, flexShrink: 0 }} />
                          {ponto}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "error.main" }}>
                Principais riscos
              </Typography>
              <List dense>
                {parecer.destaques.riscos_relevantes?.map((risco, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2" component="div" sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <ErrorIcon sx={{ fontSize: 16, color: "error.main", mt: 0.25, flexShrink: 0 }} />
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
      ) : null}

      {parecer.parecer_narrativo ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Parecer narrativo
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.primary", whiteSpace: "pre-wrap" }}>
            {parecer.parecer_narrativo}
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  );
};

interface DetalhamentoTecnicoTabProps {
  detalhamento: DfdAnaliseResponse["detalhamento_tecnico"];
}

const DetalhamentoTecnicoTab: React.FC<DetalhamentoTecnicoTabProps> = ({ detalhamento }) => {
  const theme = useTheme();

  return (
    <Stack spacing={4}>
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
          {detalhamento.score_global?.percentual_atendimento !== undefined ? (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatPct(detalhamento.score_global.percentual_atendimento)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Atendimento Global
                </Typography>
              </Box>
            </Grid>
          ) : null}

          {detalhamento.score_global?.semaforo ? (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: "center", p: 2 }}>
                <Chip
                  label={`Semáforo: ${detalhamento.score_global.semaforo}`}
                  color={semaforoColor(detalhamento.score_global.semaforo) as "success" | "warning" | "error"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          ) : null}

          {detalhamento.resumo_geral?.total_pendencias_relevantes !== undefined ? (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
                  {safeNumber(detalhamento.resumo_geral.total_pendencias_relevantes, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pendências Relevantes
                </Typography>
              </Box>
            </Grid>
          ) : null}
        </Grid>
      </Paper>

      {Array.isArray(detalhamento.grupos_detalhados) && detalhamento.grupos_detalhados.length > 0 ? (
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
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", pr: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                    {grupo.titulo_grupo}
                  </Typography>

                  {grupo.score?.semaforo ? (
                    <Chip
                      label={grupo.score.semaforo}
                      size="small"
                      color={semaforoColor(grupo.score.semaforo) as "success" | "warning" | "error"}
                    />
                  ) : null}

                  {grupo.score?.percentual_atendimento !== undefined ? (
                    <Typography variant="body2" color="text.secondary">
                      {safeNumber(grupo.score.percentual_atendimento, 0).toFixed(1)}%
                    </Typography>
                  ) : null}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Stack spacing={2}>
                  {grupo.comentario_resumo ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {grupo.comentario_resumo}
                    </Typography>
                  ) : null}

                  {grupo.total_itens !== undefined ||
                  grupo.itens_atendidos !== undefined ||
                  grupo.itens_nao_atendidos !== undefined ||
                  grupo.itens_parcialmente_atendidos !== undefined ? (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <Grid container spacing={2}>
                        {grupo.total_itens !== undefined ? (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Total de itens
                            </Typography>
                            <Typography variant="h6">{safeNumber(grupo.total_itens, 0)}</Typography>
                          </Grid>
                        ) : null}

                        {grupo.itens_atendidos !== undefined ? (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: "success.main" }}>
                              {safeNumber(grupo.itens_atendidos, 0)}
                            </Typography>
                          </Grid>
                        ) : null}

                        {grupo.itens_nao_atendidos !== undefined ? (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Não atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: "error.main" }}>
                              {safeNumber(grupo.itens_nao_atendidos, 0)}
                            </Typography>
                          </Grid>
                        ) : null}

                        {grupo.itens_parcialmente_atendidos !== undefined ? (
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Parcialmente atendidos
                            </Typography>
                            <Typography variant="h6" sx={{ color: "warning.main" }}>
                              {safeNumber(grupo.itens_parcialmente_atendidos, 0)}
                            </Typography>
                          </Grid>
                        ) : null}
                      </Grid>
                    </Box>
                  ) : null}

                  {Array.isArray(grupo.regras) && grupo.regras.length > 0 ? (
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
                              <TableCell>{regra.codigo || "-"}</TableCell>
                              <TableCell>{regra.tipo_elemento || "-"}</TableCell>
                              <TableCell>{regra.status || "-"}</TableCell>
                              <TableCell>
                                {regra.nivel_criticidade ? (
                                  <Chip
                                    label={regra.nivel_criticidade}
                                    size="small"
                                    color={
                                      regra.nivel_criticidade === "CRITICA" || regra.nivel_criticidade === "ALTA"
                                        ? "error"
                                        : "default"
                                    }
                                  />
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : null}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : null}
    </Stack>
  );
};

interface JsonBrutoTabProps {
  jsonData: Record<string, unknown>;
  onCopy: () => void;
}

const JsonBrutoTab: React.FC<JsonBrutoTabProps> = ({ jsonData, onCopy }) => {
  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          JSON Bruto (debug)
        </Typography>

        <Button variant="outlined" startIcon={<ContentCopy />} onClick={onCopy} size="small" sx={{ textTransform: "none" }}>
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
          overflow: "auto",
          maxHeight: "70vh",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: "monospace",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <code>{JSON.stringify(jsonData, null, 2)}</code>
        </pre>
      </Paper>
    </Box>
  );
};

export default AgenteDFDPage;
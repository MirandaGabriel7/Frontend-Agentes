/**
 * src/features/pipeline/PipelineStatusPanel.tsx
 *
 * Painel visual de progresso do pipeline interno.
 * Exibe os steps em sequência com status, duração e erro.
 *
 * Uso:
 *   <PipelineStatusPanel
 *     status={status}
 *     steps={steps}
 *     elapsedMs={elapsedMs}
 *     errorMessage={errorMessage}
 *   />
 */

import React, { useMemo } from "react";
import {
  Alert,
  alpha,
  Box,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  SkipNext as SkipIcon,
} from "@mui/icons-material";
import type { PipelineJobStatus, PipelineStepState } from "./hooks/usePipelineStatus";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface PipelineStatusPanelProps {
  status: PipelineJobStatus | null;
  steps: PipelineStepState[];
  elapsedMs: number;
  errorMessage?: string | null;
  /** Mensagem exibida enquanto aguarda o primeiro step (default genérico) */
  waitingMessage?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<string, string> = {
  validate: "Validação",
  normalize: "Normalização",
  calculateDeadlines: "Cálculo de prazos",
  buildContext: "Construção de contexto",
  generateMarkdown: "Geração do documento",
  formatOutput: "Formatação final",
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
}

// ---------------------------------------------------------------------------
// StepRow
// ---------------------------------------------------------------------------

interface StepRowProps {
  step: PipelineStepState;
  isLast: boolean;
}

const StepRow: React.FC<StepRowProps> = ({ step, isLast }) => {
  const theme = useTheme();
  const label = STEP_LABELS[step.stepName] ?? step.stepName;

  const icon = useMemo(() => {
    switch (step.status) {
      case "completed":
        return <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
      case "failed":
        return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />;
      case "running":
        return <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />;
      case "skipped":
        return <SkipIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />;
      default:
        return <PendingIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />;
    }
  }, [step.status, theme]);

  const rowBg = useMemo(() => {
    switch (step.status) {
      case "completed": return alpha(theme.palette.success.main, 0.04);
      case "failed":    return alpha(theme.palette.error.main, 0.05);
      case "running":   return alpha(theme.palette.primary.main, 0.05);
      default:          return "transparent";
    }
  }, [step.status, theme]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: rowBg,
          transition: "background-color 0.3s ease",
        }}
      >
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", width: 22 }}>
          {icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: step.status === "running" ? 800 : 600,
              color: step.status === "pending" || step.status === "skipped"
                ? theme.palette.text.disabled
                : theme.palette.text.primary,
            }}
          >
            {label}
            {step.attempt > 1 && (
              <Box component="span" sx={{ ml: 1, fontSize: "0.75rem", color: theme.palette.warning.main }}>
                (tentativa {step.attempt})
              </Box>
            )}
          </Typography>

          {step.status === "failed" && step.error && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.25 }}>
              {step.error}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexShrink: 0, textAlign: "right" }}>
          {step.durationMs !== null && step.durationMs !== undefined ? (
            <Tooltip title={`Duração: ${formatMs(step.durationMs)}`}>
              <Typography variant="caption" color="text.secondary">
                {formatMs(step.durationMs)}
              </Typography>
            </Tooltip>
          ) : step.status === "running" ? (
            <Typography variant="caption" color="primary">
              Processando...
            </Typography>
          ) : null}
        </Box>
      </Box>

      {/* Linha conectora entre steps */}
      {!isLast && (
        <Box
          sx={{
            ml: 3.5,
            width: 1,
            height: 8,
            bgcolor: alpha(theme.palette.divider, 0.3),
          }}
        />
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export const PipelineStatusPanel: React.FC<PipelineStatusPanelProps> = ({
  status,
  steps,
  elapsedMs,
  errorMessage,
  waitingMessage = "Iniciando processamento...",
}) => {
  const theme = useTheme();

  // Progresso: quantos steps concluídos / total
  const totalSteps = steps.length || 6; // 6 steps é o padrão TRP/TRD
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const isTerminal = status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";
  const hasSteps = steps.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
        maxWidth: 520,
        mx: "auto",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {status === "COMPLETED" ? (
            <CheckIcon sx={{ color: theme.palette.success.main }} />
          ) : status === "FAILED" ? (
            <ErrorIcon sx={{ color: theme.palette.error.main }} />
          ) : (
            <CircularProgress size={20} />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {status === "COMPLETED" && "Documento gerado!"}
            {status === "FAILED" && "Falha na geração"}
            {(status === "PENDING" || status === "PROCESSING" || status === null) && "Gerando documento..."}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
          {formatElapsed(elapsedMs)}
        </Typography>
      </Box>

      {/* Barra de progresso */}
      {!isTerminal && (
        <Box sx={{ mb: 2.5 }}>
          <LinearProgress
            variant={hasSteps ? "determinate" : "indeterminate"}
            value={progressPercent}
            sx={{ borderRadius: 2, height: 6 }}
          />
          {hasSteps && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {completedSteps} de {totalSteps} etapas concluídas
            </Typography>
          )}
        </Box>
      )}

      {/* Steps */}
      {hasSteps ? (
        <Stack spacing={0}>
          {[...steps]
            .sort((a, b) => a.order - b.order)
            .map((step, idx, arr) => (
              <StepRow
                key={`${step.stepName}-${step.attempt}`}
                step={step}
                isLast={idx === arr.length - 1}
              />
            ))}
        </Stack>
      ) : (
        !isTerminal && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1 }}>
            {waitingMessage}
          </Typography>
        )
      )}

      {/* Erro */}
      {status === "FAILED" && errorMessage && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </Paper>
  );
};

export default PipelineStatusPanel;
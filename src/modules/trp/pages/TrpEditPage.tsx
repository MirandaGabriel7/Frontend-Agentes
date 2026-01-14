// src/modules/trp/pages/TrpEditPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Snackbar,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  TextField,
} from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";

import { TrpFormCard } from "../components/TrpFormCard";

import { isUuid } from "../../../utils/uuid";
import {
  fetchTrpRun,
  reviseTrpRun,
  TrpRunData,
  GenerateTrpParams,
} from "../../../services/api";

import { TrpInputForm, TrpItemObjeto } from "../../../lib/types/trp";

// Helpers locais (mantém iguais ao TrpPage)
function parseMoneyBR(raw?: string): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "," || trimmed === ".") return null;

  const cleaned = trimmed.replace(/[^\d.,]/g, "");
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ").replace(/\s{2,}/g, " ").trim();
  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity?: "error" | "success" | "warning" | "info";
};

// tenta achar campos editáveis vindos do run
function pickEditableSource(run: TrpRunData): Record<string, any> {
  // prioridade: contexto_recebimento_raw (o que o fiscal preencheu)
  if (
    run.contexto_recebimento_raw &&
    typeof run.contexto_recebimento_raw === "object"
  ) {
    return run.contexto_recebimento_raw as any;
  }
  // fallback: campos_trp_normalizados (já é o final)
  if (
    run.campos_trp_normalizados &&
    typeof run.campos_trp_normalizados === "object"
  ) {
    return run.campos_trp_normalizados as any;
  }
  return {};
}

export const TrpEditPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: runId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [runOriginal, setRunOriginal] = useState<TrpRunData | null>(null);
  const [revisionReason, setRevisionReason] = useState<string>("");

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const EMPTY_ITEM: TrpItemObjeto = useMemo(
    () => ({
      descricao: "",
      unidade_medida: "",
      quantidade_recebida: undefined as any,
      valor_unitario: "",
      valor_total_calculado: undefined,
    }),
    []
  );

  const [form, setForm] = useState<TrpInputForm>(
    {
      tipo_contratacao: undefined,
      competencia_mes_ano: undefined,

      tipo_base_prazo: undefined,
      data_recebimento: undefined,
      data_conclusao_servico: undefined,

      data_prevista_entrega_contrato: undefined,
      data_entrega_real: undefined,

      condicao_prazo: undefined,
      motivo_atraso: undefined,

      condicao_quantidade_ordem: undefined,
      comentarios_quantidade_ordem: undefined,

      itens_objeto: [EMPTY_ITEM as any],
      valor_total_geral: 0 as any,

      observacoes_recebimento: undefined,

      fiscal_contrato_nome: undefined,
      data_assinatura: undefined,
      area_demandante_nome: undefined,

      fileName: "",
    } as any
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const ensureItens = useCallback((): TrpItemObjeto[] => {
    const itens = Array.isArray((form as any).itens_objeto)
      ? ((form as any).itens_objeto as TrpItemObjeto[])
      : [];
    return itens.length > 0 ? itens : [EMPTY_ITEM];
  }, [form, EMPTY_ITEM]);

  const isValidNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

  // Carrega TRP original e preenche form
  useEffect(() => {
    const run = async () => {
      if (!runId) {
        setErrorMessage("ID do TRP não fornecido na URL");
        setLoading(false);
        return;
      }

      if (!isUuid(runId)) {
        setErrorMessage("ID do TRP inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);

        const trp = await fetchTrpRun(runId);
        setRunOriginal(trp);

        const src = pickEditableSource(trp);

        const mapped: any = {
          fileName: String(src.fileName ?? trp.fileName ?? "").trim(),

          tipo_contratacao:
            src.tipoContratacao ?? src.tipo_contratacao ?? undefined,

          competencia_mes_ano:
            src.competenciaMesAno ?? src.competencia_mes_ano ?? undefined,

          tipo_base_prazo:
            src.tipoBasePrazo ?? src.tipo_base_prazo ?? undefined,
          data_recebimento:
            src.dataRecebimento ?? src.data_recebimento ?? undefined,
          data_conclusao_servico:
            src.dataConclusaoServico ?? src.data_conclusao_servico ?? undefined,
          data_prevista_entrega_contrato:
            src.dataPrevistaEntregaContrato ??
            src.data_prevista_entrega_contrato ??
            undefined,
          data_entrega_real:
            src.dataEntregaReal ?? src.data_entrega_real ?? undefined,

          condicao_prazo: src.condicaoPrazo ?? src.condicao_prazo ?? undefined,
          motivo_atraso: src.motivoAtraso ?? src.motivo_atraso ?? undefined,

          condicao_quantidade_ordem:
            src.condicaoQuantidadeOrdem ??
            src.condicao_quantidade_ordem ??
            undefined,
          comentarios_quantidade_ordem:
            src.comentariosQuantidadeOrdem ??
            src.comentarios_quantidade_ordem ??
            undefined,

          observacoes_recebimento:
            src.observacoesRecebimento ??
            src.observacoes_recebimento ??
            undefined,

          itens_objeto: Array.isArray(src.itens_objeto)
            ? src.itens_objeto.map((it: any) => ({
                descricao: String(it.descricao ?? ""),
                unidade_medida: String(it.unidade_medida ?? ""),
                quantidade_recebida:
                  typeof it.quantidade_recebida === "number"
                    ? it.quantidade_recebida
                    : Number(it.quantidade_recebida) || undefined,
                valor_unitario: String(
                  it.valor_unitario_raw ?? it.valor_unitario ?? ""
                ),
                valor_total_calculado:
                  typeof it.valor_total_calculado === "number"
                    ? it.valor_total_calculado
                    : undefined,
              }))
            : [EMPTY_ITEM],

          valor_total_geral:
            typeof src.valor_total_geral === "number" ? src.valor_total_geral : 0,
        };

        setForm((prev: any) => ({ ...prev, ...mapped }));
      } catch (err: any) {
        const msg = err?.message || "Erro ao carregar TRP para edição.";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // validação (sem arquivos)
  const validateForm = useCallback((): string | null => {
    const safeName = sanitizeFileName((form as any).fileName);
    if (!safeName) return 'O campo "Nome" é obrigatório.';

    if (!form.tipo_contratacao)
      return 'O campo "Tipo de contrato" é obrigatório.';

    if (form.tipo_contratacao === "SERVIÇOS" && !form.competencia_mes_ano) {
      return 'O campo "Mês/Ano de competência" é obrigatório quando o tipo de contrato é SERVIÇOS.';
    }

    if (
      form.competencia_mes_ano &&
      !/^\d{2}\/\d{4}$/.test(form.competencia_mes_ano)
    ) {
      return 'O campo "Mês/Ano de competência" deve estar no formato MM/AAAA (ex: 12/2025).';
    }

    if (!form.tipo_base_prazo)
      return 'O campo "Base para contagem de Prazo" é obrigatório.';

    if (form.tipo_base_prazo === "DATA_RECEBIMENTO" && !form.data_recebimento) {
      return 'O campo "Data de Recebimento" é obrigatório quando a base de prazo é DATA_RECEBIMENTO.';
    }

    if (form.tipo_base_prazo === "SERVICO" && !form.data_conclusao_servico) {
      return 'O campo "Data de Conclusão do Serviço" é obrigatório quando a base de prazo é SERVICO.';
    }

    if (!form.condicao_prazo)
      return 'O campo "Condição quanto ao prazo" é obrigatório.';

    if (form.condicao_prazo === "FORA_DO_PRAZO" && !form.motivo_atraso) {
      return 'O campo "Motivo do atraso" é obrigatório quando a condição de prazo é FORA_DO_PRAZO.';
    }

    if (!form.condicao_quantidade_ordem) {
      return 'O campo "Quantidade conforme Ordem de Fornecimento" é obrigatório.';
    }

    if (
      form.condicao_quantidade_ordem === "PARCIAL" &&
      !form.comentarios_quantidade_ordem
    ) {
      return 'O campo "Comentários sobre divergência/pendências" é obrigatório quando a quantidade conforme Ordem de Fornecimento é PARCIAL.';
    }

    const itens = ensureItens();
    if (!Array.isArray(itens) || itens.length === 0) {
      return "É necessário informar pelo menos 1 item entregue ou serviço prestado.";
    }

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      const idx = i + 1;

      if (!item.descricao || String(item.descricao).trim() === "") {
        return `O campo "Descrição do item" é obrigatório no Item ${idx}.`;
      }

      if (!item.unidade_medida || String(item.unidade_medida).trim() === "") {
        return `O campo "Unidade de medida" é obrigatório no Item ${idx}.`;
      }

      const qtd = (item as any).quantidade_recebida;
      if (!isValidNumber(qtd) || qtd <= 0) {
        return `O campo "Quantidade recebida" é obrigatório e deve ser maior que 0 no Item ${idx}.`;
      }

      const vuNum = parseMoneyBR(String((item as any).valor_unitario ?? ""));
      if (vuNum === null || !Number.isFinite(vuNum) || vuNum < 0) {
        return `O campo "Valor unitário" é obrigatório e deve ser um valor válido (>= 0) no Item ${idx}.`;
      }
    }

    return null;
  }, [form, ensureItens]);

  const canSave = useMemo(() => validateForm() === null, [validateForm]);

  const handleSave = useCallback(async () => {
    if (!runId) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSnackbar({ open: true, message: validationError, severity: "error" });
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const itens = ensureItens();

      const itens_objeto: GenerateTrpParams["dadosRecebimento"]["itens_objeto"] =
        itens.map((item) => {
          const quantidade = Number((item as any).quantidade_recebida ?? 0);

          const valor_unitario_raw = String(
            (item as any).valor_unitario ?? ""
          ).trim();
          const valor_unitario_num = parseMoneyBR(valor_unitario_raw) ?? 0;

          const valor_total_calculado = Number(
            (quantidade * valor_unitario_num).toFixed(2)
          );

          return {
            descricao: String((item as any).descricao || "").trim(),
            unidade_medida: String((item as any).unidade_medida || "").trim(),
            quantidade_recebida: quantidade,
            valor_unitario_raw,
            valor_unitario_num,
            valor_total_calculado,
          };
        });

      const valor_total_geral = Number(
        itens_objeto
          .reduce((acc, it) => acc + (it.valor_total_calculado || 0), 0)
          .toFixed(2)
      );

      const fileName = sanitizeFileName((form as any).fileName);

      const dadosRecebimento: GenerateTrpParams["dadosRecebimento"] = {
        tipoContratacao: form.tipo_contratacao!,
        tipoBasePrazo: form.tipo_base_prazo!,
        condicaoPrazo: form.condicao_prazo!,
        condicaoQuantidadeOrdem: form.condicao_quantidade_ordem!,

        fileName: fileName || null,

        competenciaMesAno: form.competencia_mes_ano || null,
        dataRecebimento: form.data_recebimento || null,
        dataConclusaoServico: form.data_conclusao_servico || null,
        dataPrevistaEntregaContrato: form.data_prevista_entrega_contrato || null,
        dataEntregaReal: form.data_entrega_real || null,
        motivoAtraso: form.motivo_atraso || null,
        comentariosQuantidadeOrdem: form.comentarios_quantidade_ordem || null,
        observacoesRecebimento: form.observacoes_recebimento || null,

        itens_objeto,
        valor_total_geral,
      };

      // ✅ FIX: reviseTrpRun recebe 1 único argumento (objeto)
      const result = await reviseTrpRun({
        runId,
        dadosRecebimento,
        revisionReason: revisionReason.trim() || null,
      });

      setSnackbar({
        open: true,
        message: "Nova versão do TRP gerada. Abrindo resultado...",
        severity: "success",
      });

      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err: any) {
      const msg = err?.message || "Erro ao salvar nova versão.";
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  }, [runId, validateForm, ensureItens, form, revisionReason, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2 }}>
        <Alert severity="error">{errorMessage}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none" }}
          >
            Voltar
          </Button>
        </Box>
      </Box>
    );
  }

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
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            flexWrap: "wrap",
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
              Editar dados do TRP
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
              Você poderá ajustar apenas os campos do TRP. Ao salvar, será criada
              uma nova versão com novo ID.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => navigate("/agents/trp/historico")}
            sx={{ textTransform: "none", minWidth: "auto" }}
          >
            Histórico
          </Button>
        </Box>
      </Box>

      {/* Info do TRP original */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          mb: 4,
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}
        >
          TRP original
        </Typography>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          ID:{" "}
          <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            {runId}
          </span>
        </Typography>

        {runOriginal?.fileName ? (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
          >
            Nome:{" "}
            <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              {runOriginal.fileName}
            </span>
          </Typography>
        ) : null}

        <Divider sx={{ my: 2, opacity: 0.5 }} />

        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          Motivo da alteração (opcional)
        </Typography>

        <TextField
          value={revisionReason}
          onChange={(e) => setRevisionReason(e.target.value)}
          placeholder="Ex: Corrigir número da NF no campo ou ajustar valores do item"
          fullWidth
          size="small"
          disabled={saving}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Paper>

      {/* Form editável (sem upload) */}
      <TrpFormCard value={form} onChange={setForm} disabled={saving} />

      {/* Ações */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate(`/agents/trp/resultado/${runId}`)}
          disabled={saving}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 2.5,
            py: 1.25,
          }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave || saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : undefined
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 999,
            px: 2.5,
            py: 1.25,
          }}
        >
          {saving ? "Salvando..." : "Salvar nova versão"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity || "success"}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

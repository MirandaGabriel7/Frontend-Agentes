import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  useTheme,
  Button,
  Snackbar,
  Paper,
  TextField,
  Divider,
  alpha,
} from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";

import { TrpUploadCard } from "../components/TrpUploadCard";
import { TrpFormCard } from "../components/TrpFormCard";
import { TrpActionsBar } from "../components/TrpActionsBar";

import { TrpInputForm, TrpItemObjeto } from "../../../lib/types/trp";
import { generateTrp, GenerateTrpParams } from "../../../services/api";

type SnackbarState = {
  open: boolean;
  message: string;
  severity?: "error" | "success" | "warning" | "info";
};

function parseMoneyBR(raw?: string): number | null {
  if (raw === undefined || raw === null) return null;

  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "," || trimmed === ".") return null;

  const cleaned = trimmed.replace(/[^\d.,]/g, "");

  // pt-BR: "1.234,56" -> 1234.56
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  // fallback: "1234.56"
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();
  if (!s) return null;

  // remove quebras e normaliza espaços
  s = s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();

  // remove caracteres problemáticos
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ").replace(/\s{2,}/g, " ").trim();

  // limite simples
  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Arquivos
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] =
    useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] =
    useState<File | null>(null);

  const EMPTY_ITEM: TrpItemObjeto = useMemo(
    () => ({
      descricao: "",
      unidade_medida: "",
      quantidade_recebida: undefined as any, // mantenho compatível com seu type atual
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
      data_inicio_servico: undefined,
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

      // (assinaturas – se ainda estiver no type, deixa)
      fiscal_contrato_nome: undefined,
      data_assinatura: undefined,
      area_demandante_nome: undefined,

      fileName: "",
    } as any
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const validateForm = useCallback((): string | null => {
    if (!fichaContratualizacaoFile && !notaFiscalFile && !ordemFornecimentoFile) {
      return "É necessário enviar pelo menos um arquivo (Ficha de Contratualização, Nota Fiscal ou Ordem de Fornecimento).";
    }

    const safeName = sanitizeFileName(form.fileName);
    if (!safeName) return 'O campo "Nome" é obrigatório.';

    if (!form.tipo_contratacao) return 'O campo "Tipo de contrato" é obrigatório.';

    if (form.tipo_contratacao === "SERVIÇOS" && !form.competencia_mes_ano) {
      return 'O campo "Mês/Ano de competência" é obrigatório quando o tipo de contrato é SERVIÇOS.';
    }

    if (form.competencia_mes_ano && !/^\d{2}\/\d{4}$/.test(form.competencia_mes_ano)) {
      return 'O campo "Mês/Ano de competência" deve estar no formato MM/AAAA (ex: 12/2025).';
    }

    if (!form.tipo_base_prazo) {
      return 'O campo "Base para contagem de Prazo" é obrigatório.';
    }

if (form.tipo_base_prazo === "DATA_RECEBIMENTO" && !form.data_recebimento) {
  return 'O campo "Data de Recebimento" é obrigatório quando a base de prazo é DATA_RECEBIMENTO.';
}

if (form.tipo_base_prazo === "INICIO_SERVICO" && !form.data_inicio_servico) {
  return 'O campo "Data de Início do Serviço" é obrigatório quando a base de prazo é INICIO_SERVICO.';
}

if (form.tipo_base_prazo === "SERVICO" && !form.data_conclusao_servico) {
  return 'O campo "Data de Conclusão do Serviço" é obrigatório quando a base de prazo é SERVICO.';
}


    if (!form.condicao_prazo) {
      return 'O campo "Condição quanto ao prazo" é obrigatório.';
    }

    if (form.condicao_prazo === "FORA_DO_PRAZO" && !form.motivo_atraso) {
      return 'O campo "Motivo do atraso" é obrigatório quando a condição de prazo é FORA_DO_PRAZO.';
    }

    if (!form.condicao_quantidade_ordem) {
      return 'O campo "Quantidade conforme Ordem de Fornecimento" é obrigatório.';
    }

    if (form.condicao_quantidade_ordem === "PARCIAL" && !form.comentarios_quantidade_ordem) {
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
  }, [
    fichaContratualizacaoFile,
    notaFiscalFile,
    ordemFornecimentoFile,
    form,
    ensureItens,
  ]);

  const canExecute = useMemo(() => {
    const hasAnyFile = Boolean(
      fichaContratualizacaoFile || notaFiscalFile || ordemFornecimentoFile
    );
    if (!hasAnyFile) return false;
    return validateForm() === null;
  }, [fichaContratualizacaoFile, notaFiscalFile, ordemFornecimentoFile, validateForm]);

  const handleGenerateTrp = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const validationError = validateForm();
      if (validationError) {
        setErrorMessage(validationError);
        setSnackbar({ open: true, message: validationError, severity: "error" });
        return;
      }

      const itens = ensureItens();

      const itens_objeto: GenerateTrpParams["dadosRecebimento"]["itens_objeto"] =
        itens.map((item) => {
          const quantidade = Number((item as any).quantidade_recebida ?? 0);

          const valor_unitario_raw = String((item as any).valor_unitario ?? "").trim();
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

      const fileName = sanitizeFileName(form.fileName);

      const dadosRecebimento: GenerateTrpParams["dadosRecebimento"] = {
        tipoContratacao: form.tipo_contratacao!,
        tipoBasePrazo: form.tipo_base_prazo!,
        condicaoPrazo: form.condicao_prazo!,
        condicaoQuantidadeOrdem: form.condicao_quantidade_ordem!,

        fileName: fileName || null,

        competenciaMesAno: form.competencia_mes_ano || null,
        dataRecebimento: form.data_recebimento || null,
        dataInicioServico: form.data_inicio_servico || null,
        dataConclusaoServico: form.data_conclusao_servico || null,
        dataPrevistaEntregaContrato: form.data_prevista_entrega_contrato || null,
        dataEntregaReal: form.data_entrega_real || null,
        motivoAtraso: form.motivo_atraso || null,
        comentariosQuantidadeOrdem: form.comentarios_quantidade_ordem || null,
        observacoesRecebimento: form.observacoes_recebimento || null,

        itens_objeto,
        valor_total_geral,
      };

      const result = await generateTrp({
        dadosRecebimento,
        files: {
          fichaContratualizacao: fichaContratualizacaoFile,
          notaFiscal: notaFiscalFile,
          ordemFornecimento: ordemFornecimentoFile,
        },
      });

      setSnackbar({
        open: true,
        message: "TRP gerado com sucesso. Abrindo resultado...",
        severity: "success",
      });

      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err: any) {
      console.error("Erro ao gerar TRP:", err);
      const msg = err?.message || "Erro inesperado ao gerar o TRP.";
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [
    validateForm,
    ensureItens,
    form,
    fichaContratualizacaoFile,
    notaFiscalFile,
    ordemFornecimentoFile,
    navigate,
  ]);

  const handleReset = useCallback((): void => {
    setFichaContratualizacaoFile(null);
    setNotaFiscalFile(null);
    setOrdemFornecimentoFile(null);

    setForm(
      {
        tipo_contratacao: undefined,
        competencia_mes_ano: undefined,

        tipo_base_prazo: undefined,
        data_recebimento: undefined,
        data_inicio_servico: undefined,
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

    setErrorMessage(null);
    setSnackbar({ open: false, message: "", severity: "success" });
  }, [EMPTY_ITEM]);

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
              Novo Termo de Recebimento Provisório
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
              Preencha os dados abaixo para gerar um novo TRP com assistência da nossa IA.
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

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5, mb: 4 }}>
        {/* 0) Nome do termo */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: "0.95rem",
              }}
            >
              Nome do Termo de Recebimento
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: "0.825rem",
                lineHeight: 1.5,
                maxWidth: 780,
              }}
            >
              Esse nome será usado para identificar o arquivo gerado (ex: “TRP – Planco AI”).
            </Typography>

            <TextField
              value={form.fileName || ""}
              onChange={(e) => {
                const cleaned = (e.target.value || "").replace(/\r?\n/g, " ").slice(0, 120);
                setForm((prev: any) => ({ ...prev, fileName: cleaned }));
              }}
              fullWidth
              variant="outlined"
              placeholder="Ex: TRP – Planco AI"
              disabled={isLoading}
              InputLabelProps={{ shrink: false }}
              label=""
              inputProps={{ maxLength: 120 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "background.paper",
                  "& fieldset": {
                    borderColor: alpha(theme.palette.text.primary, 0.25),
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                    borderWidth: "1px",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                    borderWidth: "2px",
                    boxShadow: (t: any) =>
                      `0 0 0 2px ${alpha(t.palette.primary.main, 0.12)}`,
                  },
                },
                "& .MuiInputBase-input": {
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  paddingTop: "14px",
                  paddingBottom: "14px",
                  fontSize: "0.9375rem",
                  color: theme.palette.text.primary,
                },
                "& .MuiInputBase-input::placeholder": {
                  color: alpha(theme.palette.text.secondary, 0.65),
                  opacity: 1,
                  fontSize: "0.9375rem",
                },
              }}
            />

            <Divider sx={{ mt: 2, opacity: 0.5 }} />
          </Box>
        </Paper>

        {/* 1) Upload */}
        <TrpUploadCard
          fichaContratualizacaoFile={fichaContratualizacaoFile}
          notaFiscalFile={notaFiscalFile}
          ordemFornecimentoFile={ordemFornecimentoFile}
          onFichaContratualizacaoChange={setFichaContratualizacaoFile}
          onNotaFiscalChange={setNotaFiscalFile}
          onOrdemFornecimentoChange={setOrdemFornecimentoFile}
          disabled={isLoading}
        />

        {/* 2) Form */}
        <TrpFormCard value={form} onChange={setForm} disabled={isLoading} />
      </Box>

      <TrpActionsBar
        onExecute={handleGenerateTrp}
        onReset={handleReset}
        isExecuting={isLoading}
        canExecute={canExecute}
      />

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

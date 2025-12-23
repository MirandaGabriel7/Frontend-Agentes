import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  useTheme,
  Button,
  Snackbar,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { TrpUploadCard } from "../components/TrpUploadCard";
import { TrpFormCard } from "../components/TrpFormCard";
import { TrpActionsBar } from "../components/TrpActionsBar";
import { TrpHistoryCard, TrpHistoryItem } from "../components/TrpHistoryCard";
import { TrpInputForm, TrpItemObjeto } from "../../../lib/types/trp";
import {
  generateTrp,
  listTrpRuns,
  downloadTrpRun,
  GenerateTrpParams,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { isUuid } from "../../../utils/uuid";

function parseMoneyBR(raw?: string): number | null {
  if (raw === undefined || raw === null) return null;

  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "," || trimmed === ".") return null;

  const cleaned = trimmed.replace(/[^\d.,]/g, "");

  // pt-BR: "1.234,56"
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "error" | "success" | "warning";
  }>({ open: false, message: "" });

  // Arquivos
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] =
    useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] =
    useState<File | null>(null);

  const EMPTY_ITEM: TrpItemObjeto = {
    descricao: "",
    unidade_medida: "",
    quantidade_recebida: 0 as any, // ou undefined se você preferir no state
    valor_unitario: "",
    valor_total_calculado: undefined,
  };

  // ✅ Form (novo fluxo com itens_objeto)
  const [form, setForm] = useState<TrpInputForm>({
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

    // ✅ NOVO
    itens_objeto: [EMPTY_ITEM as any],

    // opcional
    valor_total_geral: 0 as any,

    observacoes_recebimento: undefined,

    // (assinaturas – se ainda estiver no type, deixa)
    fiscal_contrato_nome: undefined,
    data_assinatura: undefined,
    area_demandante_nome: undefined,

    arquivoTdrNome: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

  const ensureItens = (): TrpItemObjeto[] => {
    const itens = Array.isArray((form as any).itens_objeto)
      ? ((form as any).itens_objeto as TrpItemObjeto[])
      : [];
    return itens.length > 0 ? itens : [EMPTY_ITEM];
  };

  const validateForm = (): string | null => {
    if (
      !fichaContratualizacaoFile &&
      !notaFiscalFile &&
      !ordemFornecimentoFile
    ) {
      return "É necessário enviar pelo menos um arquivo (Ficha de Contratualização, Nota Fiscal ou Ordem de Fornecimento).";
    }

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

    // ✅ itens (novo oficial)
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

      if (
        !isValidNumber(item.quantidade_recebida) ||
        item.quantidade_recebida <= 0
      ) {
        return `O campo "Quantidade recebida" é obrigatório e deve ser maior que 0 no Item ${idx}.`;
      }

      const vuNum = parseMoneyBR(String(item.valor_unitario ?? ""));
      if (vuNum === null || !Number.isFinite(vuNum) || vuNum < 0) {
        return `O campo "Valor unitário" é obrigatório e deve ser um valor válido (>= 0) no Item ${idx}.`;
      }
    }

    return null;
  };

  const canExecute = Boolean(
    (fichaContratualizacaoFile || notaFiscalFile || ordemFornecimentoFile) &&
      validateForm() === null
  );

  const handleGenerateTrp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const validationError = validateForm();
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      const itens = ensureItens();

      // ✅ shape 100% compatível com GenerateTrpParams (payload oficial)
      const itens_objeto: GenerateTrpParams["dadosRecebimento"]["itens_objeto"] =
        itens.map((item) => {
          const quantidade = Number(item.quantidade_recebida ?? 0);

          const valor_unitario_raw = String(item.valor_unitario ?? "").trim();
          const valor_unitario_num = parseMoneyBR(valor_unitario_raw) ?? 0;

          const valor_total_calculado = Number(
            (quantidade * valor_unitario_num).toFixed(2)
          );

          return {
            descricao: String(item.descricao || "").trim(),
            unidade_medida: String(item.unidade_medida || "").trim(),
            quantidade_recebida: quantidade,

            // ✅ oficiais
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

      // ✅ payload tipado (sem any)
      const dadosRecebimento: GenerateTrpParams["dadosRecebimento"] = {
        tipoContratacao: form.tipo_contratacao!,
        tipoBasePrazo: form.tipo_base_prazo!,
        condicaoPrazo: form.condicao_prazo!,
        condicaoQuantidadeOrdem: form.condicao_quantidade_ordem!,

        competenciaMesAno: form.competencia_mes_ano || null,
        dataRecebimento: form.data_recebimento || null,
        dataConclusaoServico: form.data_conclusao_servico || null,
        dataPrevistaEntregaContrato:
          form.data_prevista_entrega_contrato || null,
        dataEntregaReal: form.data_entrega_real || null,
        motivoAtraso: form.motivo_atraso || null,
        comentariosQuantidadeOrdem: form.comentarios_quantidade_ordem || null,
        observacoesRecebimento: form.observacoes_recebimento || null,

        // ✅ NOVO OFICIAL
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

      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err: any) {
      console.error("Erro ao gerar TRP:", err);
      setErrorMessage(err?.message || "Erro inesperado ao gerar o TRP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFichaContratualizacaoFile(null);
    setNotaFiscalFile(null);
    setOrdemFornecimentoFile(null);

    setForm({
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

      arquivoTdrNome: "",
    });

    setErrorMessage(null);
  };

  // Histórico
  const [historyItems, setHistoryItems] = useState<TrpHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const didFetchHistory = React.useRef(false);

  React.useEffect(() => {
    if (didFetchHistory.current) return;
    didFetchHistory.current = true;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const runs = await listTrpRuns(20);
        const runsArray = Array.isArray(runs) ? runs : [];

        const items: TrpHistoryItem[] = runsArray
          .filter((run) => run && run.status === "COMPLETED")
          .map((run) => ({
            id: run.runId,
            fileName: `TRP_${run.runId.substring(0, 8)}.pdf`,
            contractNumber: run.numero_contrato || undefined,
            invoiceNumber: run.numero_nf || undefined,
            status: "completed" as const,
            createdAt: run.createdAt,
            totalValue: run.valor_efetivo_numero || undefined,
          }));

        setHistoryItems(items);
      } catch (err) {
        console.warn("[TrpPage] Erro ao carregar histórico:", err);
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

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

    try {
      await downloadTrpRun(runId, format);
      setSnackbar({
        open: true,
        message: `Exportando TRP em ${format.toUpperCase()}...`,
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
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

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
              Preencha os dados abaixo para gerar um novo TRP com assistência da
              nossa IA.
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
        <TrpUploadCard
          fichaContratualizacaoFile={fichaContratualizacaoFile}
          notaFiscalFile={notaFiscalFile}
          ordemFornecimentoFile={ordemFornecimentoFile}
          onFichaContratualizacaoChange={setFichaContratualizacaoFile}
          onNotaFiscalChange={setNotaFiscalFile}
          onOrdemFornecimentoChange={setOrdemFornecimentoFile}
          disabled={isLoading}
        />

        <TrpFormCard
          value={form}
          onChange={(next) => setForm(() => next)}
          disabled={isLoading}
        />
      </Box>

      <TrpActionsBar
        onExecute={handleGenerateTrp}
        onReset={handleReset}
        isExecuting={isLoading}
        canExecute={canExecute}
      />

      {!isLoading && !historyLoading && historyItems.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <TrpHistoryCard
            items={historyItems}
            onView={(id) => navigate(`/agents/trp/resultado/${id}`)}
            onDownloadPdf={(id) => handleDownload(id, "pdf")}
            onDownloadDocx={(id) => handleDownload(id, "docx")}
          />
        </Box>
      )}

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

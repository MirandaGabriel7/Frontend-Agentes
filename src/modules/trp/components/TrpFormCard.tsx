// src/modules/trp/components/TrpFormCard.tsx

import React from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  alpha,
  useTheme,
  Select,
  FormControl,
  Divider,
  InputAdornment,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import {
  TrpInputForm,
  TrpCondicaoPrazo,
  TrpCondicaoQuantidade,
  TrpTipoBasePrazo,
  TrpTipoContrato,
} from "../../../lib/types/trp";

dayjs.locale("pt-br");

interface TrpFormCardProps {
  value: TrpInputForm;
  onChange: (next: TrpInputForm) => void;
  disabled?: boolean;
}

// Função para formatar valores de select para exibição
const formatSelectValue = (value: string): string => {
  const formatMap: Record<string, string> = {
    BENS: "Bens",
    SERVIÇOS: "Serviços",
    OBRA: "Obra",

    DATA_RECEBIMENTO: "Data de Recebimento",
    INICIO_SERVICO: "Início do Serviço",
    SERVICO: "Conclusão do Serviço",

    NO_PRAZO: "No Prazo",
    FORA_DO_PRAZO: "Fora do Prazo",
    TOTAL: "Total",
    PARCIAL: "Parcial",
  };
  return formatMap[value] || value;
};

// Labels mais simples (curtos) para o fiscal
const FIELD_LABELS = {
  tipo_contratacao: "Qual é o tipo de contrato?",
  itens_objeto: "Quais foram os itens entregues ou serviços prestados?",
  competencia_mes_ano: "Qual é o mês/ano de competência?",
  tipo_base_prazo: "Qual é a base do prazo?",
  data_recebimento: "Qual é a data de recebimento?",
  data_inicio_servico: "Qual é a data de início do serviço?",
  data_conclusao_servico: "Qual é a data de conclusão do serviço?",
  condicao_prazo: "Foi entregue/prestado no prazo?",
  data_prevista_entrega_contrato: "Qual era a data prevista (contrato)?",
  data_entrega_real: "Qual foi a data real da entrega/serviço?",
  motivo_atraso:
    "Qual foi o motivo do atraso? Você entrou em contato com o fornecedor para saber o motivo?",
  condicao_quantidade_ordem:
    "A quantidade confere com a Ordem de Fornecimento?",
  comentarios_quantidade_ordem: "Explique a divergência/pendência",
  observacoes_recebimento: "Deseja registrar observações?",
} as const;

// ✅ Tipo local do item no FORM (valor_unitario como string para permitir digitação pt-BR)
type TrpItemObjetoForm = {
  descricao: string;
  unidade_medida: string;
  quantidade_recebida?: number;
  valor_unitario?: string; // string digitada (ex: "12,50")
  valor_total_calculado?: number; // calculado no front
};

function clampDecimals(value: string, maxDecimals: number): string {
  if (!value) return value;
  const [intPart, decPart] = value.split(".");
  if (!decPart) return value;
  return `${intPart}.${decPart.slice(0, maxDecimals)}`;
}

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return String(value);
  }
}

function parseMoneyBR(raw?: string): number | null {
  if (raw === undefined || raw === null) return null;

  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "," || trimmed === ".") return null;

  const cleaned = trimmed.replace(/[^\d.,]/g, "");

  // Se tem vírgula, vírgula é decimal e pontos são milhar
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  // Sem vírgula: ponto como decimal
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export const TrpFormCard: React.FC<TrpFormCardProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const updateField = (field: keyof TrpInputForm) => (newValue: unknown) => {
    onChange({ ...value, [field]: newValue } as TrpInputForm);
  };

  const formatDateToDDMMYYYY = (date: Dayjs | null): string => {
    if (!date) return "";
    return date.format("DD/MM/YYYY");
  };

  const parseDateFromDDMMYYYY = (dateStr: string | undefined): Dayjs | null => {
    if (!dateStr) return null;
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return dayjs(`${year}-${month}-${day}`);
    }
    return dayjs(dateStr);
  };

  const handleTipoContratacaoChange = (newValue: TrpTipoContrato) => {
    const updates: Partial<TrpInputForm> = { tipo_contratacao: newValue };
    if (newValue !== "SERVIÇOS") {
      updates.competencia_mes_ano = undefined;
    }
    onChange({ ...value, ...updates } as TrpInputForm);
  };

  // ✅ Atualizado para suportar INICIO_SERVICO
  const handleTipoBasePrazoChange = (newValue: TrpTipoBasePrazo) => {
    const updates: Partial<TrpInputForm> = { tipo_base_prazo: newValue };

    if (newValue === "DATA_RECEBIMENTO") {
      updates.data_inicio_servico = undefined;
      updates.data_conclusao_servico = undefined;
    } else if (newValue === "INICIO_SERVICO") {
      updates.data_recebimento = undefined;
      updates.data_conclusao_servico = undefined;
    } else if (newValue === "SERVICO") {
      updates.data_recebimento = undefined;
      updates.data_inicio_servico = undefined;
    }

    onChange({ ...value, ...updates } as TrpInputForm);
  };

  const handleCondicaoPrazoChange = (newValue: TrpCondicaoPrazo) => {
    const updates: Partial<TrpInputForm> = { condicao_prazo: newValue };
    if (newValue !== "FORA_DO_PRAZO") {
      updates.motivo_atraso = undefined;
      updates.data_prevista_entrega_contrato = undefined;
      updates.data_entrega_real = undefined;
    }
    onChange({ ...value, ...updates } as TrpInputForm);
  };

  const handleCondicaoQuantidadeOrdemChange = (
    newValue: TrpCondicaoQuantidade
  ) => {
    const updates: Partial<TrpInputForm> = {
      condicao_quantidade_ordem: newValue,
    };
    if (newValue === "TOTAL") {
      updates.comentarios_quantidade_ordem = undefined;
    }
    onChange({ ...value, ...updates } as TrpInputForm);
  };

  const showCompetenciaField = value.tipo_contratacao === "SERVIÇOS";
  const showDataRecebimento = value.tipo_base_prazo === "DATA_RECEBIMENTO";
  const showDataInicioServico = value.tipo_base_prazo === "INICIO_SERVICO";
  const showDataConclusaoServico = value.tipo_base_prazo === "SERVICO";
  const showAtrasoFields = value.condicao_prazo === "FORA_DO_PRAZO";
  const showPendenciasOrdem = value.condicao_quantidade_ordem === "PARCIAL";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "background.paper",
      fontSize: "0.9375rem",
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
        boxShadow: (theme: any) =>
          `0 0 0 2px ${alpha(theme.palette.primary.main, 0.12)}`,
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
  };

  const selectSx = {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.palette.text.primary, 0.25),
      borderWidth: "1px",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: "1px",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
      boxShadow: (theme: any) =>
        `0 0 0 2px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "background.paper",
      fontSize: "0.9375rem",
    },
    "& .MuiSelect-select": {
      paddingLeft: "16px",
      paddingRight: "16px",
      paddingTop: "14px",
      paddingBottom: "14px",
      fontSize: "0.9375rem",
      color: theme.palette.text.primary,
    },
  };

  // ============================
  // ✅ ITENS (sempre 1 item vazio)
  // ============================
  const EMPTY_ITEM: TrpItemObjetoForm = {
    descricao: "",
    unidade_medida: "",
    quantidade_recebida: undefined,
    valor_unitario: "",
    valor_total_calculado: undefined,
  };

  const itens: TrpItemObjetoForm[] =
    Array.isArray((value as any).itens_objeto) &&
    (value as any).itens_objeto.length > 0
      ? ((value as any).itens_objeto as TrpItemObjetoForm[])
      : [EMPTY_ITEM];

  // ✅ garante que sempre exista ao menos 1 item, sem loop infinito
  React.useEffect(() => {
    const curr = (value as any).itens_objeto;
    if (!Array.isArray(curr) || curr.length === 0) {
      onChange({
        ...(value as any),
        itens_objeto: [EMPTY_ITEM],
      } as TrpInputForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(value as any).itens_objeto?.length]);

  const computeTotalGeral = (items: TrpItemObjetoForm[]) =>
    Number(
      items
        .reduce(
          (acc, it) =>
            acc +
            (typeof it.valor_total_calculado === "number"
              ? it.valor_total_calculado
              : 0),
          0
        )
        .toFixed(2)
    );

  const updateItem = (idx: number, patch: Partial<TrpItemObjetoForm>) => {
    const next = itens.map((it, i) => {
      if (i !== idx) return it;

      const merged: TrpItemObjetoForm = { ...it, ...patch };

      const q =
        merged.quantidade_recebida === undefined ||
        merged.quantidade_recebida === null
          ? null
          : Number(merged.quantidade_recebida);

      const vu = parseMoneyBR(merged.valor_unitario);

      merged.valor_total_calculado =
        q !== null && Number.isFinite(q) && vu !== null && Number.isFinite(vu)
          ? Number((q * vu).toFixed(2))
          : undefined;

      return merged;
    });

    const totalGeral = computeTotalGeral(next);

    onChange({
      ...(value as any),
      itens_objeto: next,
      // ✅ mantém o total geral também no form (fonte única)
      valor_total_geral: totalGeral,
    } as TrpInputForm);
  };

  const addItem = () => {
    const next = [...itens, { ...EMPTY_ITEM }];
    const totalGeral = computeTotalGeral(next);
    onChange({
      ...(value as any),
      itens_objeto: next,
      valor_total_geral: totalGeral,
    } as TrpInputForm);
  };

  const removeItem = (idx: number) => {
    if (itens.length === 1) {
      onChange({
        ...(value as any),
        itens_objeto: [{ ...EMPTY_ITEM }],
        valor_total_geral: 0,
      } as TrpInputForm);
      return;
    }
    const next = itens.filter((_, i) => i !== idx);
    const totalGeral = computeTotalGeral(next);
    onChange({
      ...(value as any),
      itens_objeto: next,
      valor_total_geral: totalGeral,
    } as TrpInputForm);
  };

  const totalGeral = computeTotalGeral(itens);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: `0 4px 16px ${alpha("#000", 0.06)}`,
        },
      }}
    >
      {/* ✅ Cabeçalho da seção (sem duplicar, sem Typography aninhado) */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: "1.125rem",
            letterSpacing: "0.01em",
            lineHeight: 1.4,
            mb: 0.75,
          }}
        >
          2. Informações do Recebimento
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: alpha(theme.palette.text.secondary, 0.8),
            fontSize: "0.875rem",
            lineHeight: 1.55,
            maxWidth: 760,
          }}
        >
          Preencha as informações do recebimento. Os totais serão calculados
          automaticamente.
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* SEÇÃO 1: Tipo de Contrato e Competência */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                mb: 1,
                fontSize: "0.9375rem",
                color: theme.palette.text.primary,
                lineHeight: 1.5,
              }}
            >
              {FIELD_LABELS.tipo_contratacao}
            </Typography>
            <FormControl fullWidth variant="outlined" required>
              <Select
                value={value.tipo_contratacao || ""}
                onChange={(e) =>
                  handleTipoContratacaoChange(e.target.value as TrpTipoContrato)
                }
                disabled={disabled}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Box sx={{ color: "text.secondary", opacity: 0.7 }}>
                        Selecione o tipo de contrato
                      </Box>
                    );
                  }
                  return formatSelectValue(selected);
                }}
                sx={selectSx}
              >
                <MenuItem value="BENS">Bens</MenuItem>
                <MenuItem value="SERVIÇOS">Serviços</MenuItem>
                <MenuItem value="OBRA">Obra</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {showCompetenciaField && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  mb: 0.5,
                  fontSize: "1rem",
                  color: theme.palette.text.primary,
                }}
              >
                {FIELD_LABELS.competencia_mes_ano}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1.5,
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  color: alpha(theme.palette.text.secondary, 0.8),
                }}
              >
                Informe o mês e ano da prestação do serviço
              </Typography>

              <TextField
                value={value.competencia_mes_ano || ""}
                onChange={(e) => {
                  let input = e.target.value.replace(/\D/g, "");

                  if (input.length > 6) input = input.slice(0, 6);

                  if (input.length <= 2) {
                    updateField("competencia_mes_ano")(input);
                    return;
                  }

                  const mm = input.slice(0, 2);
                  const yyyy = input.slice(2);
                  const mes = Number(mm);

                  if (mes < 1 || mes > 12) return;

                  updateField("competencia_mes_ano")(`${mm}/${yyyy}`);
                }}
                fullWidth
                variant="outlined"
                placeholder="Ex: 12/2025"
                required
                disabled={disabled}
                InputLabelProps={{ shrink: false }}
                label=""
                sx={inputSx}
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* ✅ ITENS DO OBJETO (1 ou mais) */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              mb: 0.5,
              fontSize: "0.9375rem",
              color: theme.palette.text.primary,
              lineHeight: 1.5,
            }}
          >
            {FIELD_LABELS.itens_objeto}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 1,
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: alpha(theme.palette.text.secondary, 0.8),
            }}
          >
            Adicione 1 ou mais itens. Para cada item, informe a descrição,
            unidade, quantidade e valor unitário. O total do item e o total
            geral serão calculados automaticamente.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {itens.map((item, idx) => {
              const totalItem =
                typeof item.valor_total_calculado === "number"
                  ? item.valor_total_calculado
                  : null;

              return (
                <Box
                  key={idx}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.16)}`,
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: theme.palette.text.primary }}
                    >
                      Item {idx + 1}
                    </Typography>

                    <Button
                      variant="text"
                      onClick={() => removeItem(idx)}
                      disabled={disabled}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: alpha(theme.palette.error.main, 0.9),
                      }}
                    >
                      Remover
                    </Button>
                  </Box>

                  {/* Descrição */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontSize: "0.9375rem" }}
                    >
                      Descrição do item
                    </Typography>
                    <TextField
                      value={item.descricao || ""}
                      onChange={(e) =>
                        updateItem(idx, { descricao: e.target.value })
                      }
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      placeholder="Ex: Moto 160cc / Capacete / Serviço de manutenção / etc."
                      disabled={disabled}
                      InputLabelProps={{ shrink: false }}
                      label=""
                      sx={{
                        ...inputSx,
                        "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
                          padding: "16px",
                        },
                      }}
                    />
                  </Box>

                  {/* Unidade + Quantidade */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 3,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: "0.9375rem" }}
                      >
                        Unidade de medida
                      </Typography>
                      <TextField
                        value={item.unidade_medida || ""}
                        onChange={(e) =>
                          updateItem(idx, { unidade_medida: e.target.value })
                        }
                        fullWidth
                        variant="outlined"
                        placeholder="Ex: UN / CX / FR / H / KM"
                        disabled={disabled}
                        InputLabelProps={{ shrink: false }}
                        label=""
                        sx={inputSx}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: "0.9375rem" }}
                      >
                        Quantidade recebida
                      </Typography>
                      <TextField
                        value={item.quantidade_recebida ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = raw
                            .replace(/[^\d.,]/g, "")
                            .replace(",", ".");
                          const safe = clampDecimals(cleaned, 3);
                          const n = safe ? Number(safe) : null;
                          updateItem(idx, {
                            quantidade_recebida:
                              n === null || !isFinite(n) ? undefined : n,
                          });
                        }}
                        fullWidth
                        variant="outlined"
                        placeholder="Ex: 10"
                        disabled={disabled}
                        InputLabelProps={{ shrink: false }}
                        label=""
                        inputProps={{ inputMode: "decimal" }}
                        sx={inputSx}
                      />
                    </Box>
                  </Box>

                  {/* Valor Unitário + Total */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 3,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: "0.9375rem" }}
                      >
                        Valor unitário
                      </Typography>

                      <TextField
                        value={item.valor_unitario ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const next = raw.replace(/[^\d.,]/g, "");
                          updateItem(idx, { valor_unitario: next });
                        }}
                        fullWidth
                        variant="outlined"
                        placeholder="Ex: 12,50"
                        disabled={disabled}
                        InputLabelProps={{ shrink: false }}
                        label=""
                        inputProps={{ inputMode: "decimal" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                        sx={inputSx}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: "0.9375rem" }}
                      >
                        Valor total (calculado)
                      </Typography>
                      <TextField
                        value={totalItem !== null ? formatBRL(totalItem) : ""}
                        fullWidth
                        variant="outlined"
                        placeholder="Preencha quantidade e valor unitário"
                        disabled={disabled}
                        InputProps={{ readOnly: true }}
                        InputLabelProps={{ shrink: false }}
                        label=""
                        sx={inputSx}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="contained"
                onClick={addItem}
                disabled={disabled}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Adicionar item
              </Button>

              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="body2"
                  sx={{ color: alpha(theme.palette.text.secondary, 0.8) }}
                >
                  Total geral
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={800}
                  sx={{ color: theme.palette.text.primary }}
                >
                  {formatBRL(totalGeral)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* SEÇÃO 2: Base para Contagem de Prazo e Datas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                mb: 1,
                fontSize: "0.9375rem",
                color: theme.palette.text.primary,
                lineHeight: 1.5,
              }}
            >
              {FIELD_LABELS.tipo_base_prazo}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 1.5,
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: alpha(theme.palette.text.secondary, 0.8),
              }}
            >
              Selecione a partir de qual data o prazo será contado
            </Typography>
            <FormControl fullWidth variant="outlined" required>
              <Select
                value={value.tipo_base_prazo || ""}
                onChange={(e) =>
                  handleTipoBasePrazoChange(e.target.value as TrpTipoBasePrazo)
                }
                disabled={disabled}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Box sx={{ color: "text.secondary", opacity: 0.7 }}>
                        Selecione a base de contagem
                      </Box>
                    );
                  }
                  return formatSelectValue(selected);
                }}
                sx={selectSx}
              >
                <MenuItem value="DATA_RECEBIMENTO">
                  Data de Recebimento — Prazo contado a partir da data de
                  recebimento dos itens
                </MenuItem>

                {/* ✅ NOVO (antes da conclusão) */}
                <MenuItem value="INICIO_SERVICO">
                  Início do Serviço — Prazo contado a partir do início do
                  serviço
                </MenuItem>

                <MenuItem value="SERVICO">
                  Conclusão do Serviço — Prazo contado a partir da conclusão do
                  serviço
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {showDataRecebimento && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  mb: 1,
                  fontSize: "0.9375rem",
                  color: theme.palette.text.primary,
                  lineHeight: 1.5,
                }}
              >
                {FIELD_LABELS.data_recebimento}
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <DatePicker
                  value={parseDateFromDDMMYYYY(value.data_recebimento)}
                  onChange={(newValue: Dayjs | null) => {
                    updateField("data_recebimento")(
                      formatDateToDDMMYYYY(newValue)
                    );
                  }}
                  disabled={disabled}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      placeholder: "Selecione a data",
                      required: true,
                      InputLabelProps: { shrink: false },
                      label: "",
                      sx: inputSx,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
          )}

          {/* ✅ NOVO DatePicker: início do serviço */}
          {showDataInicioServico && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  mb: 1,
                  fontSize: "0.9375rem",
                  color: theme.palette.text.primary,
                  lineHeight: 1.5,
                }}
              >
                {FIELD_LABELS.data_inicio_servico}
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <DatePicker
                  value={parseDateFromDDMMYYYY(value.data_inicio_servico)}
                  onChange={(newValue: Dayjs | null) => {
                    updateField("data_inicio_servico")(
                      formatDateToDDMMYYYY(newValue)
                    );
                  }}
                  disabled={disabled}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      placeholder: "Selecione a data",
                      required: true,
                      InputLabelProps: { shrink: false },
                      label: "",
                      sx: inputSx,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
          )}

          {showDataConclusaoServico && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  mb: 1,
                  fontSize: "0.9375rem",
                  color: theme.palette.text.primary,
                  lineHeight: 1.5,
                }}
              >
                {FIELD_LABELS.data_conclusao_servico}
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <DatePicker
                  value={parseDateFromDDMMYYYY(value.data_conclusao_servico)}
                  onChange={(newValue: Dayjs | null) => {
                    updateField("data_conclusao_servico")(
                      formatDateToDDMMYYYY(newValue)
                    );
                  }}
                  disabled={disabled}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      placeholder: "Selecione a data",
                      required: true,
                      InputLabelProps: { shrink: false },
                      label: "",
                      sx: inputSx,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* SEÇÃO 3: Condição de Prazo */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                mb: 1,
                fontSize: "0.9375rem",
                color: theme.palette.text.primary,
                lineHeight: 1.5,
              }}
            >
              {FIELD_LABELS.condicao_prazo}
            </Typography>
            <FormControl fullWidth variant="outlined" required>
              <Select
                value={value.condicao_prazo || ""}
                onChange={(e) =>
                  handleCondicaoPrazoChange(e.target.value as TrpCondicaoPrazo)
                }
                disabled={disabled}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Box sx={{ color: "text.secondary", opacity: 0.7 }}>
                        Selecione a condição do prazo
                      </Box>
                    );
                  }
                  return formatSelectValue(selected);
                }}
                sx={selectSx}
              >
                <MenuItem value="NO_PRAZO">No Prazo</MenuItem>
                <MenuItem value="FORA_DO_PRAZO">Fora do Prazo</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {showAtrasoFields && (
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.04),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                transition: "all 0.2s ease",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 3,
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ mb: 1, fontSize: "0.9375rem" }}
                    >
                      {FIELD_LABELS.data_prevista_entrega_contrato}
                    </Typography>
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="pt-br"
                    >
                      <DatePicker
                        value={parseDateFromDDMMYYYY(
                          value.data_prevista_entrega_contrato
                        )}
                        onChange={(newValue: Dayjs | null) => {
                          updateField("data_prevista_entrega_contrato")(
                            formatDateToDDMMYYYY(newValue)
                          );
                        }}
                        disabled={disabled}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            placeholder: "Selecione a data",
                            InputLabelProps: { shrink: false },
                            label: "",
                            sx: inputSx,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ mb: 1, fontSize: "0.9375rem" }}
                    >
                      {FIELD_LABELS.data_entrega_real}
                    </Typography>
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="pt-br"
                    >
                      <DatePicker
                        value={parseDateFromDDMMYYYY(value.data_entrega_real)}
                        onChange={(newValue: Dayjs | null) => {
                          updateField("data_entrega_real")(
                            formatDateToDDMMYYYY(newValue)
                          );
                        }}
                        disabled={disabled}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            placeholder: "Selecione a data",
                            InputLabelProps: { shrink: false },
                            label: "",
                            sx: inputSx,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ mb: 1, fontSize: "0.9375rem" }}
                  >
                    {FIELD_LABELS.motivo_atraso}
                  </Typography>
                  <TextField
                    value={value.motivo_atraso || ""}
                    onChange={(e) =>
                      updateField("motivo_atraso")(e.target.value)
                    }
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Descreva o motivo do atraso na entrega"
                    required
                    disabled={disabled}
                    InputLabelProps={{ shrink: false }}
                    label=""
                    sx={{
                      ...inputSx,
                      "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
                        padding: "16px",
                        fontSize: "0.9375rem",
                        lineHeight: 1.6,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* SEÇÃO 4: Condições de Quantidade (SÓ ORDEM - NF REMOVIDA) */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                mb: 1,
                fontSize: "0.9375rem",
                color: theme.palette.text.primary,
                lineHeight: 1.5,
              }}
            >
              {FIELD_LABELS.condicao_quantidade_ordem}
            </Typography>
            <FormControl fullWidth variant="outlined" required>
              <Select
                value={value.condicao_quantidade_ordem || ""}
                onChange={(e) =>
                  handleCondicaoQuantidadeOrdemChange(
                    e.target.value as TrpCondicaoQuantidade
                  )
                }
                disabled={disabled}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Box sx={{ color: "text.secondary", opacity: 0.7 }}>
                        Selecione a condição da quantidade
                      </Box>
                    );
                  }
                  return formatSelectValue(selected);
                }}
                sx={selectSx}
              >
                <MenuItem value="TOTAL">Total</MenuItem>
                <MenuItem value="PARCIAL">Parcial</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {showPendenciasOrdem && (
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.04),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                transition: "all 0.2s ease",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    mb: 2.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.06),
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{
                      color: theme.palette.info.main,
                      fontSize: 20,
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: "0.8125rem",
                      lineHeight: 1.6,
                    }}
                  >
                    Descreva detalhadamente a divergência entre a quantidade
                    prevista na Ordem de Fornecimento e a quantidade efetivamente
                    recebida, incluindo informações sobre pendências ou remessas
                    futuras, se aplicável.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ mb: 1, fontSize: "0.9375rem" }}
                  >
                    {FIELD_LABELS.comentarios_quantidade_ordem}
                  </Typography>
                  <TextField
                    value={value.comentarios_quantidade_ordem || ""}
                    onChange={(e) =>
                      updateField("comentarios_quantidade_ordem")(e.target.value)
                    }
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Descreva a divergência entre a quantidade prevista na Ordem de Fornecimento e a quantidade efetivamente recebida"
                    required
                    disabled={disabled}
                    InputLabelProps={{ shrink: false }}
                    label=""
                    sx={{
                      ...inputSx,
                      "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
                        padding: "16px",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* SEÇÃO 5: Observações */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              mb: 1,
              fontSize: "0.9375rem",
              color: theme.palette.text.primary,
              lineHeight: 1.5,
            }}
          >
            {FIELD_LABELS.observacoes_recebimento}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 1.5,
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: alpha(theme.palette.text.secondary, 0.8),
            }}
          >
            Adicione observações relevantes sobre o recebimento (opcional)
          </Typography>
          <TextField
            value={value.observacoes_recebimento || ""}
            onChange={(e) =>
              updateField("observacoes_recebimento")(e.target.value)
            }
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Descreva observações relevantes sobre o recebimento"
            disabled={disabled}
            InputLabelProps={{ shrink: false }}
            label=""
            sx={{
              ...inputSx,
              "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
                padding: "16px",
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

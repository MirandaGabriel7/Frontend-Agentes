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
  objeto_fornecido: "Quais foram os objetos entregues ou serviços prestados?",
  unidade_medida: "Qual é a unidade de medida?",
  quantidade_recebida: "Qual foi a quantidade recebida?",
  valor_unitario: "Qual é o valor unitário?",
  valor_total_calculado: "Valor total calculado (quantidade × valor unitário)",
  competencia_mes_ano: "Qual é o mês/ano de competência?",
  tipo_base_prazo: "Qual é a base do prazo?",
  data_recebimento: "Qual é a data de recebimento?",
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

function clampDecimals(value: string, maxDecimals: number): string {
  if (!value) return value;
  const [intPart, decPart] = value.split(".");
  if (!decPart) return value;
  return `${intPart}.${decPart.slice(0, maxDecimals)}`;
}

function parseMoneyToNumber(raw: string): number | null {
  if (!raw) return null;
  // aceita "1.234,56" e "1234.56"
  const cleaned = raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!isFinite(n)) return null;
  return n;
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

export const TrpFormCard: React.FC<TrpFormCardProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const updateField = (field: keyof TrpInputForm) => (newValue: unknown) => {
    onChange({ ...value, [field]: newValue });
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
    onChange({ ...value, ...updates });
  };

  const handleTipoBasePrazoChange = (newValue: TrpTipoBasePrazo) => {
    const updates: Partial<TrpInputForm> = { tipo_base_prazo: newValue };
    if (newValue === "DATA_RECEBIMENTO") {
      updates.data_conclusao_servico = undefined;
    } else if (newValue === "SERVICO") {
      updates.data_recebimento = undefined;
    }
    onChange({ ...value, ...updates });
  };

  const handleCondicaoPrazoChange = (newValue: TrpCondicaoPrazo) => {
    const updates: Partial<TrpInputForm> = { condicao_prazo: newValue };
    if (newValue !== "FORA_DO_PRAZO") {
      updates.motivo_atraso = undefined;
      updates.data_prevista_entrega_contrato = undefined;
      updates.data_entrega_real = undefined;
    }
    onChange({ ...value, ...updates });
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
    onChange({ ...value, ...updates });
  };

  const showCompetenciaField = value.tipo_contratacao === "SERVIÇOS";
  const showDataRecebimento = value.tipo_base_prazo === "DATA_RECEBIMENTO";
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

  // Cálculo do total (somente para exibição / salvar no form)
  const quantidadeNumber =
    value.quantidade_recebida === null ||
    value.quantidade_recebida === undefined
      ? null
      : Number(value.quantidade_recebida);

  const valorUnitarioNumber =
    typeof value.valor_unitario === "number" ? value.valor_unitario : null;

  const totalCalculado =
    quantidadeNumber !== null &&
    isFinite(quantidadeNumber) &&
    quantidadeNumber > 0 &&
    valorUnitarioNumber !== null &&
    isFinite(valorUnitarioNumber) &&
    valorUnitarioNumber >= 0
      ? quantidadeNumber * valorUnitarioNumber
      : null;

  // Sempre que quantidade/valor unitário mudar, refletir no form.valor_total_calculado
  // (Mantém uma “fonte única” para enviar ao backend sem recalcular em outro lugar)
  React.useEffect(() => {
    const nextTotal = totalCalculado ?? undefined;

    if (
      nextTotal !== value.valor_total_calculado &&
      !(Number.isNaN(nextTotal) && Number.isNaN(value.valor_total_calculado))
    ) {
      onChange({ ...value, valor_total_calculado: nextTotal });
    }
  }, [totalCalculado]);

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
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 4,
          color: theme.palette.text.primary,
          fontSize: "1.125rem",
          letterSpacing: "0.01em",
          lineHeight: 1.4,
        }}
      >
        2. Informações do Recebimento
      </Typography>

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

                  if (input.length > 6) {
                    input = input.slice(0, 6);
                  }

                  if (input.length <= 2) {
                    updateField("competencia_mes_ano")(input);
                    return;
                  }

                  const mm = input.slice(0, 2);
                  const yyyy = input.slice(2);
                  const mes = Number(mm);

                  if (mes < 1 || mes > 12) {
                    return;
                  }

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

        {/* OBJETO FORNECIDO / PRESTADO */}
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
            {FIELD_LABELS.objeto_fornecido}
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
            Descreva qual foi o fornecimento ou serviço prestado referente a
            este recebimento
          </Typography>

          <TextField
            value={value.objeto_fornecido || ""}
            onChange={(e) => updateField("objeto_fornecido")(e.target.value)}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder="Ex: Fornecimento de medicamentos / Prestação de serviço de manutenção / etc."
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

        {/* NOVO BLOCO: QUANTIDADE / UNIDADE / VALOR */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Divider sx={{ my: 0.5 }} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            {/* Unidade de Medida */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
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
                {FIELD_LABELS.unidade_medida}
              </Typography>

              <TextField
                value={value.unidade_medida || ""}
                onChange={(e) => updateField("unidade_medida")(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Ex: unidade / caixa / frasco / kg / litro / hora"
                disabled={disabled}
                InputLabelProps={{ shrink: false }}
                label=""
                sx={inputSx}
              />
            </Box>

            {/* Quantidade Recebida */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
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
                {FIELD_LABELS.quantidade_recebida}
              </Typography>

              <TextField
                value={value.quantidade_recebida ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
                  const safe = clampDecimals(cleaned, 3); // se quiser 0 decimais, mude pra 0 e trate
                  updateField("quantidade_recebida")(
                    safe ? Number(safe) : undefined
                  );
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

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            {/* Valor Unitário */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
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
                {FIELD_LABELS.valor_unitario}
              </Typography>

              <TextField
                value={value.valor_unitario ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;

                  // permitir vazio
                  if (raw.trim() === "") {
                    updateField("valor_unitario")(undefined);
                    return;
                  }

                  // aceitar vírgula/ponto
                  const n = parseMoneyToNumber(raw);
                  if (n === null) return;

                  updateField("valor_unitario")(Number(n.toFixed(2)));
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

            {/* Valor Total Calculado */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
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
                {FIELD_LABELS.valor_total_calculado}
              </Typography>

              <TextField
                value={totalCalculado !== null ? formatBRL(totalCalculado) : ""}
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

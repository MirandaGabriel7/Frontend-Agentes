// src/features/agents/trp/components/TrpStructuredDataEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Divider,
  TextField,
  MenuItem,
  Paper,
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";

import type { TrpCamposNormalizados } from "../../../lib/types/trp";
import { organizeFieldsBySections } from "../utils/trpFieldSections";
import { getTrpFieldLabel } from "../utils/trpLabels";
import { normalizeTrpValue } from "../utils/formatTrpValues";

// =========================================================
// Tipos / Helpers
// =========================================================

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  try {
    return String(v);
  } catch {
    return "";
  }
}

function deepClone<T>(obj: T): T {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

type ItemObjetoLike = {
  descricao?: unknown;
  unidade_medida?: unknown;
  quantidade_recebida?: unknown;

  // V1
  valor_unitario?: unknown;

  // V2
  valor_unitario_raw?: unknown;
  valor_unitario_num?: unknown;

  valor_total_calculado?: unknown;
};

function getItemUnitValueForEdit(it: ItemObjetoLike) {
  // prioridade: raw (texto que o fiscal digitou) -> num -> valor_unitario
  return (
    (typeof it.valor_unitario_raw === "string" ? it.valor_unitario_raw : null) ??
    (it.valor_unitario_num ?? null) ??
    (it.valor_unitario ?? null)
  );
}

function makeEmptyItem(): ItemObjetoLike {
  return {
    descricao: "",
    unidade_medida: "",
    quantidade_recebida: "",
    valor_unitario: "",
    valor_unitario_raw: "",
    valor_unitario_num: null,
    valor_total_calculado: "",
  };
}

function setByPath(obj: any, path: (string | number)[], value: any) {
  const out = deepClone(obj ?? {});
  let cur: any = out;

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i === path.length - 1;

    if (isLast) {
      cur[key as any] = value;
      break;
    }

    const nextKey = path[i + 1];
    const shouldBeArray = typeof nextKey === "number";

    if (cur[key as any] === undefined || cur[key as any] === null) {
      cur[key as any] = shouldBeArray ? [] : {};
    } else if (shouldBeArray && !Array.isArray(cur[key as any])) {
      cur[key as any] = [];
    } else if (!shouldBeArray && !isPlainObject(cur[key as any])) {
      cur[key as any] = {};
    }

    cur = cur[key as any];
  }

  return out;
}

function getScalarFieldType(fieldName: string):
  | "text"
  | "date"
  | "money"
  | "number"
  | "enum"
  | "multiline" {
  const key = fieldName.toLowerCase();

  // multiline
  if (key.includes("observacoes") || key.includes("motivo_atraso") || key.includes("comentarios")) {
    return "multiline";
  }

  // dates
  if (key.startsWith("data_") || key.endsWith("_data") || key.includes("data")) {
    return "date";
  }

  // money
  if (
    key.includes("valor") ||
    key === "valor_total_geral" ||
    key === "valor_total_calculado" ||
    key === "valor_unitario" ||
    key === "valor_efetivo" ||
    key === "valor_efetivo_numero"
  ) {
    return "money";
  }

  // number
  if (key.includes("quantidade") || key.includes("numero") || key.includes("qtd")) {
    // cuidado: numero_nf/numero_contrato são text. Então filtra:
    if (key === "quantidade_recebida") return "number";
    return "text";
  }

  // enums (os que realmente não podem virar texto livre)
  if (
    key === "tipo_contrato" ||
    key === "tipo_contratacao" ||
    key === "tipo_base_prazo" ||
    key === "condicao_prazo" ||
    key === "condicao_quantidade" ||
    key === "condicao_quantidade_ordem" ||
    key === "condicao_quantidade_nf"
  ) {
    return "enum";
  }

  return "text";
}

function enumOptions(fieldName: string) {
  const key = fieldName;

  if (key === "tipo_contrato" || key === "tipo_contratacao") {
    return [
      { value: "", label: "— Selecionar —" },
      { value: "BENS", label: "Bens" },
      { value: "SERVIÇOS", label: "Serviços" },
      { value: "SERVICOS", label: "Serviços" },
      { value: "OBRA", label: "Obra" },
    ];
  }

  if (key === "tipo_base_prazo" || key === "tipoBasePrazo") {
    return [
      { value: "", label: "— Selecionar —" },
      { value: "DATA_RECEBIMENTO", label: "Data de Recebimento" },
      { value: "SERVICO", label: "Conclusão do Serviço" },
    ];
  }

  if (key === "condicao_prazo" || key === "condicaoPrazo") {
    return [
      { value: "", label: "— Selecionar —" },
      { value: "NO_PRAZO", label: "No prazo" },
      { value: "FORA_DO_PRAZO", label: "Fora do prazo" },
    ];
  }

  if (
    key === "condicao_quantidade" ||
    key === "condicaoQuantidade" ||
    key === "condicao_quantidade_ordem" ||
    key === "condicaoQuantidadeOrdem" ||
    key === "condicao_quantidade_nf" ||
    key === "condicaoQuantidadeNf"
  ) {
    return [
      { value: "", label: "— Selecionar —" },
      { value: "TOTAL", label: "Total" },
      { value: "PARCIAL", label: "Parcial" },
    ];
  }

  return [{ value: "", label: "— Selecionar —" }];
}

// label especial (se você ainda não colocou em trpLabels)
function getEditorLabel(fieldName: string) {
  if (fieldName === "fileName") return "Nome do TRP";
  return getTrpFieldLabel(fieldName);
}

// =========================================================
// Component
// =========================================================

interface TrpStructuredDataEditorProps {
  campos: TrpCamposNormalizados | Record<string, any>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

export const TrpStructuredDataEditor: React.FC<TrpStructuredDataEditorProps> = ({
  campos,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  // trabalha sempre com record editável
  const [local, setLocal] = useState<Record<string, any>>(
    isPlainObject(campos) ? (campos as any) : {}
  );

  // quando trocar run / carregar draft
  useEffect(() => {
    setLocal(isPlainObject(campos) ? (campos as any) : {});
  }, [campos]);

  const camposAsRecord = useMemo(() => (local ?? {}) as Record<string, any>, [local]);

  const sectionsWithFields = useMemo(() => {
    // ✅ usa exatamente suas seções e lógica (alwaysShowFields etc.)
    return organizeFieldsBySections(camposAsRecord);
  }, [camposAsRecord]);

  const sections = useMemo(() => {
    // ✅ aqui, ao contrário do "Panel", a gente NÃO remove ASSINATURAS
    // porque você quer editar tudo.
    return sectionsWithFields.map(({ section, fields }) => ({
      title: section.title,
      fields,
    }));
  }, [sectionsWithFields]);

  function commit(next: Record<string, any>) {
    setLocal(next);
    onChange(next);
  }

  function updateField(fieldName: string, value: any) {
    const next = { ...(camposAsRecord ?? {}) };
    next[fieldName] = value;
    commit(next);
  }

  // ============================
  // ITENS: editor completo
  // ============================
  const itens = useMemo(() => {
    const raw = (camposAsRecord as any)?.itens_objeto;
    return Array.isArray(raw) ? (raw as ItemObjetoLike[]) : [];
  }, [camposAsRecord]);

  function setItens(nextItens: ItemObjetoLike[]) {
    updateField("itens_objeto", nextItens);
  }

  function addItem() {
    const next = [...itens, makeEmptyItem()];
    setItens(next);
  }

  function removeItem(index: number) {
    const next = itens.filter((_, i) => i !== index);
    setItens(next);
  }

  function updateItem(index: number, patch: Partial<ItemObjetoLike>) {
    const next = itens.map((it, i) => (i === index ? { ...(it as any), ...patch } : it));
    setItens(next);
  }

  // ============================
  // Render helpers
  // ============================

  function renderScalarField(fieldName: string, rawValue: unknown) {
    const type = getScalarFieldType(fieldName);
    const label = getEditorLabel(fieldName);

    // string editável sempre
    const valueStr = safeStr(rawValue);

    // enums com dropdown (pra fiscal não inventar NO-PRAZO etc)
    if (type === "enum") {
      const opts = enumOptions(fieldName);

      return (
        <TextField
          select
          fullWidth
          size="small"
          label={label}
          value={valueStr}
          disabled={disabled}
          onChange={(e) => updateField(fieldName, e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        >
          {opts.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    // multiline
    if (type === "multiline") {
      return (
        <TextField
          fullWidth
          size="small"
          label={label}
          value={valueStr}
          disabled={disabled}
          onChange={(e) => updateField(fieldName, e.target.value)}
          multiline
          minRows={3}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      );
    }

    // date text (DD/MM/AAAA)
    if (type === "date") {
      return (
        <TextField
          fullWidth
          size="small"
          label={label}
          value={valueStr}
          disabled={disabled}
          onChange={(e) => updateField(fieldName, e.target.value)}
          placeholder="DD/MM/AAAA"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          helperText="Formato: DD/MM/AAAA"
        />
      );
    }

    // money/number -> campo texto simples (sem máscara, sem loucura)
    // ✅ UX: mostra formatado como dica, mas mantém o que ele digitou.
    if (type === "money" || type === "number") {
      const normalizedHint = normalizeTrpValue(valueStr, fieldName);
      const showHint = normalizedHint && normalizedHint !== valueStr;

      return (
        <TextField
          fullWidth
          size="small"
          label={label}
          value={valueStr}
          disabled={disabled}
          onChange={(e) => updateField(fieldName, e.target.value)}
          placeholder={type === "money" ? "Ex: 1.234,56" : "Ex: 10"}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          helperText={showHint ? `Sugestão: ${normalizedHint}` : " "}
        />
      );
    }

    // default: text
    return (
      <TextField
        fullWidth
        size="small"
        label={label}
        value={valueStr}
        disabled={disabled}
        onChange={(e) => updateField(fieldName, e.target.value)}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
    );
  }

  function renderItensEditor() {
    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Itens do Recebimento
          </Typography>

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addItem}
            disabled={disabled}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            Adicionar item
          </Button>
        </Box>

        {itens.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.divider, 0.25)}`,
              bgcolor: alpha(theme.palette.grey[50], 0.6),
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Nenhum item informado. Clique em <b>“Adicionar item”</b>.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {itens.map((it, idx) => {
              const unitValue = safeStr(getItemUnitValueForEdit(it));
              const qtd = safeStr(it.quantidade_recebida);
              const total = safeStr(it.valor_total_calculado);

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                      gap: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      Item {idx + 1}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => removeItem(idx)}
                      disabled={disabled}
                      sx={{
                        color: theme.palette.error.main,
                        bgcolor: alpha(theme.palette.error.main, 0.06),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.error.main, 0.12),
                        },
                      }}
                      aria-label="Remover item"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Descrição"
                        value={safeStr(it.descricao)}
                        disabled={disabled}
                        onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unidade de Medida"
                        value={safeStr(it.unidade_medida)}
                        disabled={disabled}
                        onChange={(e) => updateItem(idx, { unidade_medida: e.target.value })}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Quantidade Recebida"
                        value={qtd}
                        disabled={disabled}
                        onChange={(e) => updateItem(idx, { quantidade_recebida: e.target.value })}
                        placeholder="Ex: 10"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Valor Unitário"
                        value={unitValue}
                        disabled={disabled}
                        onChange={(e) => {
                          // mantém compat com V1 e V2
                          updateItem(idx, {
                            valor_unitario: e.target.value,
                            valor_unitario_raw: e.target.value,
                          });
                        }}
                        placeholder="Ex: 1.234,56"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Valor Total"
                        value={total}
                        disabled={disabled}
                        onChange={(e) => updateItem(idx, { valor_total_calculado: e.target.value })}
                        placeholder="Ex: 12.345,67"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho leve */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          bgcolor: alpha(theme.palette.info.main, 0.06),
        }}
      >
        <Typography sx={{ fontWeight: 900, mb: 0.5, color: theme.palette.info.dark }}>
          Edição dos Dados do TRP
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}>
          Altere os campos necessários com cuidado. O documento oficial só será atualizado após você clicar em{" "}
          <b>“Salvar nova versão”</b>.
        </Typography>
      </Paper>

      {sections.map((section, sectionIndex) => {
        const title = section.title;

        const hasItensEditor = title === "ITENS DO RECEBIMENTO";

        return (
          <Box
            key={title}
            sx={{
              mb: sectionIndex < sections.length - 1 ? 4 : 0,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                mb: 2.5,
                color: theme.palette.text.primary,
                fontSize: "1.125rem",
              }}
            >
              {title}
            </Typography>

            {/* Editor de itens (especial) */}
            {hasItensEditor && (
              <Box sx={{ mb: 3 }}>
                {renderItensEditor()}

                <Box sx={{ mt: 2 }}>
                  {renderScalarField(
                    "valor_total_geral",
                    (camposAsRecord as any)?.valor_total_geral ?? (camposAsRecord as any)?.valorTotalGeral ?? ""
                  )}
                </Box>
              </Box>
            )}

            {/* Campos normais */}
            <Grid container spacing={3}>
              {section.fields
                .filter((f) => {
                  // ✅ não duplicar itens_objeto / valor_total_geral aqui (já renderizados acima)
                  if (hasItensEditor && (f.fieldName === "itens_objeto" || f.fieldName === "valor_total_geral" || f.fieldName === "valorTotalGeral")) {
                    return false;
                  }
                  return true;
                })
                .map((field, idx) => {
                  const isWide =
                    field.fieldName === "objeto_contrato" ||
                    field.fieldName.includes("observacoes") ||
                    field.fieldName.includes("comentarios") ||
                    field.fieldName === "motivo_atraso";

                  return (
                    <Grid item key={`${field.fieldName}-${idx}`} xs={12} sm={isWide ? 12 : 6}>
                      {renderScalarField(field.fieldName, (camposAsRecord as any)[field.fieldName])}
                    </Grid>
                  );
                })}
            </Grid>

            {sectionIndex < sections.length - 1 && (
              <Divider sx={{ mt: 4, borderColor: alpha(theme.palette.divider, 0.08) }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

import React from "react";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

// ✅ Grid legado (suporta item/xs/sm)
import Grid from "@mui/material/GridLegacy";

import type { TrpCamposNormalizados } from "../../../lib/types/trp";
import { normalizeTrpValue } from "../utils/formatTrpValues";
import { organizeFieldsBySections } from "../utils/trpFieldSections";

interface TrpStructuredDataPanelProps {
  campos: TrpCamposNormalizados;
}

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
}

const DataField: React.FC<DataFieldProps> = ({ label, value }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: theme.palette.text.secondary,
          mb: 0.5,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          color: theme.palette.text.primary,
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Box>
    </Box>
  );
};

const HIDDEN_STRINGS = new Set([
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "Não informado",
  "Nao informado",
  "Não há observações adicionais",
]);

function isHiddenOrEmptyString(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v !== "string") return false;

  const s = v.trim();
  if (!s) return true;
  if (HIDDEN_STRINGS.has(s)) return true;
  if (HIDDEN_STRINGS.has(s.toUpperCase())) return true;
  return false;
}

function isPlainObject(v: unknown) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

type ItemObjetoLike = {
  descricao?: unknown;
  unidade_medida?: unknown;
  quantidade_recebida?: unknown;
  valor_unitario?: unknown;
  valor_unitario_num?: unknown;
  valor_unitario_raw?: unknown;
  valor_total_calculado?: unknown;
};

function getItemUnitValue(it: ItemObjetoLike) {
  return it.valor_unitario_num ?? it.valor_unitario ?? it.valor_unitario_raw;
}

function parsePtbrMoneyLike(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const cleaned = s.replace(/[R$\s]/g, "");

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function renderItensObjetoTable(itens: ItemObjetoLike[], totalGeral?: unknown) {
  const safe = (Array.isArray(itens) ? itens : []).filter(Boolean);
  if (!safe.length) return null;

  // total geral: se não veio, tenta somar
  let computedTotal: number | null = null;
  const tgNum = parsePtbrMoneyLike(totalGeral);

  if (tgNum === null) {
    try {
      const sum = safe.reduce((acc, it) => {
        const n = parsePtbrMoneyLike(it.valor_total_calculado);
        return acc + (n ?? 0);
      }, 0);
      computedTotal = Number.isFinite(sum) ? sum : null;
    } catch {
      computedTotal = null;
    }
  }

  const totalToShow =
    tgNum !== null
      ? normalizeTrpValue(String(tgNum), "valor_total_geral")
      : computedTotal !== null
      ? normalizeTrpValue(String(computedTotal), "valor_total_geral")
      : null;

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={(theme) => ({
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.14)}`,
        overflow: "hidden",
      })}
    >
      <Table size="small">
        <TableHead>
          <TableRow
            sx={(theme) => ({
              bgcolor: alpha(theme.palette.grey[500], 0.08),
            })}
          >
            <TableCell sx={{ fontWeight: 800 }}>Descrição</TableCell>
            <TableCell sx={{ fontWeight: 800, width: 90 }}>UM</TableCell>
            <TableCell sx={{ fontWeight: 800, width: 130 }} align="right">
              Quantidade
            </TableCell>
            <TableCell sx={{ fontWeight: 800, width: 170 }} align="right">
              Valor Unitário
            </TableCell>
            <TableCell sx={{ fontWeight: 800, width: 170 }} align="right">
              Valor Total
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {safe.map((it, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ verticalAlign: "top" }}>
                {String(it.descricao ?? "")}
              </TableCell>
              <TableCell sx={{ verticalAlign: "top" }}>
                {String(it.unidade_medida ?? "")}
              </TableCell>
              <TableCell align="right" sx={{ verticalAlign: "top" }}>
                {normalizeTrpValue(
                  String(it.quantidade_recebida ?? ""),
                  "quantidade_recebida"
                )}
              </TableCell>
              <TableCell align="right" sx={{ verticalAlign: "top" }}>
                {normalizeTrpValue(
                  String(getItemUnitValue(it) ?? ""),
                  "valor_unitario"
                )}
              </TableCell>
              <TableCell align="right" sx={{ verticalAlign: "top" }}>
                {normalizeTrpValue(
                  String(it.valor_total_calculado ?? ""),
                  "valor_total_calculado"
                )}
              </TableCell>
            </TableRow>
          ))}

          {totalToShow && (
            <TableRow
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              })}
            >
              {/* ✅ FICA BEM COLADO: label + valor no lado direito */}
              <TableCell
                colSpan={5}
                sx={{
                  fontWeight: 900,
                  borderTop: `1px solid ${alpha("#000", 0.08)}`,
                  paddingY: 1.25,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 1, // ✅ controla o quão "colado" fica
                  }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 900, lineHeight: 1.2 }}
                  >
                    Total Geral
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 900, whiteSpace: "nowrap", lineHeight: 1.2 }}
                  >
                    {totalToShow}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function toDisplayNode(fieldName: string, raw: unknown): React.ReactNode {
  if (raw === null || raw === undefined) return "";

  if (fieldName === "itens_objeto" && Array.isArray(raw)) {
    return renderItensObjetoTable(raw as ItemObjetoLike[], undefined);
  }

  if (Array.isArray(raw) || isPlainObject(raw)) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Conteúdo estruturado disponível (ver “JSON Bruto”).
      </Typography>
    );
  }

  if (typeof raw === "string") {
    const normalized = normalizeTrpValue(raw, fieldName);
    return normalized?.trim?.() ? normalized : "";
  }

  if (typeof raw === "number") {
    const normalized = normalizeTrpValue(String(raw), fieldName);
    return normalized?.trim?.() ? normalized : String(raw);
  }

  if (typeof raw === "boolean") return raw ? "Sim" : "Não";

  return String(raw);
}

export const TrpStructuredDataPanel: React.FC<TrpStructuredDataPanelProps> = ({
  campos,
}) => {
  const theme = useTheme();

  const camposAsRecord = (campos ?? {}) as Record<string, unknown>;
  const sectionsWithFields = organizeFieldsBySections(camposAsRecord);

  // ✅ pega total geral (mesmo se existir no payload, não exibimos como campo solto no FieldSections)
  const totalGeral =
    (camposAsRecord as any).valor_total_geral ?? (camposAsRecord as any).valorTotalGeral;

  const sections = sectionsWithFields
    .filter(({ section }) => section.title !== "ASSINATURAS")
    .map(({ section, fields }) => {
      const normalizedFields = fields
        .map((field) => {
          const raw = field.value;

          if (field.fieldName === "observacoes") {
            const display =
              typeof raw === "string"
                ? normalizeTrpValue(raw, field.fieldName)
                : "";
            if (isHiddenOrEmptyString(display)) return null;
          }

          if (typeof raw === "string" && isHiddenOrEmptyString(raw)) return null;

          if (field.fieldName === "itens_objeto" && Array.isArray(raw)) {
            const node = renderItensObjetoTable(
              raw as ItemObjetoLike[],
              totalGeral
            );
            if (!node) return null;

            return {
              fieldName: field.fieldName,
              label: field.label,
              value: node,
            };
          }

          const node = toDisplayNode(field.fieldName, raw);

          if (typeof node === "string" && isHiddenOrEmptyString(node)) return null;
          if (typeof node === "string" && !node.trim()) return null;

          return {
            fieldName: field.fieldName,
            label: field.label,
            value: node,
          };
        })
        .filter(Boolean) as Array<{
        fieldName: string;
        label: string;
        value: React.ReactNode;
      }>;

      return {
        title: section.title,
        fields: normalizedFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Box
          key={section.title}
          sx={{ mb: sectionIndex < sections.length - 1 ? 4 : 0 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              fontSize: "1.125rem",
            }}
          >
            {section.title}
          </Typography>

          <Grid container spacing={3}>
            {section.fields.map((field, fieldIndex) => {
              const isItens = field.fieldName === "itens_objeto";
              return (
                <Grid item key={fieldIndex} xs={12} sm={isItens ? 12 : 6}>
                  <DataField label={field.label} value={field.value} />
                </Grid>
              );
            })}
          </Grid>

          {sectionIndex < sections.length - 1 && (
            <Divider
              sx={{ mt: 4, borderColor: alpha(theme.palette.divider, 0.08) }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

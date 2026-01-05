import React from "react";
import { Box, Typography, Paper, alpha, useTheme } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { normalizeTrpValue } from "../utils/formatTrpValues";

interface TrpMarkdownViewProps {
  content: string;
  showTitle?: boolean;
}

const HIDDEN_STRINGS = new Set([
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "Não informado",
  "Nao informado",
]);

function extractText(node: any): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node))
    return extractText((node as any).props?.children);
  return "";
}

function isMeaningfulText(s: string): boolean {
  const t = (s ?? "").trim();
  if (!t) return false;
  if (HIDDEN_STRINGS.has(t)) return false;
  if (HIDDEN_STRINGS.has(t.toUpperCase())) return false;
  return true;
}

function rowHasValue(cellsNormalizedText: string[]): boolean {
  if (!cellsNormalizedText.length) return false;

  const candidates =
    cellsNormalizedText.length >= 2
      ? cellsNormalizedText.slice(1)
      : cellsNormalizedText;

  return candidates.some((txt) => isMeaningfulText(txt));
}

function fixBrokenTotalRowTables(md: string): string {
  if (!md || typeof md !== "string") return "";

  const lines = md.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    const next = lines[i + 1];

    const curIsBlank = cur.trim() === "";
    const nextIsTotalRow =
      typeof next === "string" && /^\|\s*\*?\*?\s*Total\s+Geral/i.test(next.trim());

    if (curIsBlank && nextIsTotalRow) continue;

    if (/^\|\s*\*?\*?\s*Total\s+Geral/i.test(cur.trim())) {
      const raw = cur.trim();
      const parts = raw
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((p) => p.trim());

      if (parts.length >= 2) {
        const label = parts[0] || "Total Geral";
        const last = parts[parts.length - 1] || "";
        const normalized = [label, "", "", "", last];
        out.push(`| ${normalized.join(" | ")} |`);
        continue;
      }
    }

    out.push(cur);
  }

  return out.join("\n");
}

export const TrpMarkdownView: React.FC<TrpMarkdownViewProps> = ({
  content,
  showTitle = true,
}) => {
  const theme = useTheme();

  const sanitizedContent = React.useMemo(() => {
    const base = (content || "")
      .replace(/\bNAO_DECLARADO\b/gi, "")
      .replace(/\bNÃO_DECLARADO\b/gi, "")
      .replace(/\bNAO_INFORMADO\b/gi, "")
      .replace(/\bNÃO_INFORMADO\b/gi, "")
      .replace(/\bDATA_RECEBIMENTO\b/gi, "Data de Recebimento")
      .replace(/\bSERVICO\b/gi, "Conclusão do Serviço")
      .replace(/\bFORA_DO_PRAZO\b/gi, "Fora do prazo")
      .replace(/\bNO_PRAZO\b/gi, "No prazo")
      .replace(/\bTOTAL\b/gi, "Total")
      .replace(/\bPARCIAL\b/gi, "Parcial")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return fixBrokenTotalRowTables(base);
  }, [content]);

  if (!sanitizedContent || !sanitizedContent.trim()) {
    return (
      <Box sx={{ height: "100%", overflow: "auto" }}>
        {showTitle && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
          >
            Visualização do Documento
          </Typography>
        )}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: theme.palette.background.paper,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            Documento não disponível
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      {showTitle && (
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
        >
          Visualização do Documento
        </Typography>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha("#000", 0.04)}, 0 4px 12px ${alpha(
            "#000",
            0.02
          )}`,
        }}
      >
        <Box
          sx={{
            "& p": {
              marginBottom: 2,
              lineHeight: 1.8,
              color: theme.palette.text.primary,
            },
            "& h1": {
              marginTop: 0,
              marginBottom: 3,
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: "1.75rem",
              paddingBottom: 2,
              borderBottom: `2px solid ${alpha(
                theme.palette.primary.main,
                0.2
              )}`,
            },
            "& h2": {
              marginTop: 0,
              marginBottom: 2.5,
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: "1.5rem",
              paddingBottom: 1.5,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            },
            "& h3, & h4, & h5, & h6": {
              marginTop: 2,
              marginBottom: 1.5,
              fontWeight: 600,
              color: theme.palette.text.primary,
            },
            "& ul, & ol": {
              marginBottom: 2,
              paddingLeft: 3,
            },
            "& li": {
              marginBottom: 0.5,
              lineHeight: 1.8,
            },
            "& table": {
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 2,
              marginBottom: 2,
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: `0 1px 3px ${alpha("#000", 0.08)}`,
              "& th, & td": {
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                padding: 1.5,
                textAlign: "left",
                fontSize: "0.9375rem",
                verticalAlign: "top",
              },
              "& th": {
                backgroundColor: alpha(theme.palette.grey[500], 0.08),
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              },
              "& td": {
                color: theme.palette.text.primary,
              },
              "& tr:nth-of-type(even) td": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
              "& tr:hover td": {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            },
            "& code": {
              backgroundColor: alpha(theme.palette.text.primary, 0.06),
              padding: "2px 6px",
              borderRadius: 1,
              fontSize: "0.875em",
            },
            "& pre": {
              backgroundColor: alpha(theme.palette.text.primary, 0.04),
              padding: 2,
              borderRadius: 2,
              overflow: "auto",
              "& code": {
                backgroundColor: "transparent",
                padding: 0,
              },
            },
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              tr: ({ node, children, ...props }) => {
                const parentTag = (node as any)?.parent?.tagName;
                const isHeaderRow = parentTag === "thead";
                if (isHeaderRow) return <tr {...props}>{children}</tr>;

                const cells = React.Children.toArray(children);
                if (!cells.length) return <tr {...props}>{children}</tr>;

                const cellsText = cells.map((cell: any) => extractText(cell));
                const cellsTextNormalized = cellsText.map((txt) =>
                  txt ? normalizeTrpValue(txt, undefined) : ""
                );

                const firstCell = (cellsTextNormalized[0] || "")
                  .trim()
                  .toLowerCase();
                const isTotalRow = firstCell.includes("total geral");

                // ✅ TOTAL GERAL: puxa o texto para a direita (bem perto do valor)
                if (isTotalRow) {
                  const lastValue = (
                    cellsTextNormalized[cellsTextNormalized.length - 1] || ""
                  ).trim();

                  const borderTop = `1px solid ${alpha(
                    theme.palette.divider,
                    0.2
                  )}`;
                  const rowBg = alpha(theme.palette.grey[500], 0.04);

                  return (
                    <tr {...props}>
                      {/* ColSpan 4 + alinhamento à direita => “Total Geral” vai pra perto do valor */}
                      <td
                        colSpan={4}
                        style={{
                          fontWeight: 800,
                          textAlign: "right",
                          paddingRight: "10px",
                          borderLeft: "none",
                          borderRight: "none",
                          borderTop,
                          padding: "10px 12px",
                          background: rowBg,
                        }}
                      >
                        Total Geral
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          borderLeft: "none",
                          borderRight: "none",
                          borderTop,
                          padding: "10px 12px",
                          background: rowBg,
                        }}
                      >
                        {lastValue}
                      </td>
                    </tr>
                  );
                }

                const keep = rowHasValue(cellsTextNormalized);
                if (!keep) return null;

                return <tr {...props}>{children}</tr>;
              },
            }}
          >
            {sanitizedContent}
          </ReactMarkdown>
        </Box>
      </Paper>
    </Box>
  );
};

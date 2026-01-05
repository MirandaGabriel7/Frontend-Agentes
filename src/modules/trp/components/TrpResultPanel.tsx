import React, { useMemo, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  alpha,
  useTheme,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { TrpRun } from "../../../lib/types/trp";
import { TrpSummaryStrip } from "./TrpSummaryStrip";
import { TrpMarkdownView } from "./TrpMarkdownView";
import { normalizeTrpValue } from "../utils/formatTrpValues";

interface TrpResultPanelProps {
  run: TrpRun;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trp-tabpanel-${index}`}
      aria-labelledby={`trp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function prettifyKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function isPlainObject(v: unknown) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export const TrpResultPanel: React.FC<TrpResultPanelProps> = ({ run }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const output = (run as any)?.output;

  // ✅ compat: backend novo + legado
  const markdownFinal = String(
    output?.documento_markdown_final ??
      output?.documento_markdown ??
      ""
  );

  const campos = useMemo(() => {
    return (
      output?.campos_trp_normalizados ||
      output?.campos ||
      {}
    );
  }, [output]);

  const handleCopyMarkdown = () => {
    if (markdownFinal.trim()) {
      navigator.clipboard.writeText(markdownFinal);
      alert("Markdown copiado para a área de transferência!");
    }
  };

  if (!output) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Nenhum TRP gerado ainda. Preencha o formulário e clique em "Gerar TRP com IA".
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        overflow: "hidden",
      }}
    >
      <TrpSummaryStrip run={run} />

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              minHeight: 48,
            },
          }}
        >
          <Tab label="Documento" />
          <Tab label="Campos Normalizados" />
          <Tab label="JSON Bruto" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyMarkdown}
              variant="outlined"
              disabled={!markdownFinal.trim()}
            >
              Copiar Markdown
            </Button>
          </Box>

          <TrpMarkdownView content={markdownFinal} showTitle={false} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "35%" }}>Campo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {Object.entries(campos || {}).map(([key, value]) => {
                  const prettyKey = prettifyKey(key);
                  const isComplex = Array.isArray(value) || isPlainObject(value);

                  return (
                    <TableRow key={key}>
                      <TableCell sx={{ fontWeight: 500, verticalAlign: "top" }}>
                        {prettyKey}
                      </TableCell>

                      <TableCell sx={{ verticalAlign: "top" }}>
                        {isComplex ? (
                          <Box
                            component="pre"
                            sx={{
                              m: 0,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.text.primary, 0.04),
                              overflow: "auto",
                              fontSize: "0.825rem",
                              fontFamily: "monospace",
                              maxHeight: 260,
                            }}
                          >
                            {JSON.stringify(value, null, 2)}
                          </Box>
                        ) : (
                          normalizeTrpValue(
                            typeof value === "string" ? value : String(value ?? ""),
                            key
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ mt: 2, opacity: 0.6 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Observação: campos complexos (arrays/objetos) são exibidos como JSON.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              overflow: "auto",
              fontSize: "0.875rem",
              fontFamily: "monospace",
            }}
          >
            {JSON.stringify(output, null, 2)}
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
};

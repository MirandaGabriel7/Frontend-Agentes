import React, { useState } from 'react';
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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TrpRun } from '../../../lib/types/trp';
import { TrpSummaryStrip } from './TrpSummaryStrip';
import { TrpMarkdownView } from './TrpMarkdownView';
import { normalizeTrpValue } from '../utils/formatTrpValues';

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

export const TrpResultPanel: React.FC<TrpResultPanelProps> = ({ run }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleCopyMarkdown = () => {
    if (run.output?.documento_markdown) {
      navigator.clipboard.writeText(run.output.documento_markdown);
      alert('Markdown copiado para a área de transferência!');
    }
  };

  if (!run.output) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Nenhum TRP gerado ainda. Preencha o formulário e clique em "Gerar TRP com IA".
        </Typography>
      </Paper>
    );
  }

  const campos = run.output.campos;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        overflow: 'hidden',
      }}
    >
      <TrpSummaryStrip run={run} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
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
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyMarkdown}
              variant="outlined"
            >
              Copiar Markdown
            </Button>
          </Box>
          <TrpMarkdownView content={run.output.documento_markdown} showTitle={false} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Campo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(campos).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableCell>
                    <TableCell>
                      {normalizeTrpValue(typeof value === 'string' ? value : String(value), key)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(run.output, null, 2)}
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
};


import { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  CircularProgress,
  Container,
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadFile, runTrpAgent, TrpRunResponse } from '../services/api';

type CondicaoPrazo = 'NO_PRAZO' | 'ATRASADO';
type CondicaoQuantidade = 'CONFORME_EMPENHO' | 'MENOR' | 'MAIOR';

interface FormData {
  file: File | null;
  dataRecebimento: string;
  condicaoPrazo: CondicaoPrazo;
  condicaoQuantidade: CondicaoQuantidade;
  observacoes: string;
}

export const TrpAgentPage = () => {
  const [formData, setFormData] = useState<FormData>({
    file: null,
    dataRecebimento: '',
    condicaoPrazo: 'NO_PRAZO',
    condicaoQuantidade: 'CONFORME_EMPENHO',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrpRunResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Por favor, selecione um arquivo PDF');
      return;
    }

    if (!formData.dataRecebimento) {
      setError('Por favor, informe a data de recebimento');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Upload file
      const uploadResponse = await uploadFile(formData.file);
      const fileId = uploadResponse.fileId;

      // Step 2: Run TRP agent
      const trpResponse = await runTrpAgent({
        fileId,
        dadosRecebimento: {
          dataRecebimento: formData.dataRecebimento,
          condicaoPrazo: formData.condicaoPrazo,
          condicaoQuantidade: formData.condicaoQuantidade,
          observacoes: formData.observacoes || null,
        },
      });

      setResult(trpResponse);
    } catch (err: any) {
      console.error('Erro ao processar TRP:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Erro ao processar o TRP. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Termo de Recebimento Provisório (TRP)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gere o TRP a partir da Ficha de Contratualização, Nota Fiscal e Ordem de Fornecimento.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dados do Recebimento
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="trp-file-upload"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label htmlFor="trp-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFile />}
                    fullWidth
                    disabled={loading}
                  >
                    {formData.file ? formData.file.name : 'Upload PDF (Ficha + NF + Ordem de Fornecimento)'}
                  </Button>
                </label>
              </Box>

              <TextField
                label="Data de Recebimento"
                type="date"
                fullWidth
                required
                margin="normal"
                value={formData.dataRecebimento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataRecebimento: e.target.value }))
                }
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
              />

              <TextField
                label="Condição de Prazo"
                select
                fullWidth
                required
                margin="normal"
                value={formData.condicaoPrazo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    condicaoPrazo: e.target.value as CondicaoPrazo,
                  }))
                }
                disabled={loading}
              >
                <MenuItem value="NO_PRAZO">No Prazo</MenuItem>
                <MenuItem value="ATRASADO">Atrasado</MenuItem>
              </TextField>

              <TextField
                label="Condição de Quantidade"
                select
                fullWidth
                required
                margin="normal"
                value={formData.condicaoQuantidade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    condicaoQuantidade: e.target.value as CondicaoQuantidade,
                  }))
                }
                disabled={loading}
              >
                <MenuItem value="CONFORME_EMPENHO">Conforme Empenho</MenuItem>
                <MenuItem value="MENOR">Menor</MenuItem>
                <MenuItem value="MAIOR">Maior</MenuItem>
              </TextField>

              <TextField
                label="Observações"
                multiline
                rows={4}
                fullWidth
                margin="normal"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
                }
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    Gerando TRP...
                  </Box>
                ) : (
                  'Gerar TRP'
                )}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Right Column: Results */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resultado
            </Typography>
            {!result ? (
              <Typography variant="body2" color="text.secondary">
                O documento TRP aparecerá aqui após você preencher o formulário e clicar em "Gerar TRP".
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {/* Markdown Preview */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Documento Markdown Final
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      maxHeight: '400px',
                      overflow: 'auto',
                      bgcolor: 'background.default',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.documento_markdown_final}
                    </ReactMarkdown>
                  </Paper>
                </Grid>

                {/* Structured Fields */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Campos Estruturados
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      maxHeight: '300px',
                      overflow: 'auto',
                      bgcolor: 'background.default',
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(result.campos_trp_normalizados, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};


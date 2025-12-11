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
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CondicaoPrazo = 'NO_PRAZO' | 'ATRASADO';
type CondicaoQuantidade = 'CONFORME_EMPENHO' | 'MENOR' | 'MAIOR';

// Resultado que o backend TRP devolve em data
interface TrpResult {
  documento_markdown_final: string;
  documento_markdown_prime: string;
  campos_trp_normalizados: any;
}

interface FormDataState {
  file: File | null;
  dataRecebimento: string;
  condicaoPrazo: CondicaoPrazo;
  condicaoQuantidade: CondicaoQuantidade;
  observacoes: string;
}

// ajuste aqui se você usa proxy no Vite/Next
const API_BASE_URL = 'http://localhost:4000';

export const TrpAgentPage = () => {
  const [formData, setFormData] = useState<FormDataState>({
    file: null,
    dataRecebimento: '',
    condicaoPrazo: 'NO_PRAZO',
    condicaoQuantidade: 'CONFORME_EMPENHO',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrpResult | null>(null);

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
      // 🔁 1) Montar o payload de dadosRecebimento no formato do backend
      const dadosRecebimentoPayload = {
        dataRecebimento: formData.dataRecebimento,
        // por enquanto fixamos NF como base, você pode expor isso em um select depois
        tipoBasePrazo: 'NF' as const,
        condicaoPrazo:
          formData.condicaoPrazo === 'NO_PRAZO' ? 'NO_PRAZO' : 'FORA_DO_PRAZO',
        condicaoQuantidade:
          formData.condicaoQuantidade === 'CONFORME_EMPENHO'
            ? 'TOTAL'
            : 'PARCIAL',
        dataPrevistaEntregaContrato: null as string | null,
        dataEntregaReal: null as string | null,
        // se quiser, pode separar depois “motivo do atraso” em um campo próprio
        motivoAtraso:
          formData.condicaoPrazo === 'ATRASADO'
            ? formData.observacoes || null
            : null,
        detalhePendencias: null as string | null,
        observacoesRecebimento: formData.observacoes || null,
      };

      // 🔁 2) Montar FormData exatamente como o backend espera
      const body = new FormData();
      body.append('fichaContratualizacao', formData.file); // usamos o único PDF como ficha
      // NF e Ordem de Fornecimento ficam vazios/ausentes aqui. N8N trata como opcional.
      body.append('dadosRecebimento', JSON.stringify(dadosRecebimentoPayload));

      // 🔁 3) Chamar o backend TRP novo
      const response = await fetch(`${API_BASE_URL}/api/trp/generate`, {
        method: 'POST',
        body,
      });

      const json = await response.json();

      if (!response.ok) {
        // erro HTTP (400/500 etc)
        throw new Error(json?.message || 'Erro ao gerar TRP no servidor.');
      }

      if (!json || json.success !== true || !json.data) {
        throw new Error(
          json?.message || 'Resposta inválida do servidor ao gerar o TRP.'
        );
      }

      // json.data tem exatamente o que precisamos
      const data = json.data as TrpResult;
      setResult(data);
    } catch (err: any) {
      console.error('Erro ao processar TRP:', err);
      setError(
        err.message ||
          'Erro ao processar o TRP. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
        mx: 'auto',
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ mb: 4, textAlign: { xs: 'left', sm: 'center' } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Termo de Recebimento Provisório (TRP)
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: '600px', mx: { xs: 0, sm: 'auto' } }}
        >
          Gere o TRP a partir da Ficha de Contratualização, Nota Fiscal e Ordem
          de Fornecimento.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, maxWidth: { xs: '100%', md: '800px' }, mx: 'auto' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {/* Left Column: Form */}
        <Grid item xs={12} md={6} sx={{ maxWidth: { md: '600px' } }}>
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
                    {formData.file
                      ? formData.file.name
                      : 'Upload PDF (Ficha + NF + Ordem de Fornecimento)'}
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
                  setFormData((prev) => ({
                    ...prev,
                    dataRecebimento: e.target.value,
                  }))
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
                    condicaoQuantidade:
                      e.target.value as CondicaoQuantidade,
                  }))
                }
                disabled={loading}
              >
                <MenuItem value="CONFORME_EMPENHO">
                  Conforme Empenho
                </MenuItem>
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
                  setFormData((prev) => ({
                    ...prev,
                    observacoes: e.target.value,
                  }))
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
        <Grid item xs={12} md={6} sx={{ maxWidth: { md: '600px' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resultado
            </Typography>
            {!result ? (
              <Typography variant="body2" color="text.secondary">
                O documento TRP aparecerá aqui após você preencher o formulário
                e clicar em &quot;Gerar TRP&quot;.
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
                      {JSON.stringify(
                        result.campos_trp_normalizados,
                        null,
                        2
                      )}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

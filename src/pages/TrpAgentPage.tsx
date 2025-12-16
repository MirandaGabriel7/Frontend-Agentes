// src/pages/TrpAgentPage.tsx
import { useMemo, useRef, useState } from 'react';
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
import { generateTrp, TrpRunResult } from '../services/api';

type CondicaoPrazoUI = 'NO_PRAZO' | 'ATRASADO';
type CondicaoQuantidadeUI = 'CONFORME_EMPENHO' | 'MENOR' | 'MAIOR';

interface FormState {
  fichaContratualizacao: File | null;
  notaFiscal: File | null;
  ordemFornecimento: File | null;

  dataRecebimento: string; // yyyy-mm-dd (input date)
  condicaoPrazo: CondicaoPrazoUI;
  condicaoQuantidade: CondicaoQuantidadeUI;
  observacoes: string;
}

export const TrpAgentPage = () => {
  const [formData, setFormData] = useState<FormState>({
    fichaContratualizacao: null,
    notaFiscal: null,
    ordemFornecimento: null,
    dataRecebimento: '',
    condicaoPrazo: 'NO_PRAZO',
    condicaoQuantidade: 'CONFORME_EMPENHO',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrpRunResult | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  // mapeamento UI -> backend
  const mapped = useMemo(() => {
    const condicaoPrazo =
      formData.condicaoPrazo === 'ATRASADO' ? 'FORA_DO_PRAZO' : 'NO_PRAZO';

    const condicaoQuantidade =
      formData.condicaoQuantidade === 'CONFORME_EMPENHO' ? 'TOTAL' : 'PARCIAL';

    return { condicaoPrazo, condicaoQuantidade };
  }, [formData.condicaoPrazo, formData.condicaoQuantidade]);

  const handleFileChange =
    (field: 'fichaContratualizacao' | 'notaFiscal' | 'ordemFornecimento') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      setFormData((prev) => ({ ...prev, [field]: file }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validação mínima
    if (!formData.fichaContratualizacao || !formData.notaFiscal || !formData.ordemFornecimento) {
      setError('Envie os 3 PDFs: Ficha de Contratualização, Nota Fiscal e Ordem de Fornecimento.');
      return;
    }
    if (!formData.dataRecebimento) {
      setError('Por favor, informe a data de recebimento.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ chama direto o endpoint novo
      const trp = await generateTrp({
        dadosRecebimento: {
          tipoContratacao: 'BENS', // Valor padrão, deve ser preenchido pelo formulário em produção
          tipoBasePrazo: 'DATA_RECEBIMENTO',
          dataRecebimento: formData.dataRecebimento,
          condicaoPrazo: mapped.condicaoPrazo,
          condicaoQuantidadeOrdem: mapped.condicaoQuantidade,
          condicaoQuantidadeNF: mapped.condicaoQuantidade,
          observacoesRecebimento: formData.observacoes || null,
        },
        files: {
          fichaContratualizacao: formData.fichaContratualizacao,
          notaFiscal: formData.notaFiscal,
          ordemFornecimento: formData.ordemFornecimento,
        },
      });

      console.log('TRP_RESULT (INNER DATA):', trp);
      setResult(trp);

      // scroll pro resultado
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err: any) {
      console.error('Erro ao processar TRP:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Erro ao processar o TRP. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasResult = !!result?.documento_markdown?.trim();

  return (
    <Box sx={{ width: '100%', mx: 'auto', py: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 4, textAlign: { xs: 'left', sm: 'center' } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Termo de Recebimento Provisório (TRP)
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: '700px', mx: { xs: 0, sm: 'auto' } }}
        >
          Gere o TRP a partir da Ficha de Contratualização, Nota Fiscal e Ordem de Fornecimento.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {/* Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dados do Recebimento
            </Typography>

            <form onSubmit={handleSubmit}>
              {/* Ficha */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="trp-upload-ficha"
                  type="file"
                  onChange={handleFileChange('fichaContratualizacao')}
                  disabled={loading}
                />
                <label htmlFor="trp-upload-ficha">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFile />}
                    fullWidth
                    disabled={loading}
                  >
                    {formData.fichaContratualizacao
                      ? formData.fichaContratualizacao.name
                      : 'Upload PDF — Ficha de Contratualização'}
                  </Button>
                </label>
              </Box>

              {/* NF */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="trp-upload-nf"
                  type="file"
                  onChange={handleFileChange('notaFiscal')}
                  disabled={loading}
                />
                <label htmlFor="trp-upload-nf">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFile />}
                    fullWidth
                    disabled={loading}
                  >
                    {formData.notaFiscal ? formData.notaFiscal.name : 'Upload PDF — Nota Fiscal'}
                  </Button>
                </label>
              </Box>

              {/* Ordem */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="trp-upload-oc"
                  type="file"
                  onChange={handleFileChange('ordemFornecimento')}
                  disabled={loading}
                />
                <label htmlFor="trp-upload-oc">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFile />}
                    fullWidth
                    disabled={loading}
                  >
                    {formData.ordemFornecimento
                      ? formData.ordemFornecimento.name
                      : 'Upload PDF — Ordem de Fornecimento'}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, dataRecebimento: e.target.value }))}
                InputLabelProps={{ shrink: true }}
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
                  setFormData((prev) => ({ ...prev, condicaoPrazo: e.target.value as CondicaoPrazoUI }))
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
                    condicaoQuantidade: e.target.value as CondicaoQuantidadeUI,
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
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
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

        {/* Results */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }} ref={resultRef}>
            <Typography variant="h6" gutterBottom>
              Resultado
            </Typography>

            {!hasResult ? (
              <Typography variant="body2" color="text.secondary">
                O documento TRP aparecerá aqui após você preencher o formulário e clicar em "Gerar TRP".
              </Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Visualização do Documento
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      maxHeight: '600px',
                      overflow: 'auto',
                      bgcolor: 'background.default',
                    }}
                  >
                    {result!.documento_markdown && result!.documento_markdown.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result!.documento_markdown}
                      </ReactMarkdown>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        Documento não disponível
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
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
                      {JSON.stringify(result!.campos, null, 2)}
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

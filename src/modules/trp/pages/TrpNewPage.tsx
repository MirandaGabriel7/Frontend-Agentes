import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { TrpUploadCard } from '../components/TrpUploadCard';
import { TrpRecebimentoForm } from '../components/TrpRecebimentoForm';
import { useTrpApi } from '../hooks/useTrpApi';
import { generateTrp } from '../../../services/api';
import { DadosRecebimento } from '../types/trp.types';

const initialFormData: DadosRecebimento = {
  dataRecebimento: '',
  condicaoPrazo: 'NO_PRAZO',
  condicaoQuantidade: 'CONFORME_EMPENHO',
  objetoFornecido: '', // ✅ NOVO CAMPO
  observacoes: '',
};

export const TrpNewPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Mantém o hook (se você usa globalmente para loading/error),
  // mas agora o fluxo é o NOVO (generateTrp + runId).
  const { loading, error } = useTrpApi();

  // ✅ NOVO PADRÃO: 3 arquivos (igual TrpPage/TrpUploadCard atual)
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] = useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<DadosRecebimento>(initialFormData);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    // ✅ validação mínima (ajuste se quiser obrigar os 3)
    if (!fichaContratualizacaoFile && !notaFiscalFile && !ordemFornecimentoFile) {
      alert('Por favor, selecione pelo menos um arquivo (Ficha, Nota Fiscal ou Ordem).');
      return;
    }

    if (!formData.dataRecebimento) {
      alert('Por favor, preencha a data do recebimento.');
      return;
    }

    try {
      setUploading(true);

      // ✅ NOVA API: generateTrp retorna runId/status/createdAt
      const result = await generateTrp({
        dadosRecebimento: {
          // padrão: se você ainda não tem isso no form, mantém fixo por enquanto
          tipoContratacao: 'BENS',
          tipoBasePrazo: 'DATA_RECEBIMENTO',

          dataRecebimento: formData.dataRecebimento,

          // mapeamento do form antigo (NO_PRAZO/ATRASADO) -> novo (NO_PRAZO/FORA_DO_PRAZO)
          condicaoPrazo: formData.condicaoPrazo === 'ATRASADO' ? 'FORA_DO_PRAZO' : 'NO_PRAZO',

          // mapeamento do form antigo (CONFORME_EMPENHO/MENOR/MAIOR) -> novo (TOTAL/PARCIAL)
          condicaoQuantidadeOrdem:
            formData.condicaoQuantidade === 'CONFORME_EMPENHO' ? 'TOTAL' : 'PARCIAL',

          objetoFornecido: formData.objetoFornecido?.trim() || null,
          observacoesRecebimento: formData.observacoes?.trim() || null,
        },
        files: {
          // ✅ se algum estiver null, a função já ignora
          fichaContratualizacao: fichaContratualizacaoFile,
          notaFiscal: notaFiscalFile,
          ordemFornecimento: ordemFornecimentoFile,
        },
      });

      // ✅ rota do fluxo novo (resultado por runId)
      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err) {
      console.error('Erro ao criar TRP:', err);
      alert((err as any)?.message || 'Erro inesperado ao gerar o TRP.');
    } finally {
      setUploading(false);
    }
  };

  const isBusy = loading || uploading;

  return (
    <Container
      maxWidth="lg"
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '1200px', md: '1400px', lg: '1600px' },
        mx: 'auto',
        px: { xs: 3, sm: 4, md: 5, lg: 6 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
          }}
        >
          Novo TRP
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          Preencha os dados abaixo para gerar um novo Termo de Recebimento Provisório
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
        {/* ✅ TrpUploadCard do padrão novo */}
        <TrpUploadCard
          fichaContratualizacaoFile={fichaContratualizacaoFile}
          notaFiscalFile={notaFiscalFile}
          ordemFornecimentoFile={ordemFornecimentoFile}
          onFichaContratualizacaoChange={setFichaContratualizacaoFile}
          onNotaFiscalChange={setNotaFiscalFile}
          onOrdemFornecimentoChange={setOrdemFornecimentoFile}
          disabled={isBusy}
        />

        {/* ⚠️ seu form antigo permanece, mas estamos mapeando os valores pra API nova */}
        <TrpRecebimentoForm data={formData} onChange={setFormData} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        {isBusy ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Aguarde... a IA está analisando os documentos
            </Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<PsychologyIcon />}
            onClick={handleSubmit}
            disabled={
              (!fichaContratualizacaoFile && !notaFiscalFile && !ordemFornecimentoFile) ||
              !formData.dataRecebimento
            }
            sx={{
              py: 2,
              px: 5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Gerar TRP com IA
          </Button>
        )}
      </Box>
    </Container>
  );
};

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
import { uploadFile } from '../../../services/api';
import { DadosRecebimento } from '../types/trp.types';

const initialFormData: DadosRecebimento = {
  dataRecebimento: '',
  condicaoPrazo: 'NO_PRAZO',
  condicaoQuantidade: 'CONFORME_EMPENHO',
  observacoes: '',
};

export const TrpNewPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { createTrp, loading, error } = useTrpApi();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<DadosRecebimento>(initialFormData);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    if (!formData.dataRecebimento) {
      alert('Por favor, preencha a data do recebimento');
      return;
    }

    try {
      setUploading(true);
      const uploadResponse = await uploadFile(selectedFile);
      const trpResponse = await createTrp({
        fileId: uploadResponse.fileId,
        dadosRecebimento: formData,
      });
      navigate(`/agents/trp/${trpResponse.id}`);
    } catch (err) {
      console.error('Erro ao criar TRP:', err);
    } finally {
      setUploading(false);
    }
  };

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
        <TrpUploadCard
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
        <TrpRecebimentoForm data={formData} onChange={setFormData} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        {loading || uploading ? (
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
            disabled={!selectedFile || !formData.dataRecebimento}
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


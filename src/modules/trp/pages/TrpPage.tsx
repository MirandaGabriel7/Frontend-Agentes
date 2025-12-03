import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  alpha,
  useTheme,
  Button,
} from '@mui/material';
import { TrpUploadCard } from '../components/TrpUploadCard';
import { TrpFormCard } from '../components/TrpFormCard';
import { TrpActionsBar } from '../components/TrpActionsBar';
import { TrpResultPanel } from '../components/TrpResultPanel';
import { TrpHistoryCard, TrpHistoryItem } from '../components/TrpHistoryCard';
import { useTrpAgent } from '../hooks/useTrpAgent';

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    form,
    setForm,
    currentRun,
    isExecuting,
    error,
    executeAgent,
    resetCurrent,
  } = useTrpAgent();

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setForm(prev => ({ ...prev, arquivoTdrNome: file.name }));
    } else {
      setForm(prev => ({ ...prev, arquivoTdrNome: '' }));
    }
  };

  const canExecute = Boolean(selectedFile && form.data_recebimento_nf_real);

  /**
   * Retorna os itens do histórico
   * Busca do serviço e adiciona o resultado atual se existir
   */
  const getHistoryItems = (): TrpHistoryItem[] => {
    const items: TrpHistoryItem[] = [];

    // Adiciona o resultado atual se existir
    if (currentRun && currentRun.status === 'COMPLETED' && currentRun.output) {
      items.push({
        id: currentRun.id,
        fileName: selectedFile?.name || currentRun.output.meta.fileName || 'TRP_Gerado.pdf',
        contractNumber: currentRun.output.campos_trp_normalizados.numero_contrato || undefined,
        invoiceNumber: currentRun.output.campos_trp_normalizados.numero_nf || undefined,
        status: 'completed',
        createdAt: currentRun.createdAt,
        totalValue: currentRun.output.campos_trp_normalizados.valor_efetivo_numero || undefined,
      });
    }

    // Adiciona outros TRPs do histórico (do serviço)
    // TODO: Integrar com API real para buscar todos os TRPs
    // Por enquanto, adiciona itens mockados apenas se não houver resultado atual
    if (items.length === 0) {
      items.push(
        {
          id: 'mock-1',
          fileName: 'TRP_Contrato_12345.pdf',
          contractNumber: '12345/2024',
          invoiceNumber: 'NF-001234',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          totalValue: 125000.50,
        },
        {
          id: 'mock-2',
          fileName: 'TRP_Obra_11B.pdf',
          contractNumber: '11B/2024',
          invoiceNumber: 'NF-005678',
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
          totalValue: 85000.00,
        }
      );
    }

    return items;
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1000px', lg: '1100px' },
        mx: 'auto',
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          Novo Termo de Recebimento Provisório
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '1rem',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Preencha os dados abaixo para gerar um novo TRP com assistência da nossa IA.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, mb: 4 }}>
        <TrpUploadCard
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          fileName={form.arquivoTdrNome}
          onFileNameChange={(name) => setForm(prev => ({ ...prev, arquivoTdrNome: name }))}
        />
        <TrpFormCard
          value={form}
          onChange={(next) => setForm(() => next)}
          disabled={isExecuting}
        />
      </Box>

      <TrpActionsBar
        onExecute={executeAgent}
        onReset={() => {
          resetCurrent();
          setSelectedFile(null);
        }}
        isExecuting={isExecuting}
        canExecute={canExecute}
      />

      {currentRun && currentRun.status === 'COMPLETED' && (
        <Box sx={{ mt: 6 }}>
          <TrpResultPanel run={currentRun} />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/agents/trp/resultado/${currentRun.id}`)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
              }}
            >
              Ver Resultado Completo
            </Button>
          </Box>
        </Box>
      )}

      {/* Histórico de TRPs */}
      {!isExecuting && (
        <Box sx={{ mt: 6 }}>
          <TrpHistoryCard
            items={getHistoryItems()}
            onView={(id) => {
              navigate(`/agents/trp/resultado/${id}`);
            }}
            onDownload={(id) => {
              // TODO: Implementar download
              console.log('Baixar TRP:', id);
            }}
          />
        </Box>
      )}
    </Box>
  );
};


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Grid,
  Chip,
  alpha,
  useTheme,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { TrpMarkdownView } from '../components/TrpMarkdownView';
import { TrpInfoSidebar } from '../components/TrpInfoSidebar';
import { useTrpApi } from '../hooks/useTrpApi';
import { TrpRunResponse, TrpStatus } from '../types/trp.types';

const getStatusColor = (status: TrpStatus, theme: any) => {
  switch (status) {
    case 'CONCLUÍDO':
      return {
        bg: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        border: alpha(theme.palette.success.main, 0.2),
        label: 'Concluído',
      };
    case 'EM_PROCESSAMENTO':
      return {
        bg: alpha(theme.palette.warning.main, 0.1),
        color: theme.palette.warning.main,
        border: alpha(theme.palette.warning.main, 0.2),
        label: 'Em Processamento',
      };
    case 'ERRO':
      return {
        bg: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
        border: alpha(theme.palette.error.main, 0.2),
        label: 'Erro',
      };
    default:
      return {
        bg: alpha(theme.palette.text.secondary, 0.1),
        color: theme.palette.text.secondary,
        border: alpha(theme.palette.text.secondary, 0.2),
        label: 'Pendente',
      };
  }
};

export const TrpDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { getTrpById, loading, error } = useTrpApi();
  const [trp, setTrp] = useState<TrpRunResponse | null>(null);

  useEffect(() => {
    if (id) {
      const fetchTrp = async () => {
        try {
          const data = await getTrpById(id);
          setTrp(data);
        } catch (err) {
          console.error('Erro ao carregar TRP:', err);
        }
      };
      fetchTrp();
    }
  }, [id]);

  const handleCopyMarkdown = () => {
    if (trp) {
      navigator.clipboard.writeText(trp.documento_markdown || '');
      alert('Markdown copiado para a área de transferência!');
    }
  };

  const handleDownloadPDF = () => {
    // Implementar download de PDF
    alert('Funcionalidade de download em desenvolvimento');
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '1200px', md: '1400px', lg: '1600px' },
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5, lg: 6 },
          py: { xs: 4, sm: 5, md: 6 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Carregando TRP...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !trp) {
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
        <Alert severity="error">Erro ao carregar TRP: {error || 'TRP não encontrado'}</Alert>
      </Container>
    );
  }

  const statusColors = getStatusColor(trp.status, theme);
  const campos = trp.campos;

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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/agents/trp')}
        sx={{
          mb: 3,
          textTransform: 'none',
          color: theme.palette.text.secondary,
        }}
      >
        Voltar
      </Button>

      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
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
            TRP – {campos.numero_contrato}
          </Typography>
          <Chip
            label={statusColors.label}
            sx={{
              bgcolor: statusColors.bg,
              color: statusColors.color,
              border: `1px solid ${statusColors.border}`,
              fontWeight: 600,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Baixar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyMarkdown}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Copiar Markdown
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <TrpMarkdownView content={trp.documento_markdown || ''} />
        </Grid>
        <Grid item xs={12} md={5}>
          <TrpInfoSidebar data={trp} />
        </Grid>
      </Grid>
    </Container>
  );
};


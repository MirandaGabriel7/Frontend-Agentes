import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TrpTable } from '../components/TrpTable';
import { useTrpApi } from '../hooks/useTrpApi';
import { TrpListItem } from '../types/trp.types';

export const TrpListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { listTrps, loading } = useTrpApi();
  const [trps, setTrps] = useState<TrpListItem[]>([]);

  useEffect(() => {
    const fetchTrps = async () => {
      try {
        const data = await listTrps();
        setTrps(data);
      } catch (error) {
        console.error('Erro ao carregar TRPs:', error);
      }
    };
    fetchTrps();
  }, []);

  const handleViewDetails = (id: string) => {
    navigate(`/agents/trp/${id}`);
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
          Termo de Recebimento Provisório (TRP)
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 4,
          }}
        >
          Geração automática de termos a partir de documentos fiscais e contratuais.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/agents/trp/novo')}
          sx={{
            py: 1.5,
            px: 3,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Novo TRP
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TrpTable items={trps} onViewDetails={handleViewDetails} />
      )}
    </Container>
  );
};


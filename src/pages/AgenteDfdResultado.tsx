import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Alert,
  Skeleton,
} from '@mui/material';
import { useMockDfdAnalysis } from '../modules/dfd/hooks/useMockDfdAnalysis';
import { DfdResultHeader } from '../modules/dfd/components/DfdResultHeader';
import { DfdOverviewCard } from '../modules/dfd/components/DfdOverviewCard';
import { DfdHighlights } from '../modules/dfd/components/DfdHighlights';
import { DfdGroupsGrid } from '../modules/dfd/components/DfdGroupsGrid';
import { DfdGlobalSummary } from '../modules/dfd/components/DfdGlobalSummary';
import { DfdMetaBar } from '../modules/dfd/components/DfdMetaBar';

export const AgenteDfdResultado: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { analysis, isLoading, hasError } = useMockDfdAnalysis(id);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 4, sm: 5, md: 6 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 4 }} />
        </Box>
      </Box>
    );
  }

  if (hasError || !analysis) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 4, sm: 5, md: 6 },
        }}
      >
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Não foi possível carregar a análise. Tente novamente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
        mx: 'auto',
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Cabeçalho */}
        <DfdResultHeader analysis={analysis} />

        {/* Visão Geral */}
        <DfdOverviewCard overview={analysis.overview} />

        {/* Destaques */}
        <DfdHighlights destaques={analysis.destaques} />

        {/* Grupos de Regras */}
        <DfdGroupsGrid grupos={analysis.grupos} />

        {/* Resumo Numérico Global */}
        <DfdGlobalSummary overview={analysis.overview} />

        {/* Barra de Metadados e Ações */}
        <DfdMetaBar meta={analysis.meta} analysis={analysis} />
      </Box>
    </Box>
  );
};

export default AgenteDfdResultado;


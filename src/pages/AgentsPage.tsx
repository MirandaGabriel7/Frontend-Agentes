import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Box,
} from '@mui/material';

export const AgentsPage = () => {
  const navigate = useNavigate();

  const agents = [
    {
      id: 'dfd',
      title: 'Analisador de DFD',
      description: 'Auditoria automática do Documento de Formalização da Demanda (DFD) com base em regras estruturadas.',
      status: 'Em construção',
      statusColor: 'warning' as const,
      route: '/agents/dfd',
    },
    {
      id: 'trp',
      title: 'Termo de Recebimento Provisório (TRP)',
      description: 'Gera o TRP a partir da Ficha de Contratualização, Nota Fiscal e Ordem de Fornecimento.',
      status: 'Ativo',
      statusColor: 'success' as const,
      route: '/agents/trp',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Portal de Agentes de IA
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Selecione um agente para começar:
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} key={agent.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(agent.route)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h5" component="h2">
                    {agent.title}
                  </Typography>
                  <Chip
                    label={agent.status}
                    color={agent.statusColor}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {agent.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(agent.route);
                  }}
                >
                  Abrir agente
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};


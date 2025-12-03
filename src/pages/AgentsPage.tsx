import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Paper,
  Avatar,
  Container,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BoltIcon from '@mui/icons-material/Bolt';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';

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
      icon: <AssessmentIcon />,
      tags: ['Análise', 'Planejamento', 'DFD'],
      disabled: false,
    },
    {
      id: 'trp',
      title: 'Termo de Recebimento Provisório (TRP)',
      description: 'Gera o TRP a partir da Ficha de Contratualização, Nota Fiscal e Ordem de Fornecimento.',
      status: 'Ativo',
      statusColor: 'success' as const,
      route: '/agents/trp',
      icon: <ReceiptLongIcon />,
      tags: ['Execução', 'Recebimento', 'Contratos'],
      disabled: false,
    },
  ];

  const stats = [
    {
      label: 'Agentes ativos',
      value: '1',
      icon: <BoltIcon />,
      color: 'success',
    },
    {
      label: 'Em construção',
      value: '1',
      icon: <BuildIcon />,
      color: 'warning',
    },
    {
      label: 'Execuções recentes',
      value: 'Em breve',
      icon: <HistoryIcon />,
      color: 'info',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1877F2 0%, #105BBE 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label="PLANCO IA" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label="Beta" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Portal de Agentes de IA
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px' }}>
              Selecione um agente para analisar documentos ou gerar termos automaticamente.
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {agents.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              agentes disponíveis
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Agents Grid */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Agentes Disponíveis
      </Typography>
      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} md={6} key={agent.id}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: agent.statusColor === 'success' ? 'success.main' : 'warning.main',
                      width: 56,
                      height: 56,
                    }}
                  >
                    {agent.icon}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {agent.title}
                  </Typography>
                }
                subheader={
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {agent.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                }
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {agent.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Chip
                    label={agent.status}
                    color={agent.statusColor}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(agent.route)}
                  disabled={agent.disabled}
                  sx={{ flexGrow: 1 }}
                >
                  Abrir agente
                </Button>
                <Button
                  variant="text"
                  size="small"
                  disabled
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Ver detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

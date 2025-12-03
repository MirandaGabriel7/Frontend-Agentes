import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Chip,
  Button,
  Box,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import SavingsIcon from '@mui/icons-material/Savings';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import AddTaskIcon from '@mui/icons-material/AddTask';
import SchemaIcon from '@mui/icons-material/Schema';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export const AgentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const stats = [
    {
      label: 'Documentos Analisados',
      value: '1.284',
      change: '+12% vs. mês anterior',
      icon: <WysiwygIcon />,
      gradient: 'linear-gradient(135deg, #1877F2 0%, #22D3EE 100%)',
    },
    {
      label: 'Economia Potencial',
      value: 'R$ 4.2M',
      change: '+R$ 350k vs. mês anterior',
      icon: <SavingsIcon />,
      gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    },
    {
      label: 'Taxa de Acerto',
      value: '99.7%',
      change: '+0.2% vs. mês anterior',
      icon: <TaskAltIcon />,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    },
  ];

  const agents = [
    {
      id: 'dfd',
      title: 'Agente DFD',
      subtitle: 'Diagrama de Fluxo de Documentos',
      description: 'Analisa e valida a estrutura e o fluxo de documentos técnicos para garantir conformidade e integridade.',
      status: 'Online',
      statusColor: 'success',
      route: '/agents/dfd',
      icon: <SchemaIcon />,
      gradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
      borderGradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.3) 0%, rgba(34, 211, 238, 0.3) 100%)',
    },
    {
      id: 'trp',
      title: 'Agente TRP',
      subtitle: 'Termo de Recebimento Provisório',
      description: 'Verifica a conformidade de Termos de Recebimento Provisório com as normas e especificações do edital.',
      status: 'Em Análise',
      statusColor: 'warning',
      route: '/agents/trp',
      icon: <ReceiptLongIcon />,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
      borderGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.3) 100%)',
    },
  ];

  const activities = [
    {
      title: 'Relatório DFD concluído',
      file: 'Projeto_Final_v3.pdf',
      description: 'Análise concluída com sucesso. Nenhuma inconsistência crítica encontrada.',
      time: '2 horas atrás',
      icon: <CheckCircleIcon />,
      color: 'success',
    },
    {
      title: 'Análise TRP iniciada',
      file: 'TRP_Obra_11B.docx',
      description: 'Verificando cláusulas e conformidade com o edital.',
      time: '5 horas atrás',
      icon: <SyncIcon />,
      color: 'warning',
    },
    {
      title: 'Análise DFD agendada',
      file: 'Esquema_Infra_v4.pdf',
      description: 'Documento adicionado à fila de processamento.',
      time: '1 dia atrás',
      icon: <AddTaskIcon />,
      color: 'primary',
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1200px', lg: '1400px' },
        mx: 'auto',
      }}
    >
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: { xs: 'left', sm: 'center' } }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 1.5,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #0F172A 0%, #1877F2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Dashboard Premium
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.0625rem',
            maxWidth: '600px',
            mx: { xs: 0, sm: 'auto' },
          }}
        >
          Análise de performance e insights dos Agentes de IA.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6, justifyContent: 'center' }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: stat.gradient,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    background: stat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0px 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Box sx={{ color: 'white' }}>{stat.icon}</Box>
                </Box>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1.5 }}>
                {stat.label}
              </Typography>
              <Chip
                label={stat.change}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Agents Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 4,
            letterSpacing: '-0.01em',
          }}
        >
          Agentes Disponíveis
        </Typography>
        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {agents.map((agent) => (
            <Grid item xs={12} lg={6} key={agent.id}>
              <Paper
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 4,
                  p: 5,
                  background: agent.gradient,
                  border: `1.5px solid`,
                  borderImage: `${agent.borderGradient} 1`,
                  boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.06), 0px 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0px 16px 48px rgba(0, 0, 0, 0.12), 0px 4px 16px rgba(0, 0, 0, 0.08)',
                    '& .agent-glow': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Box
                  className="agent-glow"
                  sx={{
                    position: 'absolute',
                    right: -100,
                    top: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: agent.borderGradient,
                    filter: 'blur(80px)',
                    opacity: 0.3,
                    transition: 'opacity 0.3s ease',
                    zIndex: 0,
                  }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ color: 'primary.main', fontSize: 32 }}>{agent.icon}</Box>
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          mb: 0.5,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {agent.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {agent.subtitle}
                      </Typography>
                    </Box>
                    <Chip
                      label={agent.status}
                      size="small"
                      icon={
                        agent.statusColor === 'success' ? (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`,
                              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                '50%': { opacity: 0.7, transform: 'scale(1.1)' },
                              },
                            }}
                          />
                        ) : (
                          <SyncIcon
                            sx={{
                              fontSize: 14,
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                to: { transform: 'rotate(360deg)' },
                              },
                            }}
                          />
                        )
                      }
                      sx={{
                        bgcolor: alpha(
                          agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                          0.15
                        ),
                        border: `1px solid ${alpha(
                          agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                          0.3
                        )}`,
                        color: agent.statusColor === 'success' ? 'success.main' : 'warning.main',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        height: 28,
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      mb: 4,
                      lineHeight: 1.7,
                      fontSize: '0.9375rem',
                    }}
                  >
                    {agent.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(agent.route)}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: `0px 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: `0px 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Iniciar Análise
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: alpha(theme.palette.divider, 0.3),
                        color: 'text.secondary',
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        bgcolor: alpha('#FFFFFF', 0.5),
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: alpha('#FFFFFF', 0.8),
                          color: 'primary.main',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Ver Relatórios
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Activities */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 4,
            letterSpacing: '-0.01em',
          }}
        >
          Atividades Recentes
        </Typography>
        <Paper
          sx={{
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
            overflow: 'hidden',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)',
            maxWidth: { xs: '100%', md: '800px' },
            mx: 'auto',
          }}
        >
          <List sx={{ p: 1 }}>
            {activities.map((activity, index) => (
              <ListItem
                key={index}
                sx={{
                  borderRadius: 3,
                  mb: 0.5,
                  px: 3,
                  py: 2.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: alpha(
                        activity.color === 'success'
                          ? theme.palette.success.main
                          : activity.color === 'warning'
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.1
                      ),
                      border: `2px solid ${alpha(
                        activity.color === 'success'
                          ? theme.palette.success.main
                          : activity.color === 'warning'
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.2
                      )}`,
                      width: 48,
                      height: 48,
                      boxShadow: `0px 4px 12px ${alpha(
                        activity.color === 'success'
                          ? theme.palette.success.main
                          : activity.color === 'warning'
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.2
                      )}`,
                    }}
                  >
                    <Box
                      sx={{
                        color:
                          activity.color === 'success'
                            ? 'success.main'
                            : activity.color === 'warning'
                            ? 'warning.main'
                            : 'primary.main',
                      }}
                    >
                      {activity.icon}
                    </Box>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                      {activity.title}{' '}
                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        - {activity.file}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {activity.description}
                    </Typography>
                  }
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.8125rem',
                    ml: 2,
                    fontWeight: 500,
                  }}
                >
                  {activity.time}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

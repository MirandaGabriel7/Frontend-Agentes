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
  Divider,
  alpha,
  useTheme,
  keyframes,
  Container,
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
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { GlowCard } from '../components/ui/GlowCard';

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    filter: blur(20px);
  }
  50% {
    opacity: 1;
    filter: blur(30px);
  }
`;

const neuralPulse = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
`;

export const AgentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const stats = [
    {
      label: 'Documentos Processados',
      value: '1.284',
      change: '+12%',
      changeType: 'up',
      icon: <WysiwygIcon />,
      gradient: 'linear-gradient(135deg, #1877F2 0%, #22D3EE 100%)',
      glowColor: '#1877F2',
    },
    {
      label: 'Economia Gerada',
      value: 'R$ 4.2M',
      change: '+R$ 350k',
      changeType: 'up',
      icon: <SavingsIcon />,
      gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      glowColor: '#10B981',
    },
    {
      label: 'Precisão IA',
      value: '99.7%',
      change: '+0.2%',
      changeType: 'up',
      icon: <TaskAltIcon />,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      glowColor: '#8B5CF6',
    },
    {
      label: 'Conformidade Legal',
      value: '92%',
      change: '+1.2%',
      changeType: 'up',
      icon: <CheckCircleIcon />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      glowColor: '#F59E0B',
    },
  ];

  const agents = [
    {
      id: 'dfd',
      title: 'Agente DFD',
      subtitle: 'Auditoria Automatizada',
      description: 'Analisa e valida a estrutura e o fluxo de documentos técnicos para garantir conformidade e integridade com inteligência artificial avançada.',
      status: 'Online',
      statusColor: 'success',
      route: '/agents/dfd',
      icon: <SchemaIcon />,
      gradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)',
      borderGradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.4) 0%, rgba(34, 211, 238, 0.3) 100%)',
      iconGradient: 'linear-gradient(135deg, #1877F2 0%, #22D3EE 100%)',
    },
    {
      id: 'trp',
      title: 'Agente TRP',
      subtitle: 'Termos Automáticos',
      description: 'Verifica a conformidade de Termos de Recebimento Provisório com as normas e especificações do edital usando processamento de linguagem natural.',
      status: 'Em Análise',
      statusColor: 'warning',
      route: '/agents/trp',
      icon: <ReceiptLongIcon />,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%)',
      borderGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(251, 191, 36, 0.3) 100%)',
      iconGradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
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
      status: 'concluído',
    },
    {
      title: 'Análise TRP iniciada',
      file: 'TRP_Obra_11B.docx',
      description: 'Verificando cláusulas e conformidade com o edital.',
      time: '5 horas atrás',
      icon: <SyncIcon />,
      color: 'warning',
      status: 'em análise',
    },
    {
      title: 'Análise DFD agendada',
      file: 'Esquema_Infra_v4.pdf',
      description: 'Documento adicionado à fila de processamento.',
      time: '1 dia atrás',
      icon: <AddTaskIcon />,
      color: 'primary',
      status: 'agendado',
    },
  ];

  return (
    <Container
      maxWidth="xl"
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '1200px', md: '1400px', lg: '1600px' },
        mx: 'auto',
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          mb: 8,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse 40% 60% at 50% 50%, ${alpha('#1877F2', 0.15)} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            animation: `${glowPulse} 4s ease-in-out infinite`,
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '-30%',
            right: '10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse 30% 50% at 50% 50%, ${alpha('#22D3EE', 0.12)} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animation: `${neuralPulse} 3s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
              fontWeight: 900,
              letterSpacing: '-0.04em',
              mb: 2,
              lineHeight: 1.1,
              background: `linear-gradient(180deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Plataforma Global de Agentes de IA para Licitações
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 600,
              color: 'text.secondary',
              mb: 3,
              letterSpacing: '-0.01em',
            }}
          >
            Automação Inteligente · Conformidade 14.133 · Auditoria em Alta Precisão
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              color: 'text.secondary',
              fontSize: '1.125rem',
              lineHeight: 1.8,
              mb: 4,
            }}
          >
            Infraestrutura avançada que integra agentes de inteligência artificial para análise documental, verificação de conformidade e otimização completa dos processos de compras públicas.
          </Typography>
        </Box>
      </Box>

      {/* KPI Metrics */}
      <Grid container spacing={3} sx={{ mb: 8, justifyContent: 'center' }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
                backdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `0 8px 32px ${alpha('#000', 0.06)}, 0 2px 8px ${alpha('#000', 0.04)}, inset 0 1px 0 ${alpha('#FFF', 0.8)}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 16px 48px ${alpha(stat.glowColor, 0.2)}, 0 4px 16px ${alpha('#000', 0.08)}, inset 0 1px 0 ${alpha('#FFF', 0.9)}`,
                  borderColor: alpha(stat.glowColor, 0.3),
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: stat.gradient,
                  borderRadius: '4px 4px 0 0',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    background: stat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${alpha(stat.glowColor, 0.3)}, inset 0 1px 0 ${alpha('#FFF', 0.2)}`,
                    animation: `${floatAnimation} 3s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <Box sx={{ color: 'white', fontSize: 28 }}>{stat.icon}</Box>
                </Box>
                {stat.changeType === 'up' ? (
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 24 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', fontSize: 24 }} />
                )}
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: 'text.primary',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  mb: 1.5,
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  mb: 2,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {stat.label}
              </Typography>
              <Chip
                label={stat.change}
                size="small"
                icon={stat.changeType === 'up' ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: stat.changeType === 'up' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                  color: stat.changeType === 'up' ? 'success.main' : 'error.main',
                  border: `1px solid ${stat.changeType === 'up' ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.2)}`,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 26,
                  '& .MuiChip-icon': {
                    color: stat.changeType === 'up' ? 'success.main' : 'error.main',
                  },
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Agents Section */}
      <Box sx={{ mb: 8 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 5,
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          Agentes de IA Disponíveis
        </Typography>
        <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
          {agents.map((agent) => (
            <Grid size={{ xs: 12, lg: 6 }} key={agent.id}>
              <GlowCard
                glowColor={agent.id === 'dfd' ? 'blue' : 'orange'}
                customSize
                sx={{
                  width: '100%',
                  minHeight: '400px',
                  background: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
                  p: 5,
                  borderRadius: 5,
                  position: 'relative',
                  overflow: 'hidden',
                  '--backdrop': alpha(theme.palette.text.primary, 0.08),
                  '--backup-border': alpha(theme.palette.divider, 0.2),
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 4,
                          background: `linear-gradient(135deg, ${alpha('#FFF', 0.25)} 0%, ${alpha('#FFF', 0.15)} 100%)`,
                          backdropFilter: 'blur(20px)',
                          border: `1.5px solid ${alpha('#FFF', 0.3)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                          boxShadow: `0 8px 32px ${alpha('#000', 0.1)}, inset 0 1px 0 ${alpha('#FFF', 0.3)}`,
                          animation: `${floatAnimation} 4s ease-in-out infinite`,
                        }}
                      >
                        <Box sx={{ background: agent.iconGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 40 }}>
                          {agent.icon}
                        </Box>
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          color: 'text.primary',
                          mb: 0.5,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {agent.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
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
                              boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.8)}`,
                              animation: `${glowPulse} 2s ease-in-out infinite`,
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
                        border: `1.5px solid ${alpha(
                          agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                          0.3
                        )}`,
                        color: agent.statusColor === 'success' ? 'success.main' : 'warning.main',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        height: 32,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 4px 12px ${alpha(
                          agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                          0.2
                        )}`,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      mb: 4,
                      lineHeight: 1.8,
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
                      startIcon={<PsychologyIcon />}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 1.75,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}, inset 0 1px 0 ${alpha('#FFF', 0.2)}`,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}, inset 0 1px 0 ${alpha('#FFF', 0.3)}`,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                        py: 1.75,
                        borderRadius: 2.5,
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        bgcolor: alpha('#FFFFFF', 0.6),
                        backdropFilter: 'blur(20px)',
                        borderWidth: '1.5px',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: alpha('#FFFFFF', 0.9),
                          color: 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Ver Relatórios
                    </Button>
                  </Box>
                </Box>
              </GlowCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* AI Activity Timeline */}
      <Box>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 5,
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          Timeline de Atividades
        </Typography>
        <Paper
          sx={{
            borderRadius: 5,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
            backdropFilter: 'blur(20px) saturate(180%)',
            overflow: 'hidden',
            boxShadow: `0 8px 32px ${alpha('#000', 0.06)}, 0 2px 8px ${alpha('#000', 0.04)}, inset 0 1px 0 ${alpha('#FFF', 0.8)}`,
            maxWidth: { xs: '100%', md: '900px' },
            mx: 'auto',
          }}
        >
          <List sx={{ p: 2 }}>
            {activities.map((activity, index) => (
              <Box key={index}>
                <ListItem
                  sx={{
                    borderRadius: 3,
                    mb: 1,
                    px: 4,
                    py: 3,
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateX(8px)',
                      '& .timeline-line': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <Box
                      className="timeline-line"
                      sx={{
                        position: 'absolute',
                        left: 48,
                        top: 64,
                        bottom: -16,
                        width: 2,
                        background: `linear-gradient(180deg, ${alpha(theme.palette.divider, 0.3)} 0%, transparent 100%)`,
                        opacity: 0.3,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                  )}
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(
                          activity.color === 'success'
                            ? theme.palette.success.main
                            : activity.color === 'warning'
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                          0.15
                        ),
                        border: `2.5px solid ${alpha(
                          activity.color === 'success'
                            ? theme.palette.success.main
                            : activity.color === 'warning'
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                          0.3
                        )}`,
                        width: 56,
                        height: 56,
                        boxShadow: `0 8px 24px ${alpha(
                          activity.color === 'success'
                            ? theme.palette.success.main
                            : activity.color === 'warning'
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                          0.25
                        )}, inset 0 1px 0 ${alpha('#FFF', 0.3)}`,
                        position: 'relative',
                        zIndex: 2,
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
                          fontSize: 28,
                        }}
                      >
                        {activity.icon}
                      </Box>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1rem' }}>
                          {activity.title}
                        </Typography>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.875rem' }}>
                          - {activity.file}
                        </Typography>
                        <Chip
                          label={activity.status}
                          size="small"
                          sx={{
                            ml: 1,
                            bgcolor: alpha(
                              activity.color === 'success'
                                ? theme.palette.success.main
                                : activity.color === 'warning'
                                ? theme.palette.warning.main
                                : theme.palette.primary.main,
                              0.1
                            ),
                            color:
                              activity.color === 'success'
                                ? 'success.main'
                                : activity.color === 'warning'
                                ? 'warning.main'
                                : 'primary.main',
                            fontSize: '0.6875rem',
                            height: 20,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6 }}>
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
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activity.time}
                  </Typography>
                </ListItem>
                {index < activities.length - 1 && <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.08), mx: 4 }} />}
              </Box>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

import React from 'react';
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
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { GlowCard } from '../components/ui/GlowCard';

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.4;
    filter: blur(20px);
  }
  50% {
    opacity: 0.8;
    filter: blur(30px);
  }
`;

export const AgentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const stats = [
    {
      label: 'Documentos Processados',
      value: '1.284',
      change: '+12% vs. mês anterior',
      changeType: 'up',
      icon: <WysiwygIcon />,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      glowColor: theme.palette.primary.main,
    },
    {
      label: 'Economia Gerada',
      value: 'R$ 4.2M',
      change: '+R$ 350k vs. mês anterior',
      changeType: 'up',
      icon: <SavingsIcon />,
      gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      glowColor: '#667eea',
    },
    {
      label: 'Precisão IA',
      value: '99.7%',
      change: '+0.2% vs. mês anterior',
      changeType: 'up',
      icon: <TaskAltIcon />,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
      glowColor: theme.palette.success.main,
    },
    {
      label: 'Conformidade Legal',
      value: '92%',
      change: '+1.2% vs. mês anterior',
      changeType: 'up',
      icon: <CheckCircleIcon />,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
      glowColor: theme.palette.secondary.main,
    },
  ];

  const agents = [
    {
      id: 'dfd',
      title: 'Agente DFD',
      subtitle: 'Auditoria Automatizada',
      description: 'Analisa e valida a estrutura e o fluxo de documentos técnicos para garantir conformidade e integridade, utilizando IA avançada.',
      status: 'Online',
      statusColor: 'success',
      route: '/agents/dfd',
      icon: <AssessmentIcon />,
      iconGradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      iconBgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
      gradient: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
      borderGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha(theme.palette.primary.dark, 0.3)} 100%)`,
    },
    {
      id: 'trp',
      title: 'Agente TRP',
      subtitle: 'Termos Automáticos',
      description: 'Gera e verifica a conformidade de Termos de Recebimento Provisório com as normas e especificações do edital, acelerando processos.',
      status: 'Em Análise',
      statusColor: 'warning',
      route: '/agents/trp',
      icon: <DescriptionIcon />,
      iconGradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
      iconBgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
      gradient: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
      borderGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.4)} 0%, ${alpha(theme.palette.warning.main, 0.3)} 100%)`,
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
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: (theme) => theme.palette.background.default,
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '1200px', md: '1400px', lg: '1600px' },
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5, lg: 6 },
          py: { xs: 3, sm: 4, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 6, md: 8 },
        }}
      >
        {/* KPI Metrics */}
        <Box>
          <Grid container spacing={{ xs: 2.5, sm: 3, md: 3.5 }} sx={{ justifyContent: 'center' }}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 3.5, md: 4 },
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 4px 12px ${alpha(stat.glowColor, 0.15)}, 0 12px 32px ${alpha('#000', 0.08)}`,
                      borderColor: alpha(stat.glowColor, 0.2),
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: stat.gradient,
                      borderRadius: '3px 3px 0 0',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                    <Box
                      sx={{
                        width: { xs: 52, sm: 56 },
                        height: { xs: 52, sm: 56 },
                        borderRadius: 2.5,
                        background: stat.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 16px ${alpha(stat.glowColor, 0.25)}`,
                        animation: `${floatAnimation} 3s ease-in-out infinite`,
                        animationDelay: `${index * 0.15}s`,
                      }}
                    >
                      <Box sx={{ color: 'white', fontSize: { xs: 24, sm: 26 } }}>{stat.icon}</Box>
                    </Box>
                    {stat.changeType === 'up' ? (
                      <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 20, opacity: 0.8 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 20, opacity: 0.8 }} />
                    )}
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      mb: 1.5,
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      mb: 2,
                      fontSize: '0.8125rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Chip
                    label={stat.change}
                    size="small"
                    icon={stat.changeType === 'up' ? <TrendingUpIcon sx={{ fontSize: 12 }} /> : <TrendingDownIcon sx={{ fontSize: 12 }} />}
                    sx={{
                      bgcolor: stat.changeType === 'up' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                      color: stat.changeType === 'up' ? theme.palette.success.main : theme.palette.error.main,
                      border: `1px solid ${stat.changeType === 'up' ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.2)}`,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                      '& .MuiChip-icon': {
                        color: stat.changeType === 'up' ? theme.palette.success.main : theme.palette.error.main,
                      },
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Agents Section */}
        <Box>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: { xs: 4, md: 5 },
              letterSpacing: '-0.02em',
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Agentes de IA Disponíveis
          </Typography>
          <Grid container spacing={{ xs: 3, md: 4 }} sx={{ justifyContent: 'center' }}>
            {agents.map((agent) => (
              <Grid size={{ xs: 12, lg: 6 }} key={agent.id}>
                <GlowCard
                  glowColor={agent.id === 'dfd' ? 'blue' : 'orange'}
                  customSize
                  sx={{
                    width: '100%',
                    minHeight: { xs: '380px', md: '420px' },
                    background: theme.palette.background.paper,
                    p: { xs: 4, sm: 4.5, md: 5 },
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'visible',
                    '--backdrop': alpha(theme.palette.text.primary, 0.06),
                    '--backup-border': alpha(theme.palette.divider, 0.12),
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 4px 12px ${alpha('#000', 0.08)}, 0 16px 48px ${alpha('#000', 0.08)}`,
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header Section: Icon + Status */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                      {/* Icon Container */}
                      <Box
                        sx={{
                          width: { xs: 72, sm: 88 },
                          height: { xs: 72, sm: 88 },
                          borderRadius: 3.5,
                          background: agent.iconBgGradient || `linear-gradient(135deg, ${alpha('#FFF', 0.2)} 0%, ${alpha('#FFF', 0.1)} 100%)`,
                          backdropFilter: 'blur(20px)',
                          border: `2px solid ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.15)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: `0 8px 24px ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.12)}, inset 0 1px 0 ${alpha('#FFF', 0.5)}`,
                          animation: `${floatAnimation} 4s ease-in-out infinite`,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: `radial-gradient(circle, ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.08)} 0%, transparent 70%)`,
                            animation: `${pulseGlow} 3s ease-in-out infinite`,
                          },
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: `0 12px 32px ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.2)}, inset 0 1px 0 ${alpha('#FFF', 0.6)}`,
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': {
                              fontSize: { xs: 40, sm: 48 },
                              filter: `drop-shadow(0 2px 8px ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.25)})`,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              background: agent.iconGradient,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {agent.icon}
                          </Box>
                        </Box>
                        {/* AI Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${alpha('#FFF', 0.95)} 0%, ${alpha('#FFF', 0.85)} 100%)`,
                            backdropFilter: 'blur(12px)',
                            border: `2px solid ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.25)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha('#000', 0.12)}, inset 0 1px 0 ${alpha('#FFF', 0.8)}`,
                            zIndex: 2,
                          }}
                        >
                          <AutoAwesomeIcon
                            sx={{
                              fontSize: 14,
                              background: agent.iconGradient,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          />
                        </Box>
                      </Box>
                      
                      {/* Status Chip */}
                      <Chip
                        label={agent.status}
                        size="small"
                        icon={
                          agent.statusColor === 'success' ? (
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                bgcolor: theme.palette.success.main,
                                boxShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.7)}`,
                                animation: `${pulseGlow} 2s ease-in-out infinite`,
                              }}
                            />
                          ) : (
                            <SyncIcon
                              sx={{
                                fontSize: 13,
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
                            0.1
                          ),
                          border: `1.5px solid ${alpha(
                            agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                            0.3
                          )}`,
                          color: agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          height: 30,
                          px: 0.5,
                          '& .MuiChip-icon': {
                            color: agent.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                            marginLeft: '8px',
                          },
                        }}
                      />
                    </Box>

                    {/* Title Section */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          mb: 0.75,
                          letterSpacing: '-0.02em',
                          fontSize: { xs: '1.375rem', sm: '1.625rem' },
                          lineHeight: 1.2,
                        }}
                      >
                        {agent.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          opacity: 0.8,
                        }}
                      >
                        {agent.subtitle}
                      </Typography>
                    </Box>

                    {/* Divider */}
                    <Box
                      sx={{
                        width: '100%',
                        height: 1,
                        background: `linear-gradient(90deg, ${alpha(agent.id === 'dfd' ? theme.palette.primary.main : theme.palette.warning.main, 0.2)} 0%, transparent 100%)`,
                        mb: 3,
                      }}
                    />

                    {/* Description */}
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 4,
                        lineHeight: 1.75,
                        fontSize: '0.9375rem',
                        flexGrow: 1,
                        fontWeight: 400,
                      }}
                    >
                      {agent.description}
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 'auto', pt: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(agent.route)}
                        startIcon={<PsychologyIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          py: 1.75,
                          borderRadius: 2.5,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}, inset 0 1px 0 ${alpha('#FFF', 0.2)}`,
                          textTransform: 'none',
                          letterSpacing: '0.01em',
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}, inset 0 1px 0 ${alpha('#FFF', 0.3)}`,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        Iniciar Análise
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderColor: alpha(theme.palette.divider, 0.25),
                          color: theme.palette.text.secondary,
                          py: 1.75,
                          borderRadius: 2.5,
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          bgcolor: 'transparent',
                          borderWidth: '1.5px',
                          textTransform: 'none',
                          letterSpacing: '0.01em',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                            color: theme.palette.primary.main,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        Relatórios
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
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: { xs: 4, md: 5 },
              letterSpacing: '-0.02em',
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Atividades Recentes
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: theme.palette.background.paper,
              boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
              overflow: 'hidden',
              maxWidth: { xs: '100%', md: '900px' },
              mx: 'auto',
            }}
          >
            <List sx={{ p: 0 }}>
              {activities.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      px: { xs: 3, sm: 4 },
                      py: 3,
                      position: 'relative',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(
                            activity.color === 'success'
                              ? theme.palette.success.main
                              : activity.color === 'warning'
                              ? theme.palette.warning.main
                              : theme.palette.primary.main,
                            0.12
                          ),
                          border: `1.5px solid ${alpha(
                            activity.color === 'success'
                              ? theme.palette.success.main
                              : activity.color === 'warning'
                              ? theme.palette.warning.main
                              : theme.palette.primary.main,
                            0.2
                          )}`,
                          width: 48,
                          height: 48,
                          boxShadow: `0 2px 8px ${alpha(
                            activity.color === 'success'
                              ? theme.palette.success.main
                              : activity.color === 'warning'
                              ? theme.palette.warning.main
                              : theme.palette.primary.main,
                            0.15
                          )}`,
                        }}
                      >
                        <Box
                          sx={{
                            color:
                              activity.color === 'success'
                                ? theme.palette.success.main
                                : activity.color === 'warning'
                                ? theme.palette.warning.main
                                : theme.palette.primary.main,
                            fontSize: 24,
                          }}
                        >
                          {activity.icon}
                        </Box>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.9375rem' }}>
                            {activity.title}
                          </Typography>
                          <Typography component="span" sx={{ color: theme.palette.text.secondary, fontWeight: 400, fontSize: '0.8125rem' }}>
                            — {activity.file}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                          {activity.description}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        ml: 2,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        opacity: 0.7,
                      }}
                    >
                      {activity.time}
                    </Typography>
                  </ListItem>
                  {index < activities.length - 1 && (
                    <Divider
                      variant="inset"
                      component="li"
                      sx={{
                        ml: { xs: 20, sm: 22 },
                        borderColor: alpha(theme.palette.divider, 0.06),
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

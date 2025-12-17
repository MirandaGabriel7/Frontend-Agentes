import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Chip,
  Box,
  Paper,
  alpha,
  useTheme,
  Container,
  Tabs,
  Tab,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import HistoryIcon from '@mui/icons-material/History';

export const AgentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('dfd');
  const [inset, setInset] = useState<number>(50);
  const [onMouseDown, setOnMouseDown] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!onMouseDown) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x = 0;

    if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
    } else if ('clientX' in e) {
      x = (e as React.MouseEvent).clientX - rect.left;
    }

    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setInset(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setOnMouseDown(true);
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setOnMouseDown(false);
  };

  const tabsData = [
    {
      value: 'dfd',
      icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
      label: 'Agente DFD',
      content: {
        badge: 'Auditoria Automatizada',
        title: 'Análise Inteligente de Documentos de Formalização da Demanda',
        description: 'O Agente DFD analisa automaticamente o Documento de Formalização da Demanda, aplica as regras da Lei 14.133 e identifica falhas, riscos e pontos de melhoria no planejamento. Ele gera um parecer técnico claro, destacando o que está correto, o que precisa ser ajustado e quais ações o setor deve tomar antes de seguir com o planejamento da contratação.',
        buttonText: 'Iniciar Análise',
        route: '/agents/dfd',
        icon: <AssessmentIcon />,
      },
    },
    {
      value: 'trp',
      icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
      label: 'Agente TRP',
      content: {
        badge: 'Geração Automática',
        title: 'Termos de Recebimento Provisório com IA',
        description: 'O Agente TRP é um agente de IA especializado na leitura, interpretação e geração automática do Termo de Recebimento Provisório. Ele analisa de forma integrada a Ficha de Contratualização, a Nota Fiscal, a Ordem de Fornecimento e as informações registradas pelo fiscal, consolidando tudo em um documento oficial completo, padronizado e pronto para assinatura.',
        buttonText: 'Gerar TRP',
        route: '/agents/trp',
        icon: <DescriptionIcon />,
      },
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
          py: { xs: 4, sm: 5, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Agents Section with Tabs */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textAlign: 'center',
              mb: { xs: 8, md: 10 },
              position: 'relative',
            }}
          >
            {/* Título principal com logo */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{
                mb: 1,
              }}
            >
              <Box
                component="img"
                src="/assets/logo-icon.svg"
                alt="PLANCO"
                sx={{
                  width: { xs: 48, sm: 56, md: 64 },
                  height: { xs: 48, sm: 56, md: 64 },
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem', lg: '4rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Planco AI
              </Typography>
            </Stack>
            
            {/* Subtítulo com melhor espaçamento */}
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: '700px',
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                lineHeight: 1.7,
                fontWeight: 400,
                opacity: 0.85,
              }}
            >
              Plataforma avançada de inteligência artificial para automação de processos governamentais e análise documental.
            </Typography>
          </Box>

          <Box
            sx={{
              maxWidth: '1400px',
              mx: 'auto',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                mb: 4,
                '& .MuiTabs-flexContainer': {
                  justifyContent: 'center',
                  gap: { xs: 1, sm: 2, md: 3 },
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '0.9375rem' },
                  minHeight: 48,
                  px: { xs: 2, sm: 3, md: 4 },
                  borderRadius: 3,
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                  },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {tabsData.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                />
              ))}
            </Tabs>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                p: { xs: 4, sm: 6, md: 8 },
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                position: 'relative',
                zIndex: 1,
                overflow: 'visible',
              }}
            >
              {tabsData.map((tab) => (
                <Box
                  key={tab.value}
                  sx={{
                    display: activeTab === tab.value ? 'grid' : 'none',
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                    gap: { xs: 6, lg: 8 },
                    alignItems: 'center',
                  }}
                >
                  {/* Left: Content */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Chip
                      label={tab.content.badge}
                      variant="outlined"
                      sx={{
                        width: 'fit-content',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 28,
                        px: 1.5,
                        bgcolor: theme.palette.background.paper,
                      }}
                    />
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      {tab.content.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.9375rem', md: '1.125rem' },
                        lineHeight: 1.7,
                      }}
                    >
                      {tab.content.description}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate(tab.content.route)}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          bgcolor: theme.palette.primary.main,
                          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease-out',
                        }}
                      >
                        {tab.content.buttonText}
                      </Button>
                      {tab.value === 'trp' && (
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => navigate('/agents/trp/historico')}
                          startIcon={<HistoryIcon />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            borderColor: alpha(theme.palette.divider, 0.3),
                            color: theme.palette.text.primary,
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          Histórico
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  {/* Right: Image/Visual - Before/After Slider */}
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'visible',
                      bgcolor: 'transparent',
                      minHeight: { xs: '400px', md: '550px' },
                      height: 'auto',
                      userSelect: 'none',
                      cursor: onMouseDown ? 'ew-resize' : 'default',
                      zIndex: 10,
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                  >
                    {/* Slider Line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        bgcolor: theme.palette.background.paper,
                        zIndex: 30,
                        left: `${inset}%`,
                        ml: '-1px',
                        boxShadow: `0 0 8px ${alpha('#000', 0.2)}`,
                      }}
                    >
                      {/* Slider Handle */}
                      <IconButton
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: theme.palette.background.paper,
                          border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          zIndex: 40,
                          cursor: 'ew-resize',
                          boxShadow: `0 2px 8px ${alpha('#000', 0.15)}`,
                          '&:hover': {
                            transform: 'translate(-50%, -50%) scale(1.1)',
                            boxShadow: `0 4px 12px ${alpha('#000', 0.25)}`,
                          },
                          transition: onMouseDown ? 'none' : 'all 0.2s ease',
                        }}
                      >
                        <DragIndicatorIcon
                          sx={{
                            fontSize: 20,
                            color: theme.palette.text.secondary,
                            transform: 'rotate(90deg)',
                          }}
                        />
                      </IconButton>
                    </Box>

                    {/* Before: Documento com erros */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        clipPath: `inset(0 ${100 - inset}% 0 0)`,
                        zIndex: 15,
                        overflow: 'visible',
                        padding: 0,
                      }}
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 400 550"
                        preserveAspectRatio="xMidYMid meet"
                        sx={{
                          width: '100%',
                          height: '100%',
                          maxWidth: { xs: '280px', md: '380px' },
                          maxHeight: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
                        }}
                      >
                        {/* Documento base */}
                        <rect
                          x="20"
                          y="20"
                          width="360"
                          height="510"
                          rx="4"
                          fill="#ffffff"
                          stroke="#ff4444"
                          strokeWidth="2"
                        />
                        
                        {/* Linhas de texto simuladas */}
                        <line x1="40" y1="80" x2="360" y2="80" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="120" x2="340" y2="120" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="160" x2="370" y2="160" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="200" x2="320" y2="200" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="240" x2="350" y2="240" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="280" x2="330" y2="280" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="320" x2="360" y2="320" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="360" x2="340" y2="360" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="400" x2="370" y2="400" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="440" x2="320" y2="440" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="480" x2="350" y2="480" stroke="#d0d0d0" strokeWidth="1.5" />
                        
                        {/* X vermelho 1 */}
                        <g transform="translate(300, 100)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        
                        {/* X vermelho 2 */}
                        <g transform="translate(360, 180)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        
                        {/* X vermelho 3 */}
                        <g transform="translate(280, 260)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        
                        {/* X vermelho 4 */}
                        <g transform="translate(340, 340)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        
                        {/* X vermelho 5 */}
                        <g transform="translate(300, 420)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        
                        {/* X vermelho 6 */}
                        <g transform="translate(360, 500)">
                          <circle cx="0" cy="0" r="12" fill="#ff4444" opacity="0.15" />
                          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                      </Box>
                    </Box>

                    {/* After: Documento correto com logo PLANCO */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        clipPath: `inset(0 0 0 ${inset}%)`,
                        zIndex: 12,
                        overflow: 'visible',
                        padding: 0,
                      }}
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 400 550"
                        preserveAspectRatio="xMidYMid meet"
                        sx={{
                          width: '100%',
                          height: '100%',
                          maxWidth: { xs: '280px', md: '380px' },
                          maxHeight: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
                        }}
                      >
                        {/* Documento base */}
                        <rect
                          x="20"
                          y="20"
                          width="360"
                          height="510"
                          rx="4"
                          fill="#ffffff"
                          stroke="#4caf50"
                          strokeWidth="2"
                        />
                        
                        {/* Logo PLANCO SVG no topo direito do documento */}
                        <g transform="translate(350, 50) scale(0.05)">
                          <g transform="translate(-369.785, -458.76)">
                            <path
                              fill="#105bbe"
                              d="M725.52,581.65l-321.83,321.81c-18.73,18.75-49.09,18.75-67.82,0L14.04,581.65c-18.73-18.75-18.73-49.09,0-67.84l21.51-21.48,33.56-33.56,266.76,266.76c18.73,18.73,49.09,18.73,67.82,0l266.76-266.76,33.56,33.56,21.51,21.48c18.73,18.75,18.73,49.09,0,67.84Z"
                            />
                            <path
                              fill="#1b439b"
                              d="M704.02,492.32l-300.32,300.32c-18.73,18.73-49.09,18.73-67.82,0L35.55,492.32l33.56-33.56,266.76,266.76c18.73,18.73,49.09,18.73,67.82,0l266.76-266.76,33.56,33.56Z"
                            />
                            <path
                              fill="#1877f2"
                              d="M725.52,335.87L403.69,14.04c-18.73-18.73-49.09-18.73-67.82,0L14.04,335.87c-18.62,18.62-18.73,48.73-.33,67.47.11.11.22.24.33.35l55.07,55.07,266.76,266.76c18.73,18.73,49.09,18.73,67.82,0l266.76-266.76,55.07-55.07c.11-.11.22-.24.33-.35,18.4-18.75,18.29-48.86-.33-67.47ZM340.8,570.07c-5.89,5.91-13.56,8.99-21.29,9.25-.89.07-1.8.07-2.69,0-7.73-.26-15.4-3.35-21.29-9.25l-133.79-133.79c-12.4-12.4-12.4-32.52,0-44.95l25.24-25.22c12.4-12.43,32.54-12.43,44.95,0l86.24,86.24,189.51-189.51c12.4-12.4,32.52-12.4,44.92,0l25.24,25.24c12.4,12.4,12.4,32.52,0,44.92l-16.57,16.57-220.47,220.49Z"
                            />
                            <path
                              fill="#fdf8fb"
                              d="M577.85,333.01l-16.57,16.57-220.47,220.49c-5.89,5.91-13.56,8.99-21.29,9.25-.89.07-1.8.07-2.69,0-7.73-.26-15.4-3.35-21.29-9.25l-133.79-133.79c-12.4-12.4-12.4-32.52,0-44.95l25.24-25.22c12.4-12.43,32.54-12.43,44.95,0l86.24,86.24,189.51-189.51c12.4-12.4,32.52-12.4,44.92,0l25.24,25.24c12.4,12.4,12.4,32.52,0,44.92Z"
                            />
                          </g>
                        </g>
                        
                        {/* Linhas de texto simuladas */}
                        <line x1="40" y1="100" x2="360" y2="100" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="140" x2="340" y2="140" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="180" x2="370" y2="180" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="220" x2="320" y2="220" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="260" x2="350" y2="260" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="300" x2="330" y2="300" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="340" x2="360" y2="340" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="380" x2="340" y2="380" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="420" x2="370" y2="420" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="460" x2="320" y2="460" stroke="#d0d0d0" strokeWidth="1.5" />
                        <line x1="40" y1="500" x2="350" y2="500" stroke="#d0d0d0" strokeWidth="1.5" />
                        
                        {/* Checkmarks verdes */}
                        <g transform="translate(300, 120)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                        
                        <g transform="translate(360, 200)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                        
                        <g transform="translate(280, 280)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                        
                        <g transform="translate(340, 360)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                        
                        <g transform="translate(300, 440)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                        
                        <g transform="translate(360, 520)">
                          <circle cx="0" cy="0" r="12" fill="#4caf50" opacity="0.15" />
                          <path d="M-6 -2 L-2 2 L6 -6" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

import { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  alpha,
  Chip,
  keyframes,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchemaIcon from '@mui/icons-material/Schema';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';

const drawerWidth = 280;

const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.4;
    box-shadow: 0 0 0 0 rgba(24, 119, 242, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 8px rgba(24, 119, 242, 0);
  }
`;

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  text: string;
  icon: ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/agents' },
  { text: 'Agente DFD', icon: <SchemaIcon />, path: '/agents/dfd' },
  { text: 'Agente TRP', icon: <ReceiptLongIcon />, path: '/agents/trp' },
  { text: 'Histórico', icon: <HistoryIcon />, path: '#' },
];

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    if (path === '#') return false;
    if (path === '/agents') {
      return location.pathname === '/agents';
    }
    return location.pathname === path;
  };

  const handleNavClick = (path: string) => {
    if (path !== '#') {
      navigate(path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFBFC', 0.98)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `inset -1px 0 0 ${alpha('#000', 0.05)}`,
      }}
    >
      <Box sx={{ p: 4, pb: 3 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 900,
            fontSize: '1.5rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #1877F2 0%, #105BBE 50%, #22D3EE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative',
          }}
        >
          PLANCO
        </Typography>
      </Box>
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.08) }} />
      <List sx={{ flexGrow: 1, px: 2, py: 3 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavClick(item.path)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                px: 2.5,
                py: 1.5,
                position: 'relative',
                background: active
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
                  : 'transparent',
                border: active
                  ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  : '1px solid transparent',
                boxShadow: active
                  ? `0 0 20px ${alpha(theme.palette.primary.main, 0.15)}, inset 0 0 20px ${alpha(theme.palette.primary.main, 0.05)}`
                  : 'none',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  background: active
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.action.hover, 0.6)} 0%, ${alpha(theme.palette.action.hover, 0.4)} 100%)`,
                  borderColor: active
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.divider, 0.2),
                  transform: 'translateX(2px)',
                },
                '& .MuiListItemIcon-root': {
                  color: active ? 'primary.main' : 'text.secondary',
                  minWidth: 44,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {active && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg, #1877F2 0%, #22D3EE 100%)',
                    boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.6)}`,
                  }}
                />
              )}
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9375rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '-0.01em',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.08) }} />
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => handleNavClick('#')}
          sx={{
            borderRadius: 3,
            px: 2.5,
            py: 1.5,
            color: 'text.secondary',
            border: '1px solid transparent',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(theme.palette.action.hover, 0.6)} 0%, ${alpha(theme.palette.action.hover, 0.4)} 100%)`,
              borderColor: alpha(theme.palette.divider, 0.2),
              transform: 'translateX(2px)',
            },
            '& .MuiListItemIcon-root': {
              color: 'text.secondary',
              minWidth: 44,
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Configurações"
            primaryTypographyProps={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.85)} 0%, ${alpha('#FFFFFF', 0.75)} 100%)`,
            backdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 1px 0 ${alpha('#000', 0.02)}, inset 0 1px 0 ${alpha('#FFF', 0.8)}`,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 }, py: 1.5 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '1.125rem',
                letterSpacing: '-0.01em',
              }}
            >
              Intelligence Agents
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                label="IA Secure Cloud"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  '& .MuiChip-icon': {
                    color: 'success.main',
                  },
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: `2px solid ${theme.palette.background.paper}`,
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`,
                    animation: `${pulseGlow} 2s ease-in-out infinite`,
                  }}
                />
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 40,
                    height: 40,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  GM
                </Avatar>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            flexGrow: 1,
            backgroundColor: 'background.default',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            py: { xs: 3, sm: 4, md: 5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

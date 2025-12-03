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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchemaIcon from '@mui/icons-material/Schema';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 280;

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
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
      }}
    >
      <Box sx={{ p: 4, pb: 3 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1877F2 0%, #105BBE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}
        >
          PLANCO
        </Typography>
      </Box>
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
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
                backgroundColor: active
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
                color: active ? 'primary.main' : 'text.secondary',
                border: active
                  ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  : '1px solid transparent',
                '&:hover': {
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.action.hover, 0.5),
                  borderColor: active
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.divider, 0.2),
                },
                '& .MuiListItemIcon-root': {
                  color: active ? 'primary.main' : 'text.secondary',
                  minWidth: 44,
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9375rem',
                  fontWeight: active ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
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
              backgroundColor: alpha(theme.palette.action.hover, 0.5),
              borderColor: alpha(theme.palette.divider, 0.2),
            },
            '& .MuiListItemIcon-root': {
              color: 'text.secondary',
              minWidth: 44,
            },
            transition: 'all 0.2s ease',
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
            backgroundColor: alpha('#FFFFFF', 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.125rem',
              }}
            >
              Agentes de IA
            </Typography>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 36,
                height: 36,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              GM
            </Avatar>
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

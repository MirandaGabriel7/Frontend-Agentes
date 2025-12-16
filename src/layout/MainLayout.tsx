import { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  InputBase,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Paper,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
  { text: 'Agente DFD', icon: <AssessmentIcon />, path: '/agents/dfd' },
  { text: 'Agente TRP', icon: <DescriptionIcon />, path: '/agents/trp' },
];

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { signOut, user } = useAuth();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

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
        background: theme.palette.background.paper,
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
      }}
    >
      <Box 
        sx={{ 
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Box
          component="img"
          src="/assets/logo-icon.svg"
          alt="PLANCO"
          sx={{
            height: 28,
            width: 'auto',
          }}
        />
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '1rem',
            letterSpacing: '-0.015em',
          }}
        >
          PLANCO
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavClick(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 1.25,
                position: 'relative',
                background: active
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'transparent',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  background: active
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.action.hover, 0.04),
                },
                '& .MuiListItemIcon-root': {
                  color: active ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                },
                transition: 'all 0.2s ease',
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
                    height: 24,
                    borderRadius: '0 2px 2px 0',
                    background: theme.palette.primary.main,
                  }}
                />
              )}
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.01em',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`, p: 1.5 }}>
        <ListItemButton
          onClick={() => handleNavClick('#')}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.25,
            color: 'text.secondary',
            '&:hover': {
              background: alpha(theme.palette.action.hover, 0.04),
            },
            '& .MuiListItemIcon-root': {
              color: 'text.secondary',
              minWidth: 40,
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
              fontSize: '0.875rem',
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
          bgcolor: 'background.default',
          background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
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
            background: theme.palette.background.paper,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar 
            sx={{ 
              px: { xs: 2, sm: 3, md: 4 }, 
              py: 1,
              minHeight: { xs: 64, sm: 70 },
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {/* Center Section - Search Bar */}
            <Box
              sx={{
                flexGrow: 1,
                maxWidth: { xs: '100%', sm: '500px', md: '600px' },
                mx: { xs: 0, sm: 'auto' },
                position: 'relative',
              }}
            >
              <Paper
                component="form"
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: { xs: 38, sm: 40 },
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  background: alpha(theme.palette.action.hover, 0.02),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.divider, 0.3),
                    background: alpha(theme.palette.action.hover, 0.04),
                  },
                  '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    background: theme.palette.background.paper,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                  },
                }}
              >
                <IconButton
                  type="button"
                  sx={{
                    p: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'transparent',
                    },
                  }}
                  aria-label="search"
                >
                  <SearchIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <InputBase
                  sx={{
                    flex: 1,
                    fontSize: '0.875rem',
                    color: 'text.primary',
                    '& .MuiInputBase-input': {
                      py: 0,
                      '&::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.6,
                      },
                    },
                  }}
                  placeholder="Buscar agentes, análises, documentos..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </Paper>
            </Box>

            {/* Right Section - Notifications & Avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Notifications */}
              <IconButton
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.action.hover, 0.04),
                    color: 'text.primary',
                  },
                }}
              >
                <Badge
                  badgeContent={3}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      minWidth: 18,
                      height: 18,
                      padding: '0 4px',
                    },
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>

              {/* Avatar with Menu */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                onClick={handleMenuOpen}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: theme.palette.success.main,
                      border: `2px solid ${theme.palette.background.paper}`,
                      zIndex: 1,
                    }}
                  />
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 36,
                      height: 36,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                    }}
                  >
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </Box>
              </Box>

              {/* User Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`,
                    '& .MuiMenuItem-root': {
                      px: 2.5,
                      py: 1.25,
                      fontSize: '0.9375rem',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    },
                  },
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <AccountCircleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <Typography variant="body2">Meu Perfil</Typography>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <SettingsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <Typography variant="body2">Configurações</Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon sx={{ fontSize: 20, color: 'error.main' }} />
                  </ListItemIcon>
                  <Typography variant="body2">Sair</Typography>
                </MenuItem>
              </Menu>
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
            py: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

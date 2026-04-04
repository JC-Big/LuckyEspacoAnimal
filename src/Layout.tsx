import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PetsIcon from '@mui/icons-material/Pets';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, color: 'error' },
  { label: 'Estoque', path: '/inventory', icon: <InventoryIcon />, color: 'primary' },
  { label: 'Clientes', path: '/clients', icon: <PeopleIcon />, color: 'info' },
  { label: 'Agendamentos', path: '/appointments', icon: <CalendarMonthIcon />, color: 'secondary' },
  { label: 'Relatórios', path: '/reports', icon: <AssessmentIcon />, color: 'warning' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 44,
            height: 44,
            boxShadow: '0 4px 14px rgba(0,137,123,0.35)',
          }}
        >
          <PetsIcon sx={{ fontSize: 26 }} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'primary.dark' }}>
            Lucky Animal
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Gestão PetShop
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1.5, mt: 1, flex: 1 }}>
        {navItems.map(item => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 1.2,
                bgcolor: selected ? `${item.color}.main` : 'transparent',
                color: selected ? '#fff' : 'text.primary',
                '&:hover': {
                  bgcolor: selected ? `${item.color}.dark` : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  color: selected ? '#fff' : `${item.color}.main`,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '0.95rem' }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          © 2026 Lucky Animal
        </Typography>
      </Box>
    </Box>
  );

  const quickActions = [
    { icon: <PeopleIcon />, name: 'Novo Cliente', action: () => navigate('/clients?add=true'), color: 'info' },
    { icon: <InventoryIcon />, name: 'Novo Produto', action: () => navigate('/inventory?add=true'), color: 'primary' },
    { icon: <CalendarMonthIcon />, name: 'Novo Agendamento', action: () => navigate('/appointments?add=true'), color: 'secondary' },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'background.default', 
      maxWidth: '100vw', 
      overflowX: 'hidden',
      '@media print': {
        display: 'block',
        minHeight: 'auto',
        overflow: 'visible',
        maxWidth: '100%'
      }
    }}>
      {/* AppBar – mobile only */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'center' }}>
            <PetsIcon sx={{ color: 'primary.main', mr: 1, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: -0.5 }}>
              Lucky Animal
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer - Desktop only */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          pb: isMobile ? 12 : 4,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: '100vw',
          overflowX: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          '@media print': {
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            overflow: 'visible',
            minHeight: 'auto',
            p: 0,
            m: 0
          }
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
            '@media print': { display: 'none' }
          }} 
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={location.pathname}
            onChange={(_, newValue) => {
              navigate(newValue);
            }}
            sx={{ height: 72 }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                value={item.path}
                icon={item.icon}
                sx={{
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: `${item.color}.main`,
                    fontWeight: 700,
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Global Quick Action FAB (Mobile Only) */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Ações Rápidas"
          sx={{ 
            position: 'fixed', 
            bottom: 88, 
            right: 16,
            '@media print': { display: 'none' }
          }}
          icon={<SpeedDialIcon icon={<AddIcon />} openIcon={<ReceiptIcon />} />}
        >
          {quickActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={action.action}
              FabProps={{
                sx: {
                  bgcolor: `${action.color}.main`,
                  color: 'white',
                  '&:hover': { bgcolor: `${action.color}.dark` }
                }
              }}
            />
          ))}
        </SpeedDial>
      )}
    </Box>
  );
}

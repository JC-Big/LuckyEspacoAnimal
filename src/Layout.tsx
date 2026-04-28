import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PetsIcon from '@mui/icons-material/Pets';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { signOut } from 'firebase/auth';
import { auth } from './firebase/auth';
import { db } from './firebase/db';
import { collection, onSnapshot } from 'firebase/firestore';
import dayjs from 'dayjs';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';

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

  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubBatches = onSnapshot(collection(db, "batches"), snap => {
      setBatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubAppointments = onSnapshot(collection(db, "appointments"), snap => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubClients = onSnapshot(collection(db, "clients"), snap => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    return () => {
      unsubProducts();
      unsubBatches();
      unsubAppointments();
      unsubClients();
    };
  }, []);

  const expiredBatches = batches.filter(b => b.expirationDate && dayjs(b.expirationDate).diff(dayjs(), 'day') <= 0);
  const expiringBatches = batches.filter(b => b.expirationDate && dayjs(b.expirationDate).diff(dayjs(), 'day') > 0 && dayjs(b.expirationDate).diff(dayjs(), 'day') <= 30);
  const overdueAppointments = appointments.filter(a => {
    if (a.status !== 'agendado') return false;
    if (!a.date || !a.time) return false;
    return dayjs(`${a.date}T${a.time}`).isBefore(dayjs());
  });

  const totalNotifications = expiredBatches.length + expiringBatches.length + overdueAppointments.length;

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

      {/* Notifications Menu Item */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        <ListItemButton
          onClick={() => setNotificationsOpen(true)}
          sx={{
            borderRadius: 2,
            bgcolor: totalNotifications > 0 ? 'error.50' : 'transparent',
            color: totalNotifications > 0 ? 'error.main' : 'text.primary',
            '&:hover': {
              bgcolor: totalNotifications > 0 ? 'error.100' : 'action.hover',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: totalNotifications > 0 ? 'error.main' : 'inherit' }}>
            <Badge badgeContent={totalNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Alertas e Avisos"
            primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
          />
        </ListItemButton>
      </Box>

      {/* User Profile / Logout */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Avatar src={auth.currentUser?.photoURL || ''} sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {auth.currentUser?.displayName || 'Usuário Luck'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
            {auth.currentUser?.email || 'admin@luckyanimal.com'}
          </Typography>
        </Box>
        <IconButton size="small" color="error" title="Sair" onClick={() => signOut(auth)}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
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
      {isMobile && location.pathname === '/' && (
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

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onClose={() => setNotificationsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Central de Notificações</Typography>
          <IconButton onClick={() => setNotificationsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {totalNotifications === 0 && (
            <Typography variant="body1" textAlign="center" color="text.secondary" py={4}>
              Nenhuma notificação no momento. Tudo certo! 🎉
            </Typography>
          )}

          {expiredBatches.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'error.main', bgcolor: 'error.50' }}>
              <Typography variant="subtitle1" fontWeight={700} color="error.main" mb={1}>
                {expiredBatches.length} Produto(s) Vencido(s)
              </Typography>
              {expiredBatches.map(b => {
                const p = products.find(prod => prod.id === b.productId);
                return (
                  <Typography key={b.id} variant="body2" mb={0.5}>
                    • <b>{p?.name}</b> (Lote: {b.description || 'Único'}) — Val: {dayjs(b.expirationDate).format('DD/MM/YYYY')}
                  </Typography>
                );
              })}
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => { setNotificationsOpen(false); navigate('/inventory?filter=expired'); }}
              >
                Verificar Estoque
              </Button>
            </Paper>
          )}

          {expiringBatches.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'warning.main', bgcolor: 'warning.50' }}>
              <Typography variant="subtitle1" fontWeight={700} color="warning.main" mb={1}>
                {expiringBatches.length} Produto(s) Vencendo
              </Typography>
              {expiringBatches.map(b => {
                const p = products.find(prod => prod.id === b.productId);
                return (
                  <Typography key={b.id} variant="body2" mb={0.5}>
                    • <b>{p?.name}</b> (Lote: {b.description || 'Único'}) — Val: {dayjs(b.expirationDate).format('DD/MM/YYYY')}
                  </Typography>
                );
              })}
              <Button 
                variant="outlined" 
                color="warning" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => { setNotificationsOpen(false); navigate('/inventory?filter=expiring'); }}
              >
                Verificar Estoque
              </Button>
            </Paper>
          )}

          {overdueAppointments.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'secondary.main', bgcolor: 'secondary.50' }}>
              <Typography variant="subtitle1" fontWeight={700} color="secondary.main" mb={1}>
                {overdueAppointments.length} Agendamento(s) Pendente(s)
              </Typography>
              {overdueAppointments.map(a => {
                const c = clients.find(cli => cli.id === a.clientId);
                return (
                  <Typography key={a.id} variant="body2" mb={0.5}>
                    • <b>{c?.petName}</b> ({a.service}) — Marcado p/ {dayjs(a.date).format('DD/MM/YYYY')} às {a.time}
                  </Typography>
                );
              })}
              <Button 
                variant="outlined" 
                color="secondary" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => { setNotificationsOpen(false); navigate('/appointments?filter=overdue'); }}
              >
                Verificar Agendamentos
              </Button>
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

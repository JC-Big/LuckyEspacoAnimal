import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CardActionArea, Typography, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory2';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import dayjs from 'dayjs';
import { db } from '../firebase/db';
import { collection, getDocs } from 'firebase/firestore';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  bgColor: string;
  onClick: () => void;
}

function SummaryCard({ title, value, icon, color, bgColor, onClick }: SummaryCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${bgColor}`,
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ height: '100%', p: 0 }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color }}>
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: bgColor,
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [expiredAlertOpen, setExpiredAlertOpen] = useState(false);
  const [overdueAlertOpen, setOverdueAlertOpen] = useState(false);
  const [expiredItems, setExpiredItems] = useState<any[]>([]);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsSnap, batchesSnap, appointmentsSnap, clientsSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "batches")),
          getDocs(collection(db, "appointments")),
          getDocs(collection(db, "clients"))
        ]);

        const prods = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const bats = batchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const apps = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const clis = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        setProducts(prods);
        setBatches(bats);
        setAppointments(apps);
        setClients(clis);

        const expiredList: any[] = [];
        bats.forEach(b => {
          if (b.expirationDate && dayjs(b.expirationDate).diff(dayjs(), 'day') <= 0) {
            const p = prods.find(p => p.id === b.productId);
            if (p) expiredList.push({ product: p, batch: b });
          }
        });

        const overdueList = apps.filter(a => {
          if (a.status !== 'agendado') return false;
          if (!a.date || !a.time) return false;
          return dayjs(`${a.date}T${a.time}`).isBefore(dayjs());
        });

        setExpiredItems(expiredList);
        setOverdueItems(overdueList);

        if (!sessionStorage.getItem('dashboardAlertsShown')) {
          if (expiredList.length > 0) {
            setExpiredAlertOpen(true);
          } else if (overdueList.length > 0) {
            setOverdueAlertOpen(true);
          }
          sessionStorage.setItem('dashboardAlertsShown', 'true');
        }
      } catch (error) {
        console.error("Erro ao buscar dados do Dashboard:", error);
      }
    };
    fetchData();
  }, []);

  const handleCloseExpired = () => {
    setExpiredAlertOpen(false);
    if (overdueItems.length > 0) {
      setOverdueAlertOpen(true);
    }
  };

  const handleCloseOverdue = () => {
    setOverdueAlertOpen(false);
  };

  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');

  const totalProducts = products.length;
  const lowStock = products.filter(p => {
    const totalQty = batches
      .filter(b => b.productId === p.id)
      .reduce((sum, b) => sum + b.quantity, 0);
    return totalQty <= p.minQuantity;
  }).length;
  const expiring = products.filter(p => {
    const pBatches = batches.filter(b => b.productId === p.id && b.expirationDate);
    if (pBatches.length === 0) return false;
    const earliest = pBatches.sort((a, b) => dayjs(a.expirationDate).diff(dayjs(b.expirationDate)))[0].expirationDate;
    return dayjs(earliest).diff(dayjs(today), 'day') <= 30;
  }).length;
  const todayAppointments = appointments.filter(a => a.date === today).length;
  const totalClients = clients.length;

  const cards: SummaryCardProps[] = [
    {
      title: 'Total de Produtos',
      value: totalProducts,
      icon: <InventoryIcon sx={{ fontSize: 28 }} />,
      color: '#00897B',
      bgColor: 'rgba(0,137,123,0.12)',
      onClick: () => navigate('/inventory'),
    },
    {
      title: 'Estoque Baixo',
      value: lowStock,
      icon: <WarningIcon sx={{ fontSize: 28 }} />,
      color: '#E53935',
      bgColor: 'rgba(229,57,53,0.12)',
      onClick: () => navigate('/inventory?filter=low-stock'),
    },
    {
      title: 'Agendamentos Hoje',
      value: todayAppointments,
      icon: <CalendarTodayIcon sx={{ fontSize: 28 }} />,
      color: '#5E35B1',
      bgColor: 'rgba(94,53,177,0.12)',
      onClick: () => navigate('/appointments?filter=today'),
    },
    {
      title: 'Clientes Cadastrados',
      value: totalClients,
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: '#1E88E5',
      bgColor: 'rgba(30,136,229,0.12)',
      onClick: () => navigate('/clients'),
    },
    {
      title: 'Validade Próxima',
      value: expiring,
      icon: <WarningIcon sx={{ fontSize: 28 }} />,
      color: '#F57C00',
      bgColor: 'rgba(245,124,0,0.12)',
      onClick: () => navigate('/inventory?filter=expiring'),
    },
  ];

  return (
    <Box sx={{ mt: { xs: 2, md: 0 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Resumo geral da sua petshop
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Recent appointments section */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Próximos Agendamentos
      </Typography>
      <Grid container spacing={2}>
        {appointments
          .filter(a => a.status === 'agendado')
          .slice(0, 4)
          .map(a => {
            const client = clients.find(c => c.id === a.clientId);
            return (
              <Grid key={a.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: 'secondary.main',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                  onClick={() => navigate(`/appointments?view=${a.id}`)}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {client?.petName || 'Pet'} — {client?.name || 'Cliente'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {a.service}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600, mt: 1 }}>
                      {dayjs(a.date).format('DD/MM/YYYY')} às {a.time}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        {appointments.filter(a => a.status === 'agendado').length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'background.default', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum agendamento pendente para os próximos dias.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Expired Products Dialog */}
      <Dialog open={expiredAlertOpen} onClose={handleCloseExpired} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'error.main', color: 'white' }}>
          <Typography variant="h6" fontWeight={700}>Aviso de Vencimento</Typography>
          <IconButton color="inherit" onClick={handleCloseExpired} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, mt: 1, fontWeight: 500 }}>
            Os seguintes produtos estão vencendo hoje, ou já venceram! Favor verificar os mesmos:
          </Typography>
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {expiredItems.map((item, i) => (
              <Box key={i}>
                {i > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={<Typography fontWeight={700}>{item.product.name}</Typography>}
                    secondary={`Cód. Produto: ${item.product.shortId} | Lote: ${item.batch.description || 'Lote Único'} | Val: ${dayjs(item.batch.expirationDate).format('DD/MM/YYYY')}`}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseExpired} color="inherit">Fechar</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => {
              handleCloseExpired();
              navigate('/inventory?filter=expired');
            }}
          >
            Verificar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overdue Appointments Dialog */}
      <Dialog open={overdueAlertOpen} onClose={handleCloseOverdue} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'warning.main', color: 'white' }}>
          <Typography variant="h6" fontWeight={700}>Agendamentos Pendentes</Typography>
          <IconButton color="inherit" onClick={handleCloseOverdue} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, mt: 1, fontWeight: 500 }}>
            Alguns agendamentos já passaram da data e não foram atualizados. Favor ajustá-los para organização do sistema:
          </Typography>
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {overdueItems.map((a, i) => {
              const client = clients.find(c => c.id === a.clientId);
              return (
                <Box key={a.id}>
                  {i > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={<Typography fontWeight={700}>{client?.petName || 'Pet'} — {client?.name || 'Tutor'}</Typography>}
                      secondary={`${a.service} | Data: ${dayjs(a.date).format('DD/MM/YYYY')} às ${a.time}`}
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseOverdue} color="inherit">Fechar</Button>
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => {
              handleCloseOverdue();
              navigate('/appointments?filter=overdue');
            }}
          >
            Verificar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

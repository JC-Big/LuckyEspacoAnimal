import { db } from "../firebase/db";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  useMediaQuery,
  useTheme,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import PetsIcon from '@mui/icons-material/Pets';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import dayjs from 'dayjs';
import type { Appointment, AppointmentStatus } from '../store';

const services = [
  'Banho',
  'Tosa',
  'Banho e Tosa',
  'Consulta Veterinária',
  'Vacinação',
  'Tosa Higiênica',
  'Hidratação',
  'Corte de Unhas',
  'Limpeza de Ouvidos',
  'Escovação de Dentes',
];

const statusConfig: Record<AppointmentStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info' }> = {
  agendado: { label: 'Agendado', color: 'info' },
  concluido: { label: 'Concluído', color: 'success' },
  cancelado: { label: 'Cancelado', color: 'error' },
};

const emptyForm = { clientId: '', date: dayjs().format('YYYY-MM-DD'), time: '09:00', service: services[0] };

export default function Appointments() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewedAppointment, setViewedAppointment] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAdd();
      setSearchParams(prev => {
        prev.delete('add');
        return prev;
      });
    }
    const viewId = searchParams.get('view');
    if (viewId) {
      const app = appointments.find(a => a.id === viewId);
      if (app) setViewedAppointment(app);
      setSearchParams(prev => {
        prev.delete('view');
        return prev;
      });
    }
  }, [searchParams, appointments, setSearchParams]);

  const getClientName = (id: string) => {
    const c = clients.find(cl => cl.id === id);
    return c ? `${c.petName} (${c.name})` : '—';
  };

  const fetchAppointments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "appointments"));

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAppointments(data);

    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    }
  };

  const fetchClients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "clients"));

    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setClients(data);

  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
  }
};

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);


  const filteredAppointments = useMemo(() => {
    let list = appointments;
    const filterOverdue = searchParams.get('filter') === 'overdue';

    if (filterOverdue) {
      const now = dayjs();
      list = list.filter(a => {
        if (a.status !== 'agendado') return false;
        if (!a.date || !a.time) return false;
        return dayjs(`${a.date}T${a.time}`).isBefore(now);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const client = clients.find(cl => cl.id === a.clientId);
        return (
          client?.name.toLowerCase().includes(q) ||
          client?.petName.toLowerCase().includes(q) ||
          a.service.toLowerCase().includes(q)
        );
      });
    }

    if (tabIndex === 0)
      return list
        .filter(a => a.status === 'agendado')
        .sort((a, b) => {
          const dateA = a.date && a.time ? new Date(`${a.date}T${a.time}`).getTime() : 0;
          const dateB = b.date && b.time ? new Date(`${b.date}T${b.time}`).getTime() : 0;
          return dateA - dateB;
        });

    if (tabIndex === 1)
      return list
        .filter(a => a.status === 'concluido')
        .sort((a, b) => {
          const dateA = a.date && a.time ? new Date(`${a.date}T${a.time}`).getTime() : 0;
          const dateB = b.date && b.time ? new Date(`${b.date}T${b.time}`).getTime() : 0;
          return dateB - dateA;
        });

    if (tabIndex === 2)
      return list
        .filter(a => a.status === 'cancelado')
        .sort((a, b) => {
          const dateA = a.date && a.time ? new Date(`${a.date}T${a.time}`).getTime() : 0;
          const dateB = b.date && b.time ? new Date(`${b.date}T${b.time}`).getTime() : 0;
          return dateB - dateA;
        });

    return list;
  }, [appointments, search, tabIndex, clients]);



  const handleSave = async () => {
    if (!form.clientId) return;

    try {
      const client = clients.find(c => c.id === form.clientId);

      await addDoc(collection(db, "appointments"), {
        clientId: form.clientId,
        clientName: client?.name || "",
        petName: client?.petName || "",
        service: form.service,
        date: form.date || new Date().toISOString().split("T")[0],
        time: form.time || "00:00",
        status: "agendado",
        createdAt: new Date()
      });

      await fetchAppointments();
      setDialogOpen(false);

    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status
      });

      await fetchAppointments();

    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleOpenView = (app: Appointment) => setViewedAppointment(app);
  const handleCloseView = () => setViewedAppointment(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, "appointments", deleteId));

      await fetchAppointments();
      setDeleteId(null);

    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
};

  const viewedClient = viewedAppointment ? clients.find(c => c.id === viewedAppointment.clientId) : null;

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Agendamentos</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie banhos, tosas e consultas</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Novo Agendamento
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <Tabs
          value={tabIndex}
          onChange={(_: React.SyntheticEvent, v: number) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          textColor="secondary"
          indicatorColor="secondary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Próximos" />
          <Tab label="Concluídos" />
          <Tab label="Cancelados" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por pet, tutor ou serviço..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {filteredAppointments.map(a => {
          const client = clients.find(c => c.id === a.clientId);
          const isToday = a.date === today;
          return (
            <Card 
              key={a.id} 
              sx={{ 
                borderLeft: '6px solid', 
                borderColor: isToday ? 'secondary.main' : 'divider',
                maxWidth: '100%'
              }}
              onClick={() => handleOpenView(a)}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {client?.petName || 'Pet'}
                  </Typography>
                  <Chip 
                    label={statusConfig[a.status as keyof typeof statusConfig].label}
                    color={statusConfig[a.status as keyof typeof statusConfig].color}
                    size="small" 
                    sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {a.service}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                  <CalendarMonthIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {dayjs(a.date).format('DD/MM/YYYY')} às {a.time}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', px: 1, pb: 1, gap: 0 }}>
                {a.status === 'agendado' && (
                  <>
                    <IconButton 
                      color="success" 
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id, 'concluido'); }}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="warning" 
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id, 'cancelado'); }}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
                <IconButton
                  color="error"
                  size="small"
                  sx={{ p: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(a.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Pet / Tutor</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map(a => (
                <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenView(a)}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {dayjs(a.date).format('DD/MM/YYYY')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {getClientName(a.clientId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.service} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={statusConfig[a.status as keyof typeof statusConfig].label}
                        color={statusConfig[a.status as keyof typeof statusConfig].color} 
                        size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {a.status === 'agendado' && (
                      <>
                        <Tooltip title="Concluir">
                          <IconButton color="success" size="small" onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id, 'concluido'); }}>
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton color="warning" size="small" onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id, 'cancelado'); }}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Excluir">
                      <IconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── New Appointment Dialog ────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'secondary.main' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDialogOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                Novo Agendamento
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>Novo Agendamento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Autocomplete
            options={clients}
            fullWidth
            getOptionLabel={(c) => `${c.petName} (${c.name})`}
            value={clients.find(c => c.id === form.clientId) || null}
            onChange={(_, newValue) => setForm({ ...form, clientId: newValue ? newValue.id : '' })}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} label="Cliente" />
            )}
            noOptionsText="Nenhum cliente"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Data"
              type="date"
              fullWidth
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora"
              type="time"
              fullWidth
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Autocomplete
            options={services}
            fullWidth
            value={form.service || null}
            onChange={(_, newValue) => setForm({ ...form, service: newValue || '' })}
            renderInput={(params) => (
              <TextField {...params} label="Serviço" />
            )}
            noOptionsText="Nenhum serviço"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary">Cancelar</Button>
          <Button variant="contained" color="secondary" onClick={handleSave} disabled={!form.clientId}>
            Agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm Dialog ────────────────────── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir este agendamento?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Details Dialog ─────────────────────────────── */}
      <Dialog
        open={!!viewedAppointment}
        onClose={handleCloseView}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'secondary.main' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleCloseView} aria-label="close">
                <ArrowBackIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                Detalhes
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
          Detalhes do Agendamento
        </DialogTitle>
        {viewedAppointment && viewedClient && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '24px !important' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%', bgcolor: 'secondary.light', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'secondary.contrastText'
              }}>
                <PetsIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {viewedClient.petName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {viewedClient.petSpecies || 'Cachorro'} • Raça: {viewedClient.petBreed}
                </Typography>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Tutor</Typography>
                  <Typography variant="body2" fontWeight={600}>{viewedClient.name}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Telefone</Typography>
                  <Typography variant="body2" fontWeight={600}>{viewedClient.phone}</Typography>
                </Box>
              </Box>
              {viewedClient.addressStreet && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationOnIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Endereço</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {viewedClient.addressStreet}, {viewedClient.addressNumber} - {viewedClient.addressNeighborhood}, {viewedClient.addressCity}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarMonthIcon color="secondary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Serviço / Data</Typography>
                    <Typography variant="body1" fontWeight={700} color="secondary.main">{viewedAppointment.service}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {dayjs(viewedAppointment.date).format('DD/MM/YYYY')} às {viewedAppointment.time}
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={statusConfig[viewedAppointment.status].label} 
                  color={statusConfig[viewedAppointment.status].color} 
                  size="small" 
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Paper>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleCloseView}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

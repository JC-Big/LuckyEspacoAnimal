import { collection, getDocs, addDoc } from "firebase/firestore";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
  Avatar,
  InputAdornment,
  Snackbar,
  Alert,
  Fab,
  Paper,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PetsIcon from '@mui/icons-material/Pets';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { Client } from '../store';


const speciesList = ['Cachorro', 'Gato', 'Aves', 'Roedores', 'Outros'];

const emptyClient = {
  name: '',
  phone: '',
  petName: '',
  petSpecies: speciesList[0],
  petBreed: '',
  addressStreet: '',
  addressNumber: '',
  addressNeighborhood: '',
  addressCity: 'Campo Grande',
};

export default function Clients() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewedClient, setViewedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchClients = async () => { 
    try {
      console.log("Buscando clientes...");

      const querySnapshot = await getDocs(collection(db, "clients"));

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));

      console.log("Dados do Firebase:", data);

      setClients(data);

    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyClient);
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
  }, [searchParams, setSearchParams]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.petName.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [clients, search]);



  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({ ...client });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.petName.trim()) return;

    try {
      const clientData = {
        name: form.name,
        petName: form.petName,
        phone: form.phone,
        petSpecies: form.petSpecies,
        petBreed: form.petBreed,
        addressStreet: form.addressStreet,
        addressNumber: form.addressNumber,
        addressNeighborhood: form.addressNeighborhood,
        addressCity: form.addressCity,
      };

      if (editing) {
        const clientRef = doc(db, "clients", editing.id);
        await updateDoc(clientRef, clientData);
        showSnackbar("Cliente atualizado 🚀");
      } else {
        await addDoc(collection(db, "clients"), clientData);
        showSnackbar("Cliente adicionado 🚀");
      }
      
      setDialogOpen(false); // fecha modal imediatamente
      await fetchClients(); // atualiza lista

    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showSnackbar("Erro ao salvar cliente", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const clientRef = doc(db, "clients", deleteId);
      await deleteDoc(clientRef);
      
      showSnackbar("Cliente deletado 🗑️");
      setDeleteId(null); // fecha modal imediatamente
      await fetchClients();

    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      showSnackbar("Erro ao deletar cliente", "error");
    }
  };

  return (
    <Box sx={{ mt: { xs: 1, md: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Clientes</Typography>
          <Typography variant="body2" color="text.secondary">Cadastro de tutores e pets</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="info"
          startIcon={<AddIcon />} 
          onClick={openAdd}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Novo Cliente
        </Button>
        <IconButton
          color="info"
          onClick={openAdd}
          sx={{ 
            display: { xs: 'flex', sm: 'none' }, 
            bgcolor: 'info.main', 
            color: 'white', 
            '&:hover': { bgcolor: 'info.dark' } 
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 4, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome, pet ou telefone..."
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
      </Card>

      <Stack spacing={2} sx={{ pb: 10 }}>
        {filteredClients.map(c => (
          <Card key={c.id} onClick={() => setViewedClient(c)} sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.light', width: 50, height: 50, color: 'info.contrastText' }}>
                <PetsIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {c.petName} <Typography component="span" variant="body2" color="text.secondary">({c.petSpecies} - {c.petBreed || 'Raça não info.'})</Typography>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{c.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{c.phone}</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 1.5, justifyContent: 'flex-end' }}>
                <IconButton
                  size="medium"
                  sx={{ p: 1.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  size="medium"
                  sx={{ p: 1.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(c.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
            </CardActions>
          </Card>
        ))}
        {filteredClients.length === 0 && (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            Nenhum cliente encontrado.
          </Typography>
        )}
      </Stack>

      {/* ─── Client Dialog ──────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'info.main' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDialogOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                {editing ? 'Editar Cliente' : 'Novo Cliente'}
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
          {editing ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Dados do Dono</Typography>
          <TextField label="Nome Completo" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="Telefone" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mt: 1 }}>Dados do Pet</Typography>
          <TextField label="Nome do Pet" fullWidth value={form.petName} onChange={e => setForm({ ...form, petName: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              options={speciesList}
              fullWidth
              value={form.petSpecies || null}
              onChange={(_, newValue) => setForm({ ...form, petSpecies: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Espécie" />}
              noOptionsText="Nenhuma espécie"
            />
            <TextField label="Raça" fullWidth value={form.petBreed} onChange={e => setForm({ ...form, petBreed: e.target.value })} />
          </Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mt: 1 }}>Endereço</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Rua / Avenida" fullWidth sx={{ flex: 3 }} value={form.addressStreet} onChange={e => setForm({ ...form, addressStreet: e.target.value })} />
            <TextField label="Nº" fullWidth sx={{ flex: 1 }} value={form.addressNumber} onChange={e => setForm({ ...form, addressNumber: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Bairro" fullWidth value={form.addressNeighborhood} onChange={e => setForm({ ...form, addressNeighborhood: e.target.value })} />
            <TextField label="Cidade" fullWidth value={form.addressCity} onChange={e => setForm({ ...form, addressCity: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="info">Cancelar</Button>
          <Button variant="contained" color="info" onClick={handleSave} disabled={!form.name.trim() || !form.petName.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm ─────────────────────────────── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir o cliente <strong>{clients.find(c => c.id === deleteId)?.name}</strong> e todos os seus dados?</Typography>
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
        open={!!viewedClient}
        onClose={() => setViewedClient(null)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'info.main' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setViewedClient(null)} aria-label="close">
                <ArrowBackIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                Detalhes do Cliente
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
          Detalhes do Cliente
        </DialogTitle>
        {viewedClient && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '24px !important' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%', bgcolor: 'info.light', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'info.contrastText'
              }}>
                <PetsIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {viewedClient.petName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {viewedClient.petSpecies || 'Não informado'} {viewedClient.petBreed ? `• Raça: ${viewedClient.petBreed}` : ''}
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
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" color="info" onClick={() => setViewedClient(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Mobile FAB ───────────────────────────────── */}
      {isMobile && (
        <Fab
          color="info"
          aria-label="add"
          onClick={openAdd}
          sx={{
            position: 'fixed',
            bottom: 88,
            right: 16,
            zIndex: theme.zIndex.speedDial || 1050,
            '@media print': { display: 'none' }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* ─── Snackbar Notification ──────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

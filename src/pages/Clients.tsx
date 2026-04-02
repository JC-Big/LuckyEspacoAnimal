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
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PetsIcon from '@mui/icons-material/Pets';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '../store';
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
  const { clients, addClient, updateClient, deleteClient } = useStore();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyClient);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({ ...client });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.petName.trim()) return;
    if (editing) {
      updateClient({ ...editing, ...form });
    } else {
      addClient(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteClient(deleteId);
      setDeleteId(null);
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
          startIcon={<AddIcon />} 
          onClick={openAdd}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Novo Cliente
        </Button>
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
          <Card key={c.id} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.light', width: 50, height: 50 }}>
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
          <AppBar sx={{ position: 'relative' }} elevation={0}>
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
            <TextField label="Espécie" select fullWidth value={form.petSpecies} onChange={e => setForm({ ...form, petSpecies: e.target.value })}>
              {speciesList.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
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
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || !form.petName.trim()}>Salvar</Button>
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
    </Box>
  );
}

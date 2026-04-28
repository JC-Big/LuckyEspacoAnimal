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
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
  InputAdornment,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import type { Product, ProductBatch, MovementType } from '../store';
import dayjs from 'dayjs';

const categories = ['Alimentação', 'Higiene', 'Acessórios', 'Brinquedos', 'Medicamentos', 'Outros'];

const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'seqId'> = { shortId: '', name: '', category: 'Alimentação', minQuantity: 0 };
const emptyBatch = (productId: string): Omit<ProductBatch, 'id' | 'seqId'> => ({ 
  productId, 
  description: '', 
  entryDate: dayjs().format('YYYY-MM-DD'), 
  expirationDate: '', 
  quantity: 1 
});

export default function Inventory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const filterLowStock = searchParams.get('filter') === 'low-stock';
  const filterExpiring = searchParams.get('filter') === 'expiring';
  const filterExpired = searchParams.get('filter') === 'expired';
  //const { products, batches, addProduct, updateProduct, deleteProduct, addBatch, updateBatch, deleteBatch, addMovement } = useStore();
  //const { batches, addBatch, updateBatch, deleteBatch, addMovement } = useStore();

  const [batches, setBatches] = useState<any[]>([]);

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

  const [search, setSearch] = useState('');

  const getProductTotalQty = (productId: string) => {
    return batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.quantity, 0);
  };

  const getProductExpiration = (productId: string) => {
    const pBatches = batches.filter(b => b.productId === productId && b.expirationDate);
    if (pBatches.length === 0) return null;
    return pBatches.sort((a, b) => dayjs(a.expirationDate).diff(dayjs(b.expirationDate)))[0].expirationDate;
  };

  const [products, setProducts] = useState<any[]>([]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterLowStock) {
      list = list.filter(p => getProductTotalQty(p.id) <= p.minQuantity);
    }
    if (filterExpiring) {
      list = list.filter(p => {
        const earliest = getProductExpiration(p.id);
        return earliest && dayjs(earliest).diff(dayjs(), 'day') <= 30;
      });
    }
    if (filterExpired) {
      list = list.filter(p => {
        const earliest = getProductExpiration(p.id);
        return earliest && dayjs(earliest).diff(dayjs(), 'day') <= 0;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, batches, filterLowStock, filterExpiring, search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      console.log("Buscando produtos...");

      const querySnapshot = await getDocs(collection(db, "products"));

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Produtos:", data);

        setProducts(data);

    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const fetchBatches = async () => {
    try {
      console.log("Buscando lotes...");

      const querySnapshot = await getDocs(collection(db, "batches"));

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Lotes:", data);

      setBatches(data);

    } catch (error) {
      console.error("Erro ao buscar lotes:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBatches();
  }, []);

  // Batches Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [batchesDialogOpen, setBatchesDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState<Omit<ProductBatch, 'id' | 'seqId'> | null>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  const [movDialogOpen, setMovDialogOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct);
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
  const [movProduct, setMovProduct] = useState<Product | null>(null);
  const [movType, setMovType] = useState<MovementType>('in');
  const [movQty, setMovQty] = useState(1);
  const [movReason, setMovReason] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');



  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ shortId: p.shortId, name: p.name, category: p.category, minQuantity: p.minQuantity });
    setDialogOpen(true);
  };

  const openBatches = (p: Product) => {
    setSelectedProduct(p);
    setBatchesDialogOpen(true);
  };

  const handleSave = async () => {
      try {
      if (editing) {
        const productRef = doc(db, "products", editing.id);

        await updateDoc(productRef, {
          shortId: form.shortId,
            name: form.name,
          category: form.category,
          minQuantity: form.minQuantity,
        });

      } else {
          await addDoc(collection(db, "products"), {
          shortId: form.shortId,
          name: form.name,
          category: form.category,
          minQuantity: form.minQuantity,
          createdAt: new Date(),
        });
      }

      await fetchProducts();
      setDialogOpen(false);

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const openMovement = (p: Product, type: MovementType) => {
    setMovProduct(p);
    setMovType(type);
    setMovQty(1);
    setMovReason('');
    setSelectedBatchId('');
    setMovDialogOpen(true);
  };

  const handleMovement = async () => {
    if (!movProduct || (movType === 'out' && !selectedBatchId)) return;

    try {
      const batch = batches.find(b => b.id === selectedBatchId);

      if (!batch) {
        showSnackbar("Lote não encontrado!", "error");
        return;
      }

      if (movType === 'out' && movQty > batch.quantity) {
        showSnackbar("Quantidade maior que o estoque disponível!", "error");
        return;
      }

      const newQty = movType === 'out' ? batch.quantity - movQty : batch.quantity + movQty;

      await updateDoc(doc(db, "batches", selectedBatchId), {
        quantity: newQty
      });

      await addDoc(collection(db, "movements"), {
        productId: movProduct.id,
        batchId: selectedBatchId,
        type: movType,
        quantity: movQty,
        date: dayjs().format('YYYY-MM-DD'),
        reason: movReason || (movType === 'in' ? 'Entrada' : 'Saída'),
      });

      showSnackbar("Movimentação registrada 🚀", "success");

      setMovDialogOpen(false);

      await fetchBatches();

    } catch (error) {
      console.error("Erro na movimentação:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    await deleteDoc(doc(db, "products", deleteId));

    await fetchProducts();
    setDeleteId(null);
  };

  const handleDeleteBatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, "batches", id));

      console.log("Lote deletado com sucesso");

      await fetchBatches();

    } catch (error) {
      console.error("Erro ao deletar lote:", error);
    }
  };

  const getExpirationStatus = (date?: string) => {
    if (!date) return null;
    const diff = dayjs(date).diff(dayjs(), 'day');
    if (diff < 0) return { label: 'Vencido', color: 'error' as const };
    if (diff <= 30) return { label: `Vence em ${diff}d`, color: 'warning' as const };
    return null;
  };

  return (
    <Box sx={{ mt: { xs: 1, md: 0 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4">
            {filterLowStock ? 'Estoque Baixo' : filterExpiring ? 'Produtos Vencendo' : filterExpired ? 'Produtos Vencidos' : 'Estoque'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredProducts.length} {filterLowStock ? 'produtos com estoque baixo' : filterExpiring ? 'produtos com validade próxima' : filterExpired ? 'produtos vencidos' : 'produtos cadastrados'}
            </Typography>
            {(filterLowStock || filterExpiring || filterExpired) && (
              <Chip
                label="Limpar filtro"
                size="small"
                onDelete={() => setSearchParams({})}
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Novo Produto
        </Button>
      </Box>

      {/* Search Bar */}
      <TextField
        placeholder="Buscar por nome ou categoria..."
        size="small"
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: { sm: 400 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* ─── Desktop Table ──────────────────────────────── */}
      <TableContainer
        component={Paper}
        sx={{ display: { xs: 'none', sm: 'block' }, borderRadius: 3 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>#ID</TableCell>
              <TableCell>ID Prod</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="center">Validade</TableCell>
              <TableCell align="center">Qtd Total</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map(p => {
              const totalQty = getProductTotalQty(p.id);
              const expDate = getProductExpiration(p.id);
              return (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => openBatches(p)}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    #{p.id.slice(0, 4)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{p.shortId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell align="center">
                    {expDate ? (
                      <Box>
                        <Typography variant="body2">{dayjs(expDate).format('DD/MM/YYYY')}</Typography>
                        {getExpirationStatus(expDate) && (
                          <Chip 
                            label={getExpirationStatus(expDate)?.label} 
                            color={getExpirationStatus(expDate)?.color} 
                            size="small" 
                            sx={{ fontSize: '0.65rem', height: 18, mt: 0.5 }} 
                          />
                        )}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">{totalQty}</TableCell>
                  <TableCell align="center">
                    {totalQty <= p.minQuantity ? (
                      <Chip label="Estoque Baixo" color="error" size="small" />
                    ) : (
                      <Chip label="OK" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Saída (Baixa)">
                      <IconButton color="error" size="small" onClick={() => openMovement(p, 'out')}>
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar Nome/Categoria">
                      <IconButton size="small" onClick={() => openEdit(p)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir Categoria">
                      <IconButton color="error" size="small" onClick={() => setDeleteId(p.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Mobile Cards ───────────────────────────────── */}
      <Stack spacing={2} sx={{ display: { xs: 'flex', sm: 'none' }, pb: 10 }}>
        {filteredProducts.map(p => {
          const totalQty = getProductTotalQty(p.id);
          const expDate = getProductExpiration(p.id);
          return (
            <Card key={p.id} sx={{ borderLeft: totalQty <= p.minQuantity ? '4px solid #E53935' : '4px solid #00897B' }} onClick={() => openBatches(p)}>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>
                      {p.shortId}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {p.name}
                    </Typography>
                  </Box>
                  {totalQty <= p.minQuantity && <Chip label="Baixo" color="error" size="small" />}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {p.category}
                </Typography>
                {expDate && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Pedaço que vence em: {dayjs(expDate).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Qtd Total: {totalQty}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 1.5, justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Saída de Estoque">
                  <IconButton
                    color="error"
                    size="medium"
                    sx={{ p: 1.5 }}
                    onClick={() => openMovement(p, 'out')}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="medium"
                  sx={{ p: 1.5 }}
                  onClick={() => openEdit(p)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  size="medium"
                  sx={{ p: 1.5 }}
                  onClick={() => setDeleteId(p.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      {/* ─── Product Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="xs">
        {isMobile && (
          <AppBar sx={{ position: 'relative' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDialogOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                {editing ? 'Editar Categoria' : 'Novo Produto'}
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
          {editing ? 'Editar Categoria' : 'Novo Modelo de Produto'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="ID Único do Produto (ex: COLM)" fullWidth value={form.shortId} onChange={e => setForm({ ...form, shortId: e.target.value.toUpperCase() })} />
          <TextField label="Nome do Modelo (ex: Ração Golden 15kg)" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="Categoria" select fullWidth value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
          </TextField>
          <TextField label="Aviso de Qtd Mínima (Soma Total)" type="number" fullWidth value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: Math.max(0, Number(e.target.value)) })} inputProps={{ min: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Batches (Entries) Dialog ─────────────────── */}
      <Dialog open={batchesDialogOpen} onClose={() => setBatchesDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="md">
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'primary.main' }} elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setBatchesDialogOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                Lotes
              </Typography>
              <Button color="inherit" onClick={() => setBatchForm(emptyBatch(selectedProduct!.id))} startIcon={<AddIcon />}>Novo</Button>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle sx={{ fontWeight: 700, display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center' }}>
          Lotes de: {selectedProduct?.name}
          <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => setBatchForm(emptyBatch(selectedProduct!.id))}>
            Nova Entrada
          </Button>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          {batchForm && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {editingBatchId ? 'Editar Entrada' : 'Cadastrar Nova Entrada'}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Descrição / Lote" fullWidth size="small" value={batchForm.description} onChange={e => setBatchForm({ ...batchForm, description: e.target.value })} placeholder="Ex: Lote A202" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Data de Entrada" type="date" fullWidth size="small" value={batchForm.entryDate} onChange={e => setBatchForm({ ...batchForm, entryDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField label="Vencimento" type="date" fullWidth size="small" value={batchForm.expirationDate} onChange={e => setBatchForm({ ...batchForm, expirationDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField label="Quantidade" type="number" fullWidth size="small" value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: Math.max(0, Number(e.target.value)) })} inputProps={{ min: 0 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" fullWidth onClick={async () => {
                    try {
                      if (!selectedProduct) return;

                      if (editingBatchId) {
                        await updateDoc(doc(db, "batches", editingBatchId), {
                          description: batchForm.description,
                          entryDate: batchForm.entryDate,
                          expirationDate: batchForm.expirationDate,
                          quantity: batchForm.quantity,
                        });
                      } else {
                        await addDoc(collection(db, "batches"), {
                          productId: selectedProduct.id,
                          description: batchForm.description,
                          entryDate: batchForm.entryDate,
                          expirationDate: batchForm.expirationDate,
                          quantity: batchForm.quantity,
                        });
                      }

                      await fetchBatches();

                      setBatchForm(null);
                      setEditingBatchId(null);

                    } catch (error) {
                      console.error("Erro ao salvar lote:", error);
                    }
                  }}>Salvar
                  </Button>
                  <Button color="inherit" onClick={() => { setBatchForm(null); setEditingBatchId(null); }}>X</Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Cód</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="center">Entrada</TableCell>
                  <TableCell align="center">Validade</TableCell>
                  <TableCell align="center">Qtd</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.filter(b => b.productId === selectedProduct?.id).map(b => (
                  <TableRow key={b.id}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{selectedProduct?.shortId}-{b.seqId}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.description || 'Lote Único'}</TableCell>
                    <TableCell align="center">{dayjs(b.entryDate).format('DD/MM/YY')}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {b.expirationDate ? dayjs(b.expirationDate).format('DD/MM/YY') : '-'}
                        {getExpirationStatus(b.expirationDate) && (
                          <Chip label={getExpirationStatus(b.expirationDate)?.label} color={getExpirationStatus(b.expirationDate)?.color} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{b.quantity}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setBatchForm(b); setEditingBatchId(b.id); }}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteBatch(b.id)}>
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {batches.filter(b => b.productId === selectedProduct?.id).length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Nenhum lote cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBatchesDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Movement Dialog ────────────────────────────── */}
      <Dialog open={movDialogOpen} onClose={() => setMovDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
           Saída de Estoque
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Produto: <strong>{movProduct?.name}</strong>
          </Typography>
          
          <TextField 
            label="Selecione o Lote / Entrada" 
            select 
            fullWidth 
            value={selectedBatchId} 
            onChange={e => setSelectedBatchId(e.target.value)}
          >
            {batches.filter(b => b.productId === movProduct?.id).map(b => (
              <MenuItem key={b.id} value={b.id}>
                {b.description || 'Lote Único'} — Disp: {b.quantity} (Val: {b.expirationDate ? dayjs(b.expirationDate).format('DD/MM/YY') : 'Sem data'})
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Quantidade para Baixa" type="number" fullWidth value={movQty} onChange={e => setMovQty(Math.max(1, Number(e.target.value)))} inputProps={{ min: 1 }} />
          <TextField label="Motivo da Saída" fullWidth value={movReason} onChange={e => setMovReason(e.target.value)} placeholder="Ex: Venda no balcão" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMovDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleMovement} disabled={!selectedBatchId || movQty <= 0}>Confirmar Baixa</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Excluir Modelo de Produto?</DialogTitle>
        <DialogContent>
          Esta ação excluirá permanentemente este modelo e todos os seus lotes.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Excluir</Button>
        </DialogActions>
      </Dialog>

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

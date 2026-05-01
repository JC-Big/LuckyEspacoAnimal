import { db } from "../firebase/db";
import { collection, getDocs } from "firebase/firestore";
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, 
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Avatar, useMediaQuery, useTheme, Autocomplete 
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
export interface Product {
  id: string;
  shortId: string;
  name: string;
  category: string;
  minQuantity: number;
  createdAt: string;
  seqId: number;
}

export interface ProductBatch {
  id: string;
  productId: string;
  seqId: number;
  description: string;
  entryDate: string;
  expirationDate: string;
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: string;
  addressCity: string;
  createdAt: string;
  seqId: number;
}

export type AppointmentStatus = 'agendado' | 'concluido' | 'cancelado';

export interface Appointment {
  id: string;
  clientId: string;
  date: string;
  time: string;
  service: string;
  status: AppointmentStatus;
}

dayjs.extend(isBetween);

type Category = 'estoque' | 'clientes' | 'agendamentos' | 'vencimentos';
type SortType = 'nome' | 'data' | 'id';

// Função robusta e pura de parseDate fora do ciclo de renderização
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseDate = (date: any) => {
  if (!date) return dayjs();
  if (typeof date === 'object' && 'seconds' in date) return dayjs(date.seconds * 1000);
  if (typeof date === 'object' && typeof date.toDate === 'function') return dayjs(date.toDate());
  return dayjs(date);
};

// Hook customizado para abstrair, tipar e paralelizar as buscas do Firebase
function useFirestoreData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Promise.all executa as buscas em paralelo, economizando tempo
      const [productsSnap, batchesSnap, clientsSnap, appointmentsSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "appointments")),
      ]);

      setProducts(productsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      setBatches(batchesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProductBatch)));
      setClients(clientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
      setAppointments(appointmentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment)));
    } catch (error) {
      console.error("Erro ao buscar dados do Firebase:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, batches, clients, appointments, loading };
}

export default function Reports() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { products, batches, clients, appointments } = useFirestoreData();

  const [category, setCategory] = useState<Category>('estoque');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sortBy, setSortBy] = useState<SortType>('nome');
  const [apptStatusPattern, setApptStatusPattern] = useState('todos');

  const [reportData, setReportData] = useState<Array<Product | Client | Appointment | ProductBatch> | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Otimização O(N): Pré-calcula totais de batches evitando filter().reduce() dentro do map das tabelas
  const productQuantities = useMemo(() => {
    const qtys: Record<string, number> = {};
    batches.forEach(b => {
      if (b.productId) {
        qtys[b.productId] = (qtys[b.productId] || 0) + (b.quantity || 0);
      }
    });
    return qtys;
  }, [batches]);

  const getClientData = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  // Função central memoizada que filtra e cria CÓPIAS das arrays antes do sort() evitando mutação do estado raw
  const handleGenerate = useCallback(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate).endOf('day');

    if (category === 'estoque') {
      const filtered = products.filter(p => parseDate(p.createdAt).isBetween(start, end, null, '[]'));
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'nome') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'data') return parseDate(b.createdAt).diff(parseDate(a.createdAt));
        return (a.seqId || 0) - (b.seqId || 0);
      });
      setReportData(sorted);
    } 
    else if (category === 'clientes') {
      const filtered = clients.filter(c => parseDate(c.createdAt).isBetween(start, end, null, '[]'));
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'nome') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'data') return parseDate(b.createdAt).diff(parseDate(a.createdAt));
        return (a.seqId || 0) - (b.seqId || 0);
      });
      setReportData(sorted);
    } 
    else if (category === 'agendamentos') {
      let filtered = appointments.filter(a => parseDate(a.date).isBetween(start, end, null, '[]'));
      if (apptStatusPattern !== 'todos') {
        filtered = filtered.filter(a => a.status === apptStatusPattern);
      }
      const sorted = [...filtered].sort((a, b) => {
        const d = parseDate(a.date).diff(parseDate(b.date));
        if (d === 0) return (a.time || '').localeCompare(b.time || '');
        return d;
      });
      setReportData(sorted);
    } 
    else if (category === 'vencimentos') {
      const filtered = batches.filter(b => parseDate(b.expirationDate).isBetween(start, end, null, '[]'));
      const sorted = [...filtered].sort((a, b) => parseDate(a.expirationDate).diff(parseDate(b.expirationDate)));
      setReportData(sorted);
    }
  }, [category, startDate, endDate, sortBy, apptStatusPattern, products, clients, appointments, batches]);

  const handlePrint = () => {
    window.print();
  };

  // Funções de Renderização com Validação Fallback
  const renderEstoqueTable = (data: Product[]) => (
    <Table size="small">
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          <TableCell><b>ID</b></TableCell>
          <TableCell><b>Data Cadastro</b></TableCell>
          <TableCell><b>Produto</b></TableCell>
          <TableCell><b>Categoria</b></TableCell>
          <TableCell align="center"><b>Qtd. Atual</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(p => (
          <TableRow key={p.id}>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>#{String(p.seqId || 0).padStart(3, '0')}</TableCell>
            <TableCell>{parseDate(p.createdAt).format('DD/MM/YYYY')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{p.name || 'Sem Nome'}</TableCell>
            <TableCell>{p.category || '-'}</TableCell>
            <TableCell align="center">{productQuantities[p.id] || 0}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={5} align="center">Nenhum registro encontrado no período.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderClientesTable = (data: Client[]) => (
    <Table size="small">
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          <TableCell><b>ID</b></TableCell>
          <TableCell><b>Cadastro</b></TableCell>
          <TableCell><b>Tutor</b></TableCell>
          <TableCell><b>Contato</b></TableCell>
          <TableCell><b>Endereço</b></TableCell>
          <TableCell><b>Pet</b></TableCell>
          <TableCell><b>Espécie / Raça</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(c => (
          <TableRow key={c.id}>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>#{String(c.seqId || 0).padStart(3, '0')}</TableCell>
            <TableCell>{parseDate(c.createdAt).format('DD/MM/YYYY')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{c.name || 'Sem Nome'}</TableCell>
            <TableCell>{c.phone || '-'}</TableCell>
            <TableCell>
              {c.addressStreet ? (
                <Typography variant="body2" sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.addressStreet}, {c.addressNumber || 'S/N'} - {c.addressCity || ''}
                </Typography>
              ) : '-'}
            </TableCell>
            <TableCell>{c.petName || '-'}</TableCell>
            <TableCell>{c.petSpecies || '-'} • {c.petBreed || '-'}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={7} align="center">Nenhum registro encontrado no período.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderAgendamentosTable = (data: Appointment[]) => (
    <Table size="small">
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          <TableCell><b>Data / Hora</b></TableCell>
          <TableCell><b>Cliente / Pet</b></TableCell>
          <TableCell><b>Serviço</b></TableCell>
          <TableCell><b>Status</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(a => {
          const client = getClientData(a.clientId);
          const statusColors: Record<string, string> = { agendado: '#0288d1', concluido: '#2e7d32', cancelado: '#d32f2f' };
          return (
            <TableRow key={a.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>{parseDate(a.date).format('DD/MM/YYYY')}</Typography>
                <Typography variant="caption" color="text.secondary">{a.time || '--:--'}</Typography>
              </TableCell>
              <TableCell>
                {client ? `${client.petName || 'Pet'} (${client.name || 'Tutor'})` : 'Cliente não encontrado'}
              </TableCell>
              <TableCell>{a.service || '-'}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: statusColors[a.status || ''] || 'inherit', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {a.status || 'Desconhecido'}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={4} align="center">Nenhum registro encontrado no período.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderVencimentosTable = (data: ProductBatch[]) => (
    <Table size="small">
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          <TableCell><b>Cód. Lote</b></TableCell>
          <TableCell><b>Data Entrada</b></TableCell>
          <TableCell><b>Produto</b></TableCell>
          <TableCell><b>Vencimento</b></TableCell>
          <TableCell align="center"><b>Qtd.</b></TableCell>
          <TableCell><b>Status</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(b => {
          const prod = products.find(p => p.id === b.productId);
          const diffDays = parseDate(b.expirationDate).startOf('day').diff(dayjs().startOf('day'), 'day');
          let statusText = 'Na validade';
          let statusColor = '#2e7d32'; // green
          if (diffDays < 0) { 
            statusText = 'Vencido'; 
            statusColor = '#d32f2f'; // red
          } else if (diffDays <= 30) { 
            statusText = 'Vencendo'; 
            statusColor = '#ed6c02'; // orange
          }

          return (
            <TableRow key={b.id}>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{prod?.shortId || '---'}-{b.seqId || 0}</TableCell>
              <TableCell>{parseDate(b.entryDate).format('DD/MM/YYYY')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{prod?.name || 'Desconhecido'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{parseDate(b.expirationDate).format('DD/MM/YYYY')}</TableCell>
              <TableCell align="center">{b.quantity || 0}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: statusColor, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {statusText}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={6} align="center">Nenhum registro encontrado no período.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* Esconde a UI principal na hora da impressão */}
      <Box sx={{ '@media print': { display: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 44, height: 44 }}>
            <AssessmentIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box sx={{ mt: { xs: 2, md: 0 } }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Relatórios</Typography>
            <Typography variant="body2" color="text.secondary">
              Gere relatórios sintéticos de dados customizados
            </Typography>
          </Box>
        </Box>

        <Paper className="no-print" sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', '@media print': { display: 'none' } }}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <TextField 
                label="Data Inicial" 
                type="date" 
                color="warning"
                fullWidth 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                slotProps={{ inputLabel: { shrink: true } }} 
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <TextField 
                label="Data Final" 
                type="date" 
                color="warning"
                fullWidth 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                slotProps={{ inputLabel: { shrink: true } }} 
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <Autocomplete
                fullWidth
                options={[
                  { value: 'estoque', label: 'Estoque de Produtos' },
                  { value: 'vencimentos', label: 'Vencimento de Produtos' },
                  { value: 'clientes', label: 'Cadastro de Clientes' },
                  { value: 'agendamentos', label: 'Agendamentos' },
                ]}
                getOptionLabel={(option) => option.label}
                value={
                  [
                    { value: 'estoque', label: 'Estoque de Produtos' },
                    { value: 'vencimentos', label: 'Vencimento de Produtos' },
                    { value: 'clientes', label: 'Cadastro de Clientes' },
                    { value: 'agendamentos', label: 'Agendamentos' },
                  ].find(o => o.value === category) || undefined
                }
                onChange={(_, newValue) => {
                  if (newValue) {
                    setCategory(newValue.value as Category);
                    setSortBy(newValue.value === 'agendamentos' ? 'data' : 'nome');
                    setReportData(null); // Reseta a view ao mudar de categoria
                  }
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => <TextField {...params} label="Categoria do Relatório" color="warning" />}
                noOptionsText="Nenhuma categoria"
                disableClearable
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    Opções de Filtro e Ordenação
                  </FormLabel>
                  
                  {category === 'vencimentos' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Os produtos são automaticamente ordenados pela data de vencimento (do mais próximo ao mais distante).
                      </Typography>
                    </Box>
                  )}
                  {category !== 'agendamentos' && category !== 'vencimentos' && (
                    <RadioGroup row value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)}>
                      <FormControlLabel value="nome" control={<Radio size="small" color="warning" />} label={`Ordenar por Nome ${category === 'estoque' ? 'do Produto' : 'do Cliente'}`} />
                      <FormControlLabel value="data" control={<Radio size="small" color="warning" />} label="Ordenar por Data de Cadastro" />
                      <FormControlLabel value="id" control={<Radio size="small" color="warning" />} label="Ordenar por ID" />
                    </RadioGroup>
                  )}
                  {category === 'agendamentos' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Os agendamentos são automaticamente ordenados por Data e Hora.
                      </Typography>
                      <RadioGroup row value={apptStatusPattern} onChange={(e) => setApptStatusPattern(e.target.value)}>
                        <FormControlLabel value="todos" control={<Radio size="small" color="warning" />} label="Todos os Status" />
                        <FormControlLabel value="agendado" control={<Radio size="small" color="warning" />} label="Apenas Agendado" />
                        <FormControlLabel value="concluido" control={<Radio size="small" color="warning" />} label="Apenas Concluído" />
                        <FormControlLabel value="cancelado" control={<Radio size="small" color="warning" />} label="Apenas Cancelado" />
                      </RadioGroup>
                    </Box>
                  )}
                </FormControl>
              </Paper>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Button 
                variant="contained" 
                color="warning"
                size="large" 
                fullWidth 
                onClick={handleGenerate}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, color: '#fff' }}
              >
                Gerar Relatório
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Report Result Area */}
      {reportData && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, '@media print': { display: 'none' }}}>
            <Typography variant="h6">Resultado do Relatório</Typography>
            <Button 
              color="warning"
              startIcon={<PrintIcon />} 
              variant="outlined" 
              onClick={handlePrint}
            >
              Imprimir / PDF
            </Button>
          </Box>
          
          <Paper 
            ref={printAreaRef}
            className="print-area"
            sx={{ 
              p: 4, 
              '@media print': { 
                boxShadow: 'none', 
                p: 0,
                color: '#000',
              } 
            }}
          >
            <Box className="print-wrapper">
              {/* Header that only shows beautifully in print but we can show it here too */}
              <Box className="print-header" sx={{ borderBottom: '2px solid', borderColor: 'divider', pb: 2, mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Módulo de Relatório - Lucky Animal</Typography>
              <Typography variant="body2" color="text.secondary">
                Categoria: {category.toUpperCase()}<br/>
                Período: {dayjs(startDate).format('DD/MM/YYYY')} a {dayjs(endDate).format('DD/MM/YYYY')} <br/>
                Gerado em: {dayjs().format('DD/MM/YYYY [às] HH:mm')}
              </Typography>
            </Box>

            <TableContainer 
              sx={{ 
                overflowX: 'auto',
                width: '100%',
                display: 'block',
                '& table': { 
                  minWidth: isMobile ? 600 : 'auto',
                  '@media print': { minWidth: '100% !important' }
                },
                pb: 12,
                '@media print': { 
                  overflow: 'visible',
                  pb: 0 
                }
              }}
            >
              {category === 'estoque' && renderEstoqueTable(reportData as Product[])}
              {category === 'vencimentos' && renderVencimentosTable(reportData as ProductBatch[])}
              {category === 'clientes' && renderClientesTable(reportData as Client[])}
              {category === 'agendamentos' && renderAgendamentosTable(reportData as Appointment[])}
            </TableContainer>

            <Box sx={{ mt: 4, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total de registros encontrados: {reportData.length}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 4, textAlign: 'center', color: 'text.disabled', '@media not print': { display: 'none' }}}>
                Documento gerado pelo sistema PetShop Lucky Animal
              </Typography>
            </Box>
            </Box>
          </Paper>
        </Box>
      )}

      <style>
        {`
          @media print {
            /* 1. CONFIGURAÇÃO DA PÁGINA COM MARGEM FÍSICA */
            @page { 
              margin: 2cm; 
              size: auto;
            }
            
            /* 2. RESET BÁSICO (FUNDO BRANCO E CORES REAIS) */
            html, body, #root { 
              background-color: #fff !important; 
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }

            /* 3. ESCONDER MENUS, BARRAS LATERAIS E BOTÕES */
            .MuiDrawer-root, 
            .MuiAppBar-root, 
            .MuiBottomNavigation-root, 
            .MuiSpeedDial-root,
            .MuiButton-root:not(.keep-print),
            .no-print,
            header, nav, aside { 
              display: none !important; 
            }

            /* 4. REMOVER LIMITES DA DASHBOARD PARA LIBERAR ESPAÇO */
            main, .MuiContainer-root, .layout-wrapper {
              margin: 0 !important;
              padding: 0 !important;
              max-width: none !important;
              background: transparent !important;
              box-shadow: none !important;
            }

            /* 5. WRAPPER CENTRALIZADOR E ÁREA DO RELATÓRIO */
            .print-area {
              background-color: #fff !important;
              margin: 0 !important;    
              padding: 0 !important;     
              box-shadow: none !important;
              border: none !important;
              display: block !important;
              width: 100% !important;
            }

            .print-wrapper {
              max-width: 1000px !important;
              margin: 0 auto !important;
              padding: 20px !important;
              box-sizing: border-box !important;
              width: 100% !important;
            }

            /* 6. TABELAS (SEM QUEBRAR, PREENCHENDO O ESPAÇO) */
            .MuiTableContainer-root {
              overflow: visible !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
            }
            
            .MuiTable-root {
              width: 100% !important;
              table-layout: fixed !important; /* Distribui as colunas igualmente e evita estourar limites */
              border-collapse: collapse !important;
              margin-bottom: 20px !important;
            }
            
            .MuiTableCell-root {
              border-bottom: 1px solid #ccc !important;
              padding: 12px 10px !important; /* Espaçamento interno das células */
              font-size: 11pt !important;
              color: #000 !important;
              line-height: 1.4 !important;
              word-wrap: break-word !important;
            }
            
            /* Cabeçalho da tabela com fundo cinza destacado */
            .MuiTableHead-root .MuiTableCell-root {
              background-color: #f0f0f0 !important;
              font-weight: 800 !important;
              border-bottom: 2px solid #333 !important;
              color: #000 !important;
            }
            
            table { page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            tfoot { display: table-footer-group; }
            
            /* 7. TIPOGRAFIA DO CABEÇALHO (Módulo de Relatório) */
            .print-header {
              border-bottom: 3px solid #000 !important;
              margin-bottom: 24px !important;
              padding-bottom: 12px !important;
              background-color: #fff !important;
            }
            
            .print-header h5 {
              font-size: 18pt !important;
              color: #000 !important;
              font-weight: 800 !important;
              margin-bottom: 6px !important;
            }
            
            .print-header p {
              font-size: 11pt !important;
              color: #444 !important;
              line-height: 1.5 !important;
            }
            
            .print-area .MuiTypography-caption {
              font-size: 10pt !important;
              color: #666 !important;
            }
          }
        `}
      </style>
    </Box>
  );
}

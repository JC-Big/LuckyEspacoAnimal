import { useState, useRef } from 'react';
import {  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useStore } from '../store';
import type { Product, ProductBatch, Client, Appointment } from '../store';

dayjs.extend(isBetween);

type Category = 'estoque' | 'clientes' | 'agendamentos' | 'vencimentos';
type SortType = 'nome' | 'data' | 'id';

export default function Reports() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { products, batches, clients, appointments } = useStore();

  const getProductTotalQty = (productId: string) => {
    return batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.quantity, 0);
  };

  const [category, setCategory] = useState<Category>('estoque');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sortBy, setSortBy] = useState<SortType>('nome');
  const [apptStatusPattern, setApptStatusPattern] = useState('todos');

  const [reportData, setReportData] = useState<any[] | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const getClientData = (id: string) => clients.find(c => c.id === id);

  const handleGenerate = () => {
    const start = dayjs(startDate);
    const end = dayjs(endDate).endOf('day');

    if (category === 'estoque') {
      let result = products.filter(p => dayjs(p.createdAt).isBetween(start, end, null, '[]'));
      if (sortBy === 'nome') result.sort((a, b) => a.name.localeCompare(b.name));
      if (sortBy === 'data') result.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
      if (sortBy === 'id') result.sort((a, b) => a.seqId - b.seqId);      
      setReportData(result);
    } 
    else if (category === 'clientes') {
      let result = clients.filter(c => dayjs(c.createdAt).isBetween(start, end, null, '[]'));
      if (sortBy === 'nome') result.sort((a, b) => a.name.localeCompare(b.name));
      if (sortBy === 'data') result.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
      if (sortBy === 'id') result.sort((a, b) => a.seqId - b.seqId);      
      setReportData(result);
    } 
    else if (category === 'agendamentos') {
      let result = appointments.filter(a => dayjs(a.date).isBetween(start, end, null, '[]'));
      if (apptStatusPattern !== 'todos') {
        result = result.filter(a => a.status === apptStatusPattern);
      }
      // Appointments are always sorted by date
      result.sort((a, b) => {
        const d = dayjs(a.date).diff(dayjs(b.date));
        if (d === 0) return a.time.localeCompare(b.time);
        return d;
      });
      setReportData(result);
    } 
    else if (category === 'vencimentos') {
      let result = batches.filter(b => dayjs(b.expirationDate).isBetween(start, end, null, '[]'));
      // Always sort by expiration date ascending (nearest first)
      result.sort((a, b) => dayjs(a.expirationDate).diff(dayjs(b.expirationDate)));
      setReportData(result);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Rendering table functions
  const renderEstoqueTable = (data: Product[]) => (
    <Table size="small">
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          <TableCell><b>ID</b></TableCell>
          <TableCell><b>Data Cadastro</b></TableCell>
          <TableCell><b>Produto</b></TableCell>
          <TableCell><b>Categoria</b></TableCell>
          <TableCell align="center"><b>Qtd.</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(p => (
          <TableRow key={p.id}>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>#{String(p.seqId).padStart(3, '0')}</TableCell>
            <TableCell>{dayjs(p.createdAt).format('DD/MM/YYYY')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
            <TableCell>{p.category}</TableCell>
            <TableCell align="center">{getProductTotalQty(p.id)}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={5} align="center">Nenhum registro encontrado.</TableCell></TableRow>
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
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>#{String(c.seqId).padStart(3, '0')}</TableCell>
            <TableCell>{dayjs(c.createdAt).format('DD/MM/YYYY')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
            <TableCell>{c.phone}</TableCell>
            <TableCell>
              {c.addressStreet ? (
                <Typography variant="body2" sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.addressStreet}, {c.addressNumber} - {c.addressCity}
                </Typography>
              ) : '-'}
            </TableCell>
            <TableCell>{c.petName}</TableCell>
            <TableCell>{c.petSpecies} • {c.petBreed}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={6} align="center">Nenhum registro encontrado.</TableCell></TableRow>
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
                <Typography variant="body2" fontWeight={600}>{dayjs(a.date).format('DD/MM/YYYY')}</Typography>
                <Typography variant="caption" color="text.secondary">{a.time}</Typography>
              </TableCell>
              <TableCell>
                {client ? `${client.petName} (${client.name})` : 'Cliente deletado'}
              </TableCell>
              <TableCell>{a.service}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: statusColors[a.status] || 'inherit', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {a.status}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={4} align="center">Nenhum registro encontrado.</TableCell></TableRow>
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
          const diffDays = dayjs(b.expirationDate).startOf('day').diff(dayjs().startOf('day'), 'day');
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{prod?.shortId}-{b.seqId}</TableCell>
              <TableCell>{dayjs(b.entryDate).format('DD/MM/YYYY')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{prod ? prod.name : 'Desconhecido'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{dayjs(b.expirationDate).format('DD/MM/YYYY')}</TableCell>
              <TableCell align="center">{b.quantity}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: statusColor, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {statusText}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow><TableCell colSpan={6} align="center">Nenhum registro encontrado.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* Remove UI from print output */}
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
              <TextField 
                label="Categoria do Relatório" 
                select 
                color="warning"
                fullWidth 
                value={category} 
                onChange={e => {
                  setCategory(e.target.value as Category);
                  setSortBy(e.target.value === 'agendamentos' ? 'data' : 'nome');
                }}
              >
                <MenuItem value="estoque">Estoque de Produtos</MenuItem>
                <MenuItem value="vencimentos">Vencimento de Produtos</MenuItem>
                <MenuItem value="clientes">Cadastro de Clientes</MenuItem>
                <MenuItem value="agendamentos">Agendamentos</MenuItem>
              </TextField>
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
          </Paper>
        </Box>
      )}

      <style>
        {`
          @media print {
            @page { 
              margin: 1cm; 
              size: auto;
            }
            html, body, #root { 
              background-color: white !important; 
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            /* Hide all UI elements from print */
            .MuiDrawer-root, 
            .MuiAppBar-root, 
            .MuiBottomNavigation-root, 
            .MuiSpeedDial-root,
            .MuiButton-root:not(.keep-print),
            .no-print { 
              display: none !important; 
            }
            
            /* Reset layout for print */
            main { 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important; 
              display: block !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .MuiToolbar-root { display: none !important; }

            /* Ensure report container is clean */
            .print-area {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              background-color: white !important;
            }

            /* Tables in print */
            .MuiTableContainer-root {
              overflow: visible !important;
              display: block !important;
              width: auto !important;
            }
            .MuiTable-root {
              width: 100% !important;
              table-layout: auto !important;
            }
            
            /* Prevent rows from breaking */
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Header styling for print */
            .print-header {
              border-bottom: 2px solid #ddd !important;
              margin-bottom: 20px !important;
              padding-bottom: 10px !important;
            }
          }
        `}
      </style>
    </Box>
  );
}

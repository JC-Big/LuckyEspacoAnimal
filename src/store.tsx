import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

// ── Interfaces ──────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  minQuantity: number;
  createdAt: string;
  seqId: number;
}

export interface ProductBatch {
  id: string;
  productId: string;
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

export type MovementType = 'in' | 'out';

export interface InventoryMovement {
  id: string;
  productId: string;
  batchId?: string;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
}

// ── Context shape ───────────────────────────────────────────
interface StoreContextType {
  products: Product[];
  batches: ProductBatch[];
  clients: Client[];
  appointments: Appointment[];
  movements: InventoryMovement[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'seqId'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addBatch: (b: Omit<ProductBatch, 'id'>) => void;
  updateBatch: (b: ProductBatch) => void;
  deleteBatch: (id: string) => void;
  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'seqId'>) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addAppointment: (a: Omit<Appointment, 'id'>) => void;
  updateAppointment: (a: Appointment) => void;
  deleteAppointment: (id: string) => void;
  addMovement: (m: Omit<InventoryMovement, 'id'>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ── Mock data ───────────────────────────────────────────────
const today = dayjs().format('YYYY-MM-DD');

const initialProducts: Product[] = [
  { id: 'p1', name: 'Ração Premium Adulto 15kg', category: 'Alimentação', minQuantity: 5, createdAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), seqId: 1 },
  { id: 'p2', name: 'Shampoo Neutro 500ml', category: 'Higiene', minQuantity: 5, createdAt: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), seqId: 2 },
  { id: 'p3', name: 'Coleira Antipulgas M', category: 'Acessórios', minQuantity: 3, createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), seqId: 3 },
  { id: 'p4', name: 'Brinquedo Mordedor', category: 'Brinquedos', minQuantity: 5, createdAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), seqId: 4 },
  { id: 'p5', name: 'Ração Gatos Filhote 3kg', category: 'Alimentação', minQuantity: 4, createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), seqId: 5 },
  { id: 'p6', name: 'Tapete Higiênico 30un', category: 'Higiene', minQuantity: 10, createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), seqId: 6 },
];

const initialBatches: ProductBatch[] = [
  { id: uuidv4(), productId: 'p1', description: 'Carga inicial', entryDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), expirationDate: dayjs().add(6, 'month').format('YYYY-MM-DD'), quantity: 12 },
  { id: uuidv4(), productId: 'p2', description: 'Carga inicial', entryDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), expirationDate: dayjs().add(10, 'day').format('YYYY-MM-DD'), quantity: 3 },
  { id: uuidv4(), productId: 'p5', description: 'Carga inicial', entryDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), expirationDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), quantity: 2 },
  { id: uuidv4(), productId: 'p6', description: 'Carga inicial', entryDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), expirationDate: dayjs().add(12, 'month').format('YYYY-MM-DD'), quantity: 20 },
];

const initialClients: Client[] = [
  { id: 'c1', name: 'Ana Silva', phone: '(11) 99876-5432', petName: 'Thor', petSpecies: 'Cachorro', petBreed: 'Golden Retriever', addressStreet: 'Rua das Flores', addressNumber: '123', addressNeighborhood: 'Centro', addressCity: 'São Paulo', createdAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), seqId: 1 },
  { id: 'c2', name: 'Carlos Mendes', phone: '(11) 98765-4321', petName: 'Luna', petSpecies: 'Cachorro', petBreed: 'Poodle', addressStreet: 'Av. Paulista', addressNumber: '900', addressNeighborhood: 'Bela Vista', addressCity: 'São Paulo', createdAt: dayjs().subtract(8, 'day').format('YYYY-MM-DD'), seqId: 2 },
  { id: 'c3', name: 'Fernanda Costa', phone: '(21) 99123-4567', petName: 'Mia', petSpecies: 'Gato', petBreed: 'Siamês', addressStreet: 'Rua do Ouvidor', addressNumber: '50', addressNeighborhood: 'Centro', addressCity: 'Rio de Janeiro', createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), seqId: 3 },
  { id: 'c4', name: 'Roberto Lima', phone: '(31) 97654-3210', petName: 'Rex', petSpecies: 'Cachorro', petBreed: 'Pastor Alemão', addressStreet: 'Av. Afonso Pena', addressNumber: '1500', addressNeighborhood: 'Savassi', addressCity: 'Belo Horizonte', createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), seqId: 4 },
  { id: 'c5', name: 'Juliana Rocha', phone: '(41) 98234-5678', petName: 'Pipoca', petSpecies: 'Cachorro', petBreed: 'SRD', addressStreet: 'Rua XV de Novembro', addressNumber: '10', addressNeighborhood: 'Centro', addressCity: 'Curitiba', createdAt: today, seqId: 5 },
];

const initialAppointments: Appointment[] = [
  { id: uuidv4(), clientId: 'c1', date: today, time: '09:00', service: 'Banho e Tosa', status: 'agendado' },
  { id: uuidv4(), clientId: 'c2', date: today, time: '10:30', service: 'Consulta Veterinária', status: 'agendado' },
  { id: uuidv4(), clientId: 'c3', date: today, time: '14:00', service: 'Vacinação', status: 'concluido' },
  { id: uuidv4(), clientId: 'c4', date: dayjs().add(1, 'day').format('YYYY-MM-DD'), time: '11:00', service: 'Banho', status: 'agendado' },
  { id: uuidv4(), clientId: 'c5', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), time: '15:00', service: 'Tosa Higiênica', status: 'concluido' },
];

const initialMovements: InventoryMovement[] = [];

// ── Provider ────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [batches, setBatches] = useState<ProductBatch[]>(initialBatches);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'createdAt' | 'seqId'>) => {
    setProducts(prev => [...prev, { ...p, id: uuidv4(), createdAt: dayjs().format('YYYY-MM-DD'), seqId: prev.length + 1 }]);
  }, []);
  const updateProduct = useCallback((p: Product) => {
    setProducts(prev => prev.map(item => (item.id === p.id ? p : item)));
  }, []);
  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, idx) => ({ ...item, seqId: idx + 1 }));
    });
    setBatches(prev => prev.filter(b => b.productId !== id));
  }, []);

  const addBatch = useCallback((b: Omit<ProductBatch, 'id'>) => {
    setBatches(prev => [...prev, { ...b, id: uuidv4() }]);
  }, []);
  const updateBatch = useCallback((b: ProductBatch) => {
    setBatches(prev => prev.map(item => (item.id === b.id ? b : item)));
  }, []);
  const deleteBatch = useCallback((id: string) => {
    setBatches(prev => prev.filter(item => item.id !== id));
  }, []);

  const addClient = useCallback((c: Omit<Client, 'id' | 'createdAt' | 'seqId'>) => {
    setClients(prev => [...prev, { ...c, id: uuidv4(), createdAt: dayjs().format('YYYY-MM-DD'), seqId: prev.length + 1 }]);
  }, []);
  const updateClient = useCallback((c: Client) => {
    setClients(prev => prev.map(item => (item.id === c.id ? c : item)));
  }, []);
  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, idx) => ({ ...item, seqId: idx + 1 }));
    });
  }, []);

  const addAppointment = useCallback((a: Omit<Appointment, 'id'>) => {
    setAppointments(prev => [...prev, { ...a, id: uuidv4() }]);
  }, []);
  const updateAppointment = useCallback((a: Appointment) => {
    setAppointments(prev => prev.map(item => (item.id === a.id ? a : item)));
  }, []);
  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(item => item.id !== id));
  }, []);

  const addMovement = useCallback((m: Omit<InventoryMovement, 'id'>) => {
    setMovements(prev => [...prev, { ...m, id: uuidv4() }]);
    if (m.type === 'out' && m.batchId) {
      setBatches(prev =>
        prev.map(b => {
          if (b.id === m.batchId) {
            return { ...b, quantity: Math.max(0, b.quantity - m.quantity) };
          }
          return b;
        })
      );
    } 
    else if (m.type === 'in' && m.batchId) {
      setBatches(prev =>
        prev.map(b => {
          if (b.id === m.batchId) {
            return { ...b, quantity: b.quantity + m.quantity };
          }
          return b;
        })
      );
    }
  }, []);

  return (
    <StoreContext.Provider
      value={{
        products, batches, clients, appointments, movements,
        addProduct, updateProduct, deleteProduct,
        addBatch, updateBatch, deleteBatch,
        addClient, updateClient, deleteClient,
        addAppointment, updateAppointment, deleteAppointment,
        addMovement,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

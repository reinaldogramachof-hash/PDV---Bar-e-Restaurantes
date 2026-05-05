import { Product, Table, Waiter } from '../types';

export const mockProducts: Product[] = [
  { id: '1',  name: 'Caipirinha',        description: 'Limão e cachaça',                  price: 25,  category: 'Drinks',     stock: 20, minStock: 5,  unit: 'un',     controlsStock: true  },
  { id: '2',  name: 'Negroni',           description: 'Gin, Campari, Vermute',             price: 35,  category: 'Drinks',     stock: 15, minStock: 3,  unit: 'un',     controlsStock: true  },
  { id: '3',  name: 'Cerveja Artesanal', description: 'IPA 600ml gelada',                  price: 22,  category: 'Drinks',     stock: 30, minStock: 6,  unit: 'garrafa',controlsStock: true  },
  { id: '4',  name: 'Água s/gás',        description: '500ml',                             price: 6,   category: 'Drinks',     stock: 50, minStock: 10, unit: 'garrafa',controlsStock: true  },
  { id: '5',  name: 'Água com gás',      description: '500ml',                             price: 7,   category: 'Drinks',     stock: 40, minStock: 8,  unit: 'garrafa',controlsStock: true  },
  { id: '6',  name: 'Refrigerante',      description: 'Lata 350ml',                        price: 8,   category: 'Drinks',     stock: 40, minStock: 8,  unit: 'lata',   controlsStock: true  },
  { id: '7',  name: 'Suco Natural',      description: 'Laranja, Maracujá ou Limão',        price: 12,  category: 'Drinks',     stock: 25, minStock: 5,  unit: 'copo',   controlsStock: true  },
  { id: '8',  name: 'Porção de Batata',  description: 'Batata frita rústica crocante',     price: 38,  category: 'Petiscos',   stock: 30, minStock: 8,  unit: 'porção', controlsStock: true  },
  { id: '9',  name: 'Coxinha de Frango', description: 'Porção com 6 unidades',             price: 32,  category: 'Petiscos',   stock: 20, minStock: 5,  unit: 'porção', controlsStock: true  },
  { id: '10', name: 'Tábua de Frios',    description: 'Queijos, embutidos e azeitonas',    price: 55,  category: 'Petiscos',   stock: 12, minStock: 3,  unit: 'porção', controlsStock: true  },
  { id: '11', name: 'Filé Parmegiana',   description: 'Acompanha arroz e fritas',          price: 96,  category: 'Pratos',     stock: 10, minStock: 2,  unit: 'prato',  controlsStock: true  },
  { id: '12', name: 'Costelinha BBQ',    description: 'Costelinha suína ao molho barbecue',price: 68,  category: 'Pratos',     stock: 8,  minStock: 2,  unit: 'prato',  controlsStock: true  },
  { id: '13', name: 'Petit Gâteau',      description: 'Com sorvete de baunilha',           price: 28,  category: 'Sobremesas', stock: 8,  minStock: 2,  unit: 'un',     controlsStock: true  },
  { id: '14', name: 'Brownie',           description: 'Com calda de chocolate quente',     price: 18,  category: 'Sobremesas', stock: 12, minStock: 3,  unit: 'un',     controlsStock: true  },
  { id: '15', name: 'Balinha de Hortelã',description: 'Cortesia da casa',                  price: 0,   category: 'Outros',     stock: 200,minStock: 0,  unit: 'un',     controlsStock: false },
];

export const mockTables: Table[] = Array.from({ length: 20 }, (_, i) => ({
  number: i + 1,
  status: 'livre' as const,
}));

export const mockWaiters: Waiter[] = [
  { id: 'w1', name: 'Ana' },
  { id: 'w2', name: 'Carlos' },
  { id: 'w3', name: 'Mariana' },
];

export const mockCustomers = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@email.com', phone: '(11) 98888-7777', totalSpent: 2250.50, lastVisit: '2026-05-01', loyaltyPoints: 225 },
  { id: '2', name: 'Bruno Oliveira', email: 'bruno.o@email.com', phone: '(11) 97777-6666', totalSpent: 450.00, lastVisit: '2026-03-15', loyaltyPoints: 45 },
  { id: '3', name: 'Carla Santos', email: 'carla.s@email.com', phone: '(11) 96666-5555', totalSpent: 3100.20, lastVisit: '2026-05-04', loyaltyPoints: 310 },
  { id: '4', name: 'Diego Costa', email: 'diego.c@email.com', phone: '(11) 95555-4444', totalSpent: 89.90, lastVisit: '2026-05-05', loyaltyPoints: 9 },
  { id: '5', name: 'Fernanda Lima', email: 'fernanda.l@email.com', phone: '(11) 94444-3333', totalSpent: 1200.00, lastVisit: '2026-05-02', loyaltyPoints: 120 },
  { id: '6', name: 'Gabriel Souza', email: 'gabriel.s@email.com', phone: '(11) 93333-2222', totalSpent: 0, lastVisit: '2026-05-05', loyaltyPoints: 0 },
];

export const mockCollaborators = [
  { id: '1', name: 'Reinaldo Silva', role: 'Administrador', email: 'reinaldo@barmanager.com', status: 'active', joinedAt: '2025-01-15', permissions: 'admin', totalSales: 12500 },
  { id: '2', name: 'Maria Souza', role: 'Garçom Principal', email: 'maria.s@email.com', status: 'active', joinedAt: '2025-03-10', permissions: 'waiter', totalSales: 8400 },
  { id: '3', name: 'João Santos', role: 'Chef de Cozinha', email: 'joao.s@email.com', status: 'active', joinedAt: '2025-02-20', permissions: 'staff', totalSales: 0 },
  { id: '4', name: 'Pedro Lima', role: 'Garçom Noturno', email: 'pedro.l@email.com', status: 'break', joinedAt: '2025-04-05', permissions: 'waiter', totalSales: 2100 },
  { id: '5', name: 'Luciana Ferraz', role: 'Caixa', email: 'lu.ferraz@email.com', status: 'active', joinedAt: '2025-05-01', permissions: 'staff', totalSales: 0 },
];



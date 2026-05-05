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

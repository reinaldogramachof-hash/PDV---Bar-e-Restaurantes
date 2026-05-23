export type OrderMode = 'mesa' | 'balcao';
export type PaymentMethod = 'dinheiro' | 'credito' | 'debito' | 'pix' | 'vr' | 'va' | 'voucher';
export type Plano = 'essencial' | 'profissional' | 'gestao';
export type LicenseStatus = 'active' | 'suspended' | 'trial';
export type UserRole = 'master' | 'gerente' | 'caixa' | 'garcom' | 'cozinha' | 'estoque' | 'suporte';
export type Permission =
  | 'dashboard:read'
  | 'pdv:write'
  | 'mesas:write'
  | 'cozinha:write'
  | 'estoque:write'
  | 'caixa:write'
  | 'produtos:write'
  | 'clientes:write'
  | 'colaboradores:write'
  | 'fornecedores:write'
  | 'relatorios:read'
  | 'configuracoes:write'
  | 'seguranca:read'
  | 'suporte:read'
  | 'master:write';

export interface BaseEntity {
  id: string;
  empresaId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Empresa extends BaseEntity {
  name: string;
  document: string;
  plano: Plano;
  licenseStatus: LicenseStatus;
}

export interface Usuario extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Licenca extends BaseEntity {
  status: LicenseStatus;
  plano: Plano;
  validUntil?: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'close_order' | 'close_cashier' | 'license_check';

export interface AuditLogEntry extends BaseEntity {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  timestamp: string;
  details?: string;
}

export interface StockItem extends BaseEntity {
  name: string;
  category: string;
  unit: string; // kg, L, un, g, ml
  currentStock: number;
  minStock: number;
  costPrice: number;
  supplierId?: string;
}

export interface RecipeItem {
  stockItemId: string;
  quantity: number; // quantidade do insumo consumida
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  recipe?: RecipeItem[]; // Ficha técnica
  image?: string;
}

export interface OrderItem {
  id: string; // unique order item id
  product: Product;
  quantity: number;
  price: number;
}

export interface SplitItem {
  personName: string;
  items: OrderItem[];
}

export interface PaymentItem {
  method: PaymentMethod;
  amount: number;
}

export interface Order extends BaseEntity {
  mode: OrderMode;
  tableNumber?: number;
  customerName?: string;
  customerCount?: number;
  adultCount?: number;
  childrenCount?: number;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  payments: PaymentItem[];
  status: 'open' | 'closed';
  waiterId: string;
  customerId?: string;
  timestamp: string;
}

export interface Table {
  empresaId: string;
  number: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  activeOrderId?: string;
  reservationReason?: string;
}

export interface Waiter extends BaseEntity {
  name: string;
}

export interface Expense extends BaseEntity {
  description: string;
  amount: number;
  category: 'Insumos' | 'Pessoal' | 'Aluguel' | 'Utilidades' | 'Marketing' | 'Impostos' | 'Outros';
  status: 'pago' | 'pendente';
  paymentMethod?: PaymentMethod;
  dueDate?: string;
  timestamp: string;
}

export interface CashierSession extends BaseEntity {
  openedAt: string;
  closedAt?: string;
  initialBalance: number;
  salesTotal: number;
  serviceTaxTotal: number;
  expensesTotal: number;
  tipsTotal: number;
  finalBalance?: number;
  ordersCount: number;
  status: 'open' | 'closed';
}

export interface Customer extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
}

export interface Collaborator extends BaseEntity {
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive' | 'break';
  joinedAt: string;
  permissions: 'admin' | 'staff' | 'waiter';
  totalSales?: number;
  lastCheckIn?: string;
  lastCheckOut?: string;
  observations?: string;
  contractType?: 'CLT' | 'PJ' | 'Diarista' | 'Freelancer';
  salary?: number;
  commissionRate?: number;
  document?: string;
  address?: string;
  bankDetails?: string;
}

export interface Supplier extends BaseEntity {
  companyName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  lastDelivery: string;
  deliveryPerformance: number;
  document?: string; // CNPJ/CPF
  address?: string;
  paymentTerms?: string; // ex: 15 dias, 30 dias, à vista
  preferredPaymentMethod?: PaymentMethod;
  observations?: string;
  rating?: number; // 1-5 stars
}

export interface StockMovement extends BaseEntity {
  stockItemId: string; // Aponta para o insumo
  type: 'in' | 'out' | 'loss';
  quantity: number;
  unitCost?: number;
  reason?: string;
  timestamp: string;
  collaboratorId?: string;
}

export interface AppSettings {
  empresaId: string;
  establishment: {
    name: string;
    address: string;
    phone: string;
    document: string;
    website?: string;
  };
  thermalPrinter: {
    enabled: boolean;
    autoPrint: boolean;
    showLogo: boolean;
    paperWidth: '58mm' | '80mm';
  };
}

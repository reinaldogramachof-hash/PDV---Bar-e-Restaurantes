export type OrderMode = 'mesa' | 'balcao';
export type PaymentMethod = 'dinheiro' | 'credito' | 'debito' | 'pix' | 'vr' | 'va' | 'voucher';
export type Plano = 'essencial' | 'profissional' | 'gestao';
export type LicenseStatus = 'active' | 'suspended' | 'trial';
export type UserRole = 'master' | 'gerente' | 'caixa' | 'garcom' | 'cozinha' | 'estoque' | 'suporte';
export type Permission =
  | 'dashboard:read'
  | 'pdv:write'
  | 'mesas:write'
  | 'delivery:write'
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

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'close_order' | 'close_cashier' | 'license_check' | 'cashier_open' | 'order_cancel' | 'product_delete' | 'data_export' | 'permission_change';

export interface AuditLogEntry extends BaseEntity {
  type: string;
  userId: string;
  userName: string;
  detail: string;
  timestamp: string;
  extra?: Record<string, unknown>;
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

export interface MenuDigitalConfig {
  visible: boolean;
  description?: string;
  imageBase64?: string;
  highlight?: boolean;
  highlightLabel?: string;
}

export interface MenuConfig {
  empresaId: string;
  accentColor: string;
  welcomeMessage?: string;
  footerMessage?: string;
  showPrices: boolean;
  allowCallWaiter: boolean;
  whatsappPhone?: string; // formato: 11999999999 (sem +55, sem espaços)
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  recipe?: RecipeItem[]; // Ficha técnica
  image?: string;
  active?: boolean;
  menuDigital?: MenuDigitalConfig;
}

export interface OrderItem {
  id: string; // unique order item id
  product: Product;
  quantity: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  promotionName?: string;
  comboId?: string;
}

export interface Promotion {
  id: string;
  empresaId: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  productIds: string[];
  categoryIds: string[];
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
}

export interface Combo {
  id: string;
  empresaId: string;
  name: string;
  description?: string;
  items: { productId: string; qty: number }[];
  originalPrice: number;
  comboPrice: number;
  imageBase64?: string;
  menuDigital?: MenuDigitalConfig;
  active: boolean;
  createdAt: string;
}

export interface LoyaltyConfig {
  empresaId: string;
  active: boolean;
  pointsPerReal: number;
  redeemThreshold: number;
  redeemValue: number;
  expiresInDays?: number;
}

export interface LoyaltyEntry {
  id: string;
  empresaId: string;
  customerId: string;
  points: number;
  orderId?: string;
  description: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  empresaId: string;
  name: string;
  promotionId: string;
  daysOfWeek: number[];
  startsHour: number;
  endsHour: number;
  active: boolean;
  createdAt: string;
}

export interface SplitItem {
  personName: string;
  items: OrderItem[];
}

export interface PaymentItem {
  method: PaymentMethod;
  amount: number;
}

export interface PartialPaymentItem {
  amount: number;
  method: PaymentMethod;
  paidAt: string;
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
  partialPayments?: PartialPaymentItem[];
  status: 'open' | 'closed';
  waiterId: string;
  customerId?: string;
  loyaltyDiscount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  timestamp: string;
}

export interface Table {
  empresaId: string;
  number: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  sector?: string;
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
  password?: string;
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

export interface Entregador {
  id: string;
  empresaId: string;
  name: string;
  phone: string;
  vehicle: 'moto' | 'bike' | 'carro' | 'a_pe';
  status: 'disponivel' | 'em_rota' | 'inativo';
  repasseType?: 'por_entrega' | 'fixo_diario';
  repasseValue?: number;
  createdAt: string;
}

export interface DeliveryOrder {
  id: string;
  empresaId: string;
  customerName: string;
  phone: string;
  address: string;
  neighborhood: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'recebido' | 'preparo' | 'rota' | 'entregue' | 'cancelado';
  entregadorId?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface Insight {
  id: string;
  type: 'alerta' | 'oportunidade' | 'tendencia';
  severity: 'critico' | 'atencao' | 'positivo' | 'info';
  title: string;
  description: string;
  action?: string;
  metric?: string;
  module?: string;
}

export interface AppNotification {
  id: string;
  type: 'update' | 'security' | 'feature' | 'support' | 'sales' | 'info';
  title: string;
  body: string;
  action?: string;
  actionUrl?: string;
  publishedAt: string;
  expiresAt?: string;
  targetPlans?: ('essencial' | 'profissional' | 'gestao')[];
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

// ─── PlenaHub — Pipeline Comercial & Notificações Master ───────────────────

export type ProspectStage =
  | 'contato'
  | 'demo'
  | 'proposta'
  | 'contrato'
  | 'onboarding'
  | 'ativo'
  | 'perdido';

export interface Prospect {
  id: string;
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  planInterest: 'essencial' | 'profissional' | 'gestao';
  stage: ProspectStage;
  notes: string;
  lostReason?: string;
  monthlyValue: number;
  createdAt: string;
  updatedAt: string;
  lastInteractionAt: string;
}

export interface CommercialActivity {
  id: string;
  prospectId?: string;
  type: 'note' | 'call' | 'demo' | 'proposal' | 'contract' | 'upgrade' | 'churn';
  description: string;
  createdAt: string;
}

export interface MrrEntry {
  month: string; // 'YYYY-MM'
  value: number;
}

export interface MasterNotificationDraft {
  id: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  action?: string;
  targetPlans: ('essencial' | 'profissional' | 'gestao')[];
  publishedAt: string;
  expiresAt?: string;
  status: 'draft' | 'published';
}

// ─── Central de Pedidos Online ───────────────────────────────────────────────

export type OnlineOrderStatus =
  | 'recebido'
  | 'confirmado'
  | 'preparo'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export type OnlineOrderChannel = 'mesa' | 'delivery' | 'balcao';

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface OnlineOrder extends BaseEntity {
  channel: OnlineOrderChannel;
  status: OnlineOrderStatus;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  tableRef?: string;
  address?: string;
  notes?: string;
  total: number;
  createdAt: string;
  confirmedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  cancelReason?: string;
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

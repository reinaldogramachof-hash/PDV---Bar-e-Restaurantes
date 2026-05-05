export type OrderMode = 'mesa' | 'balcao';
export type PaymentMethod = 'dinheiro' | 'credito' | 'debito' | 'pix' | 'vr' | 'va' | 'voucher';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  controlsStock: boolean;
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

export interface Order {
  id: string;
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
  number: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  activeOrderId?: string;
  reservationReason?: string;
}

export interface Waiter {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'Insumos' | 'Pessoal' | 'Aluguel' | 'Utilidades' | 'Marketing' | 'Impostos' | 'Outros';
  status: 'pago' | 'pendente';
  paymentMethod?: PaymentMethod;
  dueDate?: string;
  timestamp: string;
}

export interface CashierSession {
  id: string;
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
}

export interface Collaborator {
  id: string;
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

export interface Supplier {
  id: string;
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

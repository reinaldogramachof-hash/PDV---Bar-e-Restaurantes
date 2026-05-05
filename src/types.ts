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

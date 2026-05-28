import type { DeliveryOrder, DeliveryOrderItem, PaymentMethod } from '../../types';

type IFoodOrderType = 'DELIVERY' | 'TAKEOUT' | 'INDOOR';

export interface IFoodOrder {
  id: string;
  reference: string;
  createdAt: string;
  type: IFoodOrderType;
  merchant: { id: string; name: string };
  customer: {
    name: string;
    phone: string;
    documentNumber?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    subItems?: Array<{ name: string; quantity: number }>;
  }>;
  payments: Array<{
    name: string;
    code: string;
    value: number;
    prepaid: boolean;
  }>;
  delivery?: {
    deliveryAddress: {
      streetName: string;
      streetNumber: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
      complement?: string;
    };
  };
  total: {
    subTotal: number;
    deliveryFee: number;
    benefits: number;
    orderAmount: number;
  };
  isTest?: boolean;
}

const getEnv = () => (import.meta as unknown as { env?: Record<string, string> }).env || {};

const fallbackMerchantId = '3860495';
const fallbackMerchantUuid = 'e00e450a-3b69-4db5-892b-d598fbf60fcf';

const resolvePaymentMethod = (code: string): PaymentMethod => {
  const normalized = code.toUpperCase();
  if (normalized.includes('PIX')) return 'pix';
  if (normalized.includes('CREDIT')) return 'credito';
  if (normalized.includes('DEBIT')) return 'debito';
  if (normalized.includes('VOUCHER')) return 'voucher';
  return 'dinheiro';
};

const toDeliveryOrderItems = (items: IFoodOrder['items']): DeliveryOrderItem[] =>
  items.map(item => ({
    name: item.subItems?.length
      ? `${item.name} (${item.subItems.map(subItem => `${subItem.quantity}x ${subItem.name}`).join(', ')})`
      : item.name,
    qty: item.quantity,
    price: item.unitPrice,
    addedAt: new Date().toISOString(),
  }));

const normalizeAddress = (order: IFoodOrder) => {
  const deliveryAddress = order.delivery?.deliveryAddress;
  if (!deliveryAddress) {
    return {
      address: 'Retirada no local',
      neighborhood: 'Balcao',
    };
  }

  const complement = deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : '';
  return {
    address: `${deliveryAddress.streetName}, ${deliveryAddress.streetNumber}${complement}`,
    neighborhood: deliveryAddress.neighborhood,
  };
};

export function mapIFoodToDeliveryOrder(order: IFoodOrder, empresaId: string): DeliveryOrder {
  const normalizedAddress = normalizeAddress(order);
  const paymentMethod = resolvePaymentMethod(order.payments[0]?.code || '');

  return {
    id: `ifood-${order.id}`,
    empresaId,
    customerName: order.customer.name,
    phone: order.customer.phone,
    address: normalizedAddress.address,
    neighborhood: normalizedAddress.neighborhood,
    items: toDeliveryOrderItems(order.items),
    subtotal: order.total.subTotal,
    deliveryFee: order.total.deliveryFee,
    discount: order.total.benefits,
    total: order.total.orderAmount,
    paymentMethod,
    status: 'recebido',
    notes: `iFood #${order.reference}`,
    createdAt: order.createdAt,
    sourcePlatform: 'ifood',
    externalId: order.id,
    externalReference: order.reference,
    isTest: order.isTest ?? false,
  };
}

export async function fetchMockIFoodOrders(): Promise<IFoodOrder[]> {
  const env = getEnv();
  const merchantId = env.VITE_IFOOD_MERCHANT_ID || fallbackMerchantId;
  const merchantUuid = env.VITE_IFOOD_MERCHANT_UUID || fallbackMerchantUuid;
  const now = Date.now();

  return [
    {
      id: `mock-${merchantUuid.slice(0, 8)}-001`,
      reference: 'IFOOD-TST-1001',
      createdAt: new Date(now - 2 * 60_000).toISOString(),
      type: 'DELIVERY',
      merchant: { id: merchantId, name: 'Plena Gastro Manager' },
      customer: { name: 'Mariana Souza', phone: '11999990001' },
      items: [
        { id: 'i-1', name: 'Hamburguer Artesanal', quantity: 2, unitPrice: 34.9, totalPrice: 69.8, subItems: [{ name: 'Cheddar', quantity: 2 }] },
        { id: 'i-2', name: 'Batata Rustica', quantity: 1, unitPrice: 19.9, totalPrice: 19.9 },
      ],
      payments: [{ name: 'Pix', code: 'PIX', value: 91.7, prepaid: true }],
      delivery: {
        deliveryAddress: {
          streetName: 'Rua Augusta',
          streetNumber: '1288',
          neighborhood: 'Consolacao',
          city: 'Sao Paulo',
          state: 'SP',
          postalCode: '01304-001',
        },
      },
      total: { subTotal: 89.7, deliveryFee: 8, benefits: 6, orderAmount: 91.7 },
      isTest: true,
    },
    {
      id: `mock-${merchantUuid.slice(0, 8)}-002`,
      reference: 'IFOOD-TST-1002',
      createdAt: new Date(now - 5 * 60_000).toISOString(),
      type: 'TAKEOUT',
      merchant: { id: merchantId, name: 'Plena Gastro Manager' },
      customer: { name: 'Joao Victor', phone: '11999990002' },
      items: [
        { id: 'i-3', name: 'Marmita Executiva', quantity: 1, unitPrice: 32, totalPrice: 32 },
        { id: 'i-4', name: 'Suco Natural', quantity: 2, unitPrice: 9.5, totalPrice: 19 },
      ],
      payments: [{ name: 'Cartao de Credito', code: 'CREDIT', value: 51, prepaid: true }],
      total: { subTotal: 51, deliveryFee: 0, benefits: 0, orderAmount: 51 },
      isTest: true,
    },
    {
      id: `mock-${merchantUuid.slice(0, 8)}-003`,
      reference: 'IFOOD-TST-1003',
      createdAt: new Date(now - 7 * 60_000).toISOString(),
      type: 'DELIVERY',
      merchant: { id: merchantId, name: 'Plena Gastro Manager' },
      customer: { name: 'Fernanda Lima', phone: '11999990003' },
      items: [
        { id: 'i-5', name: 'Pizza Margherita', quantity: 1, unitPrice: 59.9, totalPrice: 59.9, subItems: [{ name: 'Borda Recheada', quantity: 1 }] },
      ],
      payments: [{ name: 'Dinheiro', code: 'CASH', value: 66.9, prepaid: false }],
      delivery: {
        deliveryAddress: {
          streetName: 'Alameda Santos',
          streetNumber: '540',
          neighborhood: 'Jardins',
          city: 'Sao Paulo',
          state: 'SP',
          postalCode: '01418-000',
          complement: 'Apto 72',
        },
      },
      total: { subTotal: 59.9, deliveryFee: 9, benefits: 2, orderAmount: 66.9 },
      isTest: true,
    },
  ];
}

export async function fetchIFoodOrders(clientId: string, clientSecret: string, merchantId: string): Promise<IFoodOrder[]> {
  if (!clientId || !clientSecret || !merchantId) {
    throw new Error('Credenciais iFood incompletas para sincronizacao real.');
  }

  // Stub da camada real: endpoint sera habilitado apos homologacao de credenciais.
  return [];
}

export async function confirmIFoodOrder(_orderId: string): Promise<void> {
  return Promise.resolve();
}

export async function rejectIFoodOrder(_orderId: string, _reason: string): Promise<void> {
  return Promise.resolve();
}

export async function dispatchIFoodOrder(_orderId: string): Promise<void> {
  return Promise.resolve();
}

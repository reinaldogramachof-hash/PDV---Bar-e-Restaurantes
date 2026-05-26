import { Collaborator, DeliveryOrder, Expense, Insight, Order, StockItem } from '../types';

type Period = 'week' | 'month';
type ProductRankingItem = { name: string; qty: number; revenue: number; lastSoldAt: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const closedOrders = (orders: Order[]) => {
  if (orders.length === 0) return orders;
  // If already filtered, skip re-filtering
  if (orders.every(order => order.status === 'closed')) return orders;
  return orders.filter(order => order.status === 'closed');
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const toDate = (value: string) => new Date(value);

const sumRevenue = (orders: Order[]) => orders.reduce((total, order) => total + order.total, 0);

const getPeriodBounds = (period: Period, now = new Date()) => {
  const days = period === 'week' ? 7 : 30;
  const currentStart = new Date(now.getTime() - days * DAY_MS);
  const previousStart = new Date(now.getTime() - days * 2 * DAY_MS);
  return { currentStart, previousStart, days };
};

const periodOrders = (orders: Order[], start: Date, end: Date) =>
  closedOrders(orders).filter(order => {
    const timestamp = toDate(order.timestamp);
    return timestamp >= start && timestamp < end;
  });

const metric = (value: number, suffix = '%') => `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;

const createInsight = (
  id: string,
  type: Insight['type'],
  severity: Insight['severity'],
  title: string,
  description: string,
  action?: string,
  metricValue?: string,
  module?: string,
): Insight => ({ id, type, severity, title, description, action, metric: metricValue, module });

const severityRank: Record<Insight['severity'], number> = {
  critico: 0,
  atencao: 1,
  positivo: 2,
  info: 3,
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export function groupOrdersByDay(orders: Order[]) {
  return closedOrders(orders).reduce((acc, order) => {
    const key = dateKey(toDate(order.timestamp));
    acc.set(key, [...(acc.get(key) || []), order]);
    return acc;
  }, new Map<string, Order[]>());
}

export function groupOrdersByHour(orders: Order[]) {
  return closedOrders(orders).reduce((acc, order) => {
    const hour = toDate(order.timestamp).getHours();
    acc.set(hour, [...(acc.get(hour) || []), order]);
    return acc;
  }, new Map<number, Order[]>());
}

export function groupOrdersByDayOfWeek(orders: Order[]) {
  return closedOrders(orders).reduce((acc, order) => {
    const day = toDate(order.timestamp).getDay();
    acc.set(day, [...(acc.get(day) || []), order]);
    return acc;
  }, new Map<number, Order[]>());
}

export function getProductSalesRanking(orders: Order[]): ProductRankingItem[] {
  const ranking = new Map<string, ProductRankingItem>();

  closedOrders(orders).forEach(order => {
    order.items.forEach(item => {
      const current = ranking.get(item.product.name) || {
        name: item.product.name,
        qty: 0,
        revenue: 0,
        lastSoldAt: order.timestamp,
      };

      ranking.set(item.product.name, {
        ...current,
        qty: current.qty + item.quantity,
        revenue: current.revenue + item.price * item.quantity,
        lastSoldAt: toDate(order.timestamp) > toDate(current.lastSoldAt) ? order.timestamp : current.lastSoldAt,
      });
    });
  });

  return [...ranking.values()].sort((a, b) => b.revenue - a.revenue);
}

export function computeRevenueGrowth(orders: Order[], period: Period) {
  const now = new Date();
  const { currentStart, previousStart } = getPeriodBounds(period, now);
  const current = sumRevenue(periodOrders(orders, currentStart, now));
  const previous = sumRevenue(periodOrders(orders, previousStart, currentStart));
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function computeExpenseRatio(orders: Order[], expenses: Expense[] | number) {
  const revenue = sumRevenue(closedOrders(orders));
  const totalExpenses = typeof expenses === 'number' ? expenses : expenses.reduce((total, expense) => total + expense.amount, 0);
  return revenue > 0 ? (totalExpenses / revenue) * 100 : totalExpenses > 0 ? 100 : 0;
}

export function computeTicketAverage(orders: Order[], period: Period) {
  const now = new Date();
  const { currentStart } = getPeriodBounds(period, now);
  const currentOrders = periodOrders(orders, currentStart, now);
  return currentOrders.length ? sumRevenue(currentOrders) / currentOrders.length : 0;
}

const getProductVariation = (orders: Order[], productName: string) => {
  const now = new Date();
  const { currentStart, previousStart } = getPeriodBounds('week', now);
  const productQty = (items: Order[]) =>
    items.flatMap(order => order.items)
      .filter(item => item.product.name === productName)
      .reduce((total, item) => total + item.quantity, 0);
  const current = productQty(periodOrders(orders, currentStart, now));
  const previous = productQty(periodOrders(orders, previousStart, currentStart));
  const variation = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  return { current, previous, variation };
};

const getDeliveryRevenue = (deliveryOrders: DeliveryOrder[]) =>
  deliveryOrders
    .filter(order => order.status === 'entregue')
    .reduce((total, order) => total + order.total, 0);

const getDeliveryCancelRate = (deliveryOrders: DeliveryOrder[]) => {
  if (deliveryOrders.length === 0) return 0;
  return (deliveryOrders.filter(order => order.status === 'cancelado').length / deliveryOrders.length) * 100;
};

const computeMonthRevenue = (orders: Order[], monthOffset: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
  return sumRevenue(periodOrders(orders, start, end));
};

export function computeInsights(
  orders: Order[],
  expenses: Expense[],
  stockItems: StockItem[],
  deliveryOrders: DeliveryOrder[],
  collaborators: Collaborator[],
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const salesOrders = closedOrders(orders);
  const weeklyGrowth = computeRevenueGrowth(salesOrders, 'week');
  const monthlyGrowth = computeRevenueGrowth(salesOrders, 'month');
  const expenseRatio = computeExpenseRatio(salesOrders, expenses);
  const currentWeekAvgTicket = computeTicketAverage(salesOrders, 'week');
  const { currentStart: weekStart, previousStart: previousWeekStart } = getPeriodBounds('week', now);
  const previousWeekOrders = periodOrders(salesOrders, previousWeekStart, weekStart);
  const previousWeekAvgTicket = previousWeekOrders.length ? sumRevenue(previousWeekOrders) / previousWeekOrders.length : 0;
  const ticketGrowth = previousWeekAvgTicket > 0 ? ((currentWeekAvgTicket - previousWeekAvgTicket) / previousWeekAvgTicket) * 100 : 0;

  if (weeklyGrowth < -15) {
    insights.push(createInsight(
      'R01',
      'alerta',
      'critico',
      'Receita caiu mais de 15% vs semana anterior',
      'A receita da semana atual esta abaixo do ritmo da semana passada. Isso pode indicar queda de movimento, problema de oferta ou falha operacional.',
      'Compare cardapio, equipe e horarios dos dias de maior queda.',
      metric(weeklyGrowth),
      'relatorios',
    ));
  }

  getProductSalesRanking(salesOrders).forEach(product => {
    const daysStopped = Math.floor((now.getTime() - toDate(product.lastSoldAt).getTime()) / DAY_MS);
    if (daysStopped >= 7) {
      insights.push(createInsight(
        `R02-${product.name}`,
        'alerta',
        'atencao',
        'Produto sem venda ha 7 dias',
        `${product.name} nao registra venda ha ${daysStopped} dias. Produto parado ocupa espaco mental no cardapio e pode esconder itens com maior giro.`,
        'Revisar preco, descricao, destaque no cardapio ou retirar temporariamente.',
        `${daysStopped} dias`,
        'produtos',
      ));
    }
  });

  if (expenseRatio > 70) {
    insights.push(createInsight(
      'R03',
      'alerta',
      'critico',
      'Despesas acima de 70% da receita',
      'O peso das despesas esta muito alto em relacao a receita registrada, pressionando a margem real da operacao.',
      'Auditar despesas recorrentes e renegociar categorias de maior impacto.',
      metric(expenseRatio),
      'relatorios',
    ));
  }

  const dayGroups = groupOrdersByDayOfWeek(salesOrders);
  const dayRevenues = [...dayGroups.entries()].map(([day, dayOrders]) => ({ day, revenue: sumRevenue(dayOrders) }));
  const averageDayRevenue = dayRevenues.length ? dayRevenues.reduce((total, item) => total + item.revenue, 0) / dayRevenues.length : 0;
  dayRevenues.forEach(item => {
    if (averageDayRevenue > 0 && item.revenue < averageDayRevenue * 0.6) {
      insights.push(createInsight(
        `R04-${item.day}`,
        'oportunidade',
        'atencao',
        'Dia da semana abaixo da media',
        'Um dia da semana esta performando abaixo de 60% da media historica. Pode haver espaco para campanha, combo ou ajuste de escala.',
        'Criar oferta especifica para este dia ou reduzir custo de equipe no periodo.',
        `${Math.round((item.revenue / averageDayRevenue) * 100)}% da media`,
        'dashboard',
      ));
    }
  });

  if (ticketGrowth > 10) {
    insights.push(createInsight(
      'R05',
      'tendencia',
      'positivo',
      'Ticket medio crescendo acima de 10%',
      'O valor medio por pedido esta subindo, sinal de boa composicao de venda ou maior aderencia a combos.',
      'Preservar os itens e argumentos que elevaram o ticket.',
      metric(ticketGrowth),
      'dashboard',
    ));
  }

  const hourGroups = groupOrdersByHour(salesOrders);
  const hourlyCounts = [...hourGroups.entries()].map(([hour, hourOrders]) => ({ hour, count: hourOrders.length }));
  const hourlyAverage = hourlyCounts.length ? hourlyCounts.reduce((total, item) => total + item.count, 0) / hourlyCounts.length : 0;
  hourlyCounts.forEach(item => {
    if (hourlyAverage > 0 && item.count > hourlyAverage * 2) {
      insights.push(createInsight(
        `R06-${item.hour}`,
        'oportunidade',
        'info',
        'Hora de pico identificada',
        `O horario das ${item.hour}h concentra demanda acima de 2x a media horaria.`,
        'Garantir equipe, mise en place e estoque preparados antes do pico.',
        `${item.count} pedidos`,
        'dashboard',
      ));
    }
  });

  getProductSalesRanking(salesOrders).slice(0, 3).forEach(product => {
    const variation = getProductVariation(salesOrders, product.name);
    if (variation.previous > 0 && variation.variation < -20) {
      insights.push(createInsight(
        `R07-${product.name}`,
        'alerta',
        'atencao',
        'Produto top-3 em queda',
        `${product.name} esta entre os principais produtos, mas caiu mais de 20% frente a semana anterior.`,
        'Verificar ruptura, preparo, preco, exposicao no cardapio e feedback de atendimento.',
        metric(variation.variation),
        'produtos',
      ));
    }
  });

  const cancelRate = getDeliveryCancelRate(deliveryOrders);
  if (cancelRate > 5) {
    insights.push(createInsight(
      'R08',
      'alerta',
      'atencao',
      'Cancelamentos acima de 5%',
      'A taxa de cancelamento do delivery passou do limite aceitavel e pode estar consumindo margem e tempo de cozinha.',
      'Revisar prazo informado, disponibilidade de itens e comunicacao com entregadores.',
      metric(cancelRate),
      'delivery',
    ));
  }

  const ordersByDay = groupOrdersByDay(salesOrders);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = addDays(now, -offset);
    const dayOfWeek = day.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !ordersByDay.has(dateKey(day))) {
      insights.push(createInsight(
        `R09-${dateKey(day)}`,
        'alerta',
        'critico',
        'Nenhum pedido em dia util',
        `Nao ha pedidos registrados em ${day.toLocaleDateString('pt-BR')}. Se a loja abriu, pode haver fechamento nao registrado.`,
        'Conferir caixa, PDV e fechamento operacional desse dia.',
        '0 pedidos',
        'caixa',
      ));
      break;
    }
  }

  const deliveryRevenue = getDeliveryRevenue(deliveryOrders);
  const totalRevenue = sumRevenue(salesOrders) + deliveryRevenue;
  if (totalRevenue > 0 && deliveryRevenue / totalRevenue > 0.3) {
    insights.push(createInsight(
      'R10',
      'tendencia',
      'positivo',
      'Delivery ja representa mais de 30% da receita',
      'O canal de entrega tem participacao relevante no faturamento e merece acompanhamento como unidade operacional propria.',
      'Acompanhar ticket, taxa de entrega, cancelamentos e escala de entregadores separadamente.',
      metric((deliveryRevenue / totalRevenue) * 100),
      'delivery',
    ));
  }

  stockItems.filter(item => item.currentStock < item.minStock).forEach(item => {
    insights.push(createInsight(
      `R11-${item.id}`,
      'alerta',
      'atencao',
      'Item abaixo do estoque minimo',
      `${item.name} esta abaixo do estoque minimo definido. Isso pode causar ruptura de produto e perda de venda.`,
      'Priorizar reposicao ou ajustar disponibilidade dos produtos relacionados.',
      `${item.currentStock}/${item.minStock} ${item.unit}`,
      'estoque',
    ));
  });

  const currentMonthRevenue = computeMonthRevenue(salesOrders, 0);
  const lastMonthRevenue = computeMonthRevenue(salesOrders, 1);
  const twoMonthsAgoRevenue = computeMonthRevenue(salesOrders, 2);
  if (currentMonthRevenue > lastMonthRevenue && lastMonthRevenue > twoMonthsAgoRevenue && twoMonthsAgoRevenue > 0) {
    insights.push(createInsight(
      'R12',
      'tendencia',
      'positivo',
      'Crescimento mensal positivo por 2 meses',
      'A receita esta crescendo de forma consecutiva, o que sugere tracao real e nao apenas pico isolado.',
      'Documentar o que mudou nos ultimos meses e preservar a rotina vencedora.',
      '2+ meses',
      'relatorios',
    ));
  }

  if (collaborators.length === 0 && salesOrders.length > 0) {
    insights.push(createInsight(
      'R-extra-collaborators',
      'oportunidade',
      'info',
      'Vendas sem leitura de equipe',
      'Existem vendas, mas a base de colaboradores nao permite relacionar desempenho por pessoa.',
      'Completar cadastros para ganhar leitura gerencial por atendimento.',
      undefined,
      'colaboradores',
    ));
  }

  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

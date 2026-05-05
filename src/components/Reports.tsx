import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Download } from 'lucide-react';

type Tab = 'vendas' | 'produtos' | 'atendentes';

const downloadCSV = (filename: string, rows: string[][]) => {
  const bom = '﻿'; // UTF-8 BOM for Excel compatibility
  const content = bom + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const Reports: React.FC = () => {
  const { orders, waiters, theme } = useApp();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('vendas');

  const salesData = [...orders].reverse();
  const totalSales = salesData.reduce((acc, o) => acc + o.total, 0);

  const productStats = orders.flatMap(o => o.items).reduce<Record<string, { qty: number; revenue: number }>>((acc, item) => {
    if (!acc[item.product.name]) acc[item.product.name] = { qty: 0, revenue: 0 };
    acc[item.product.name].qty += item.quantity;
    acc[item.product.name].revenue += item.price * item.quantity;
    return acc;
  }, {});

  const productRanking = (Object.entries(productStats) as [string, { qty: number; revenue: number }][])
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, stats]) => ({ name, qty: stats.qty, revenue: stats.revenue }));

  const waiterStats = waiters.map(w => {
    const wOrders = orders.filter(o => o.waiterId === w.id);
    const revenue = wOrders.reduce((acc, o) => acc + o.total, 0);
    const serviceCharge = wOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
    return {
      name: w.name,
      ordersCount: wOrders.length,
      revenue,
      commission: serviceCharge * 0.1,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const handleExport = () => {
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    if (activeTab === 'vendas') {
      const header = ['Data/Hora', 'Pedido', 'Modo', 'Mesa', 'Forma de Pagamento', 'Total (R$)'];
      const rows = salesData.map(o => [
        new Date(o.timestamp).toLocaleString('pt-BR'),
        `#${o.id.slice(-6)}`,
        o.mode === 'mesa' ? 'Mesa' : 'Balcão',
        o.tableNumber?.toString() || '',
        o.payments.map(p => p.method).join(' + ') || '-',
        o.total.toFixed(2).replace('.', ','),
      ]);
      downloadCSV(`vendas_${date}.csv`, [header, ...rows]);
    } else if (activeTab === 'produtos') {
      const header = ['Ranking', 'Produto', 'Qtd Vendida', 'Receita (R$)'];
      const rows = productRanking.map((p, i) => [
        `${i + 1}º`,
        p.name,
        p.qty.toString(),
        p.revenue.toFixed(2).replace('.', ','),
      ]);
      downloadCSV(`ranking_produtos_${date}.csv`, [header, ...rows]);
    } else {
      const header = ['Atendente', 'Pedidos', 'Total Vendido (R$)', 'Comissão (R$)'];
      const rows = waiterStats.map(w => [
        w.name,
        w.ordersCount.toString(),
        w.revenue.toFixed(2).replace('.', ','),
        w.commission.toFixed(2).replace('.', ','),
      ]);
      downloadCSV(`atendentes_${date}.csv`, [header, ...rows]);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'vendas', label: 'Vendas' },
    { id: 'produtos', label: 'Produtos' },
    { id: 'atendentes', label: 'Atendentes' },
  ];

  return (
    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className={`p-1 flex gap-1 rounded-xl ${isDark ? 'bg-[#121214] border border-[#2C2C2E]' : 'bg-gray-100 border border-gray-200'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id ? 'bg-[#E85D75] text-white shadow' : isDark ? 'text-[#A1A1A6] hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={orders.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isDark ? 'border-[#2C2C2E] hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'}`}
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        {activeTab === 'vendas' && (
          <>
            <table className="w-full text-sm text-left">
              <thead className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-[#A1A1A6] border-b border-[#2C2C2E]' : 'text-gray-500 border-b border-gray-200'}`}>
                <tr>
                  <th className="pb-3 font-medium">Data/Hora</th>
                  <th className="pb-3 font-medium">Pedido</th>
                  <th className="pb-3 font-medium">Modo</th>
                  <th className="pb-3 font-medium">Forma de Pagto.</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-200'}`}>
                {salesData.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center opacity-50">Nenhuma venda registrada.</td></tr>
                )}
                {salesData.map(o => (
                  <tr key={o.id} className={isDark ? 'hover:bg-[#252527]' : 'hover:bg-gray-50'}>
                    <td className="py-4">{new Date(o.timestamp).toLocaleString('pt-BR')}</td>
                    <td className="py-4 font-mono">#{o.id.slice(-6)}</td>
                    <td className="py-4">
                      <span className="text-xs uppercase">{o.mode === 'mesa' ? `Mesa ${o.tableNumber}` : 'Balcão'}</span>
                    </td>
                    <td className="py-4 capitalize">{o.payments.map(p => p.method).join(' + ') || '—'}</td>
                    <td className="py-4 text-right font-bold">R$ {o.total.toFixed(2)}</td>
                  </tr>
                ))}
                {salesData.length > 0 && (
                  <tr className={`font-bold ${isDark ? 'bg-[#252527]' : 'bg-gray-50'}`}>
                    <td colSpan={4} className="py-4 px-2 text-right text-xs uppercase tracking-wider opacity-70">Total do Período</td>
                    <td className="py-4 text-right text-[#E85D75]">R$ {totalSales.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'produtos' && (
          <table className="w-full text-sm text-left">
            <thead className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-[#A1A1A6] border-b border-[#2C2C2E]' : 'text-gray-500 border-b border-gray-200'}`}>
              <tr>
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Produto</th>
                <th className="pb-3 font-medium text-right">Qtd Vendida</th>
                <th className="pb-3 font-medium text-right">Receita</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-200'}`}>
              {productRanking.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center opacity-50">Nenhum dado disponível.</td></tr>
              )}
              {productRanking.map((p, i) => (
                <tr key={p.name} className={isDark ? 'hover:bg-[#252527]' : 'hover:bg-gray-50'}>
                  <td className="py-4">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                      ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-600/20 text-orange-500' : 'opacity-50'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-4 font-medium">{p.name}</td>
                  <td className="py-4 text-right font-mono">{p.qty}</td>
                  <td className="py-4 text-right font-bold">R$ {p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'atendentes' && (
          <table className="w-full text-sm text-left">
            <thead className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-[#A1A1A6] border-b border-[#2C2C2E]' : 'text-gray-500 border-b border-gray-200'}`}>
              <tr>
                <th className="pb-3 font-medium">Atendente</th>
                <th className="pb-3 font-medium text-right">Pedidos</th>
                <th className="pb-3 font-medium text-right">Total Vendido</th>
                <th className="pb-3 font-medium text-right">Comissão (10% serviço)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-200'}`}>
              {waiterStats.every(w => w.ordersCount === 0) && (
                <tr><td colSpan={4} className="py-12 text-center opacity-50">Nenhum dado disponível.</td></tr>
              )}
              {waiterStats.map(w => (
                <tr key={w.name} className={isDark ? 'hover:bg-[#252527]' : 'hover:bg-gray-50'}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E85D75] to-[#f39c12] flex items-center justify-center text-white text-xs font-bold">
                        {w.name[0]}
                      </div>
                      <span className="font-bold">{w.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono">{w.ordersCount}</td>
                  <td className="py-4 text-right font-bold">R$ {w.revenue.toFixed(2)}</td>
                  <td className="py-4 text-right font-bold text-green-500">R$ {w.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

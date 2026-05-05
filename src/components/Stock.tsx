import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Plus, Check, X } from 'lucide-react';

export const Stock: React.FC = () => {
  const { products, updateProduct, theme } = useApp();
  const isDark = theme === 'dark';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editMinId, setEditMinId] = useState<string | null>(null);
  const [editMinValue, setEditMinValue] = useState('');

  const startAddStock = (id: string) => {
    setEditingId(id);
    setEditValue('');
    setEditMinId(null);
  };

  const confirmAddStock = (id: string) => {
    const add = parseInt(editValue, 10);
    if (!isNaN(add) && add > 0) {
      const p = products.find(prod => prod.id === id);
      if (p) updateProduct({ ...p, stock: p.stock + add });
    }
    setEditingId(null);
    setEditValue('');
  };

  const startEditMin = (id: string, current: number) => {
    setEditMinId(id);
    setEditMinValue(current.toString());
    setEditingId(null);
  };

  const confirmEditMin = (id: string) => {
    const val = parseInt(editMinValue, 10);
    if (!isNaN(val) && val >= 0) {
      const p = products.find(prod => prod.id === id);
      if (p) updateProduct({ ...p, minStock: val });
    }
    setEditMinId(null);
    setEditMinValue('');
  };

  const toggleControl = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (p) updateProduct({ ...p, controlsStock: !p.controlsStock });
  };

  const getStatusNode = (p: typeof products[0]) => {
    if (!p.controlsStock) return <span className={`text-xs ${isDark ? 'text-[#A1A1A6]' : 'text-gray-400'}`}>—</span>;
    if (p.stock <= 0)
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/15 text-red-500 text-[10px] font-bold uppercase"><i className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Crítico</span>;
    if (p.stock <= p.minStock)
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase"><i className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Baixo</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/15 text-green-500 text-[10px] font-bold uppercase"><i className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> OK</span>;
  };

  const alertCount = products.filter(p => p.controlsStock && p.stock <= p.minStock).length;

  return (
    <div className="space-y-4">
      {alertCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium">
          <i className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
          {alertCount} produto{alertCount > 1 ? 's' : ''} com estoque baixo ou crítico
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-[10px] uppercase tracking-wider ${isDark ? 'bg-[#252527] text-[#A1A1A6] border-b border-[#2C2C2E]' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}>
              <tr>
                <th className="px-6 py-4 font-bold">Produto</th>
                <th className="px-6 py-4 font-bold">Categoria</th>
                <th className="px-6 py-4 font-bold">Controla?</th>
                <th className="px-6 py-4 font-bold">Estoque Atual</th>
                <th className="px-6 py-4 font-bold">Mínimo</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Entrada</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-200'}`}>
              {products.map(p => (
                <tr key={p.id} className={`${isDark ? 'hover:bg-[#252527]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-[#A1A1A6]' : 'text-gray-600'}`}>{p.category}</td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={p.controlsStock}
                      onChange={() => toggleControl(p.id)}
                      className="accent-[#E85D75] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    {p.controlsStock ? `${p.stock} ${p.unit}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {p.controlsStock ? (
                      editMinId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="number"
                            min="0"
                            value={editMinValue}
                            onChange={e => setEditMinValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmEditMin(p.id); if (e.key === 'Escape') setEditMinId(null); }}
                            className={`w-16 px-2 py-1 text-sm rounded-lg border outline-none font-mono ${isDark ? 'bg-[#121214] border-[#E85D75] text-white' : 'bg-white border-[#E85D75]'}`}
                          />
                          <button onClick={() => confirmEditMin(p.id)} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditMinId(null)} className="opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditMin(p.id, p.minStock)}
                          className={`font-mono hover:underline px-2 py-0.5 rounded transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                        >
                          {p.minStock}
                        </button>
                      )
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">{getStatusNode(p)}</td>
                  <td className="px-6 py-4 text-right">
                    {p.controlsStock && (
                      editingId === p.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            autoFocus
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmAddStock(p.id); if (e.key === 'Escape') setEditingId(null); }}
                            className={`w-20 px-2 py-1 text-sm rounded-lg border outline-none font-mono text-center ${isDark ? 'bg-[#121214] border-[#E85D75] text-white' : 'bg-white border-[#E85D75]'}`}
                          />
                          <button onClick={() => confirmAddStock(p.id)} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAddStock(p.id)}
                          title="Adicionar estoque"
                          className={`p-1.5 rounded-lg border transition-colors
                            ${isDark ? 'bg-[#121214] border-[#2C2C2E] hover:bg-[#E85D75]/20 hover:text-[#E85D75] hover:border-[#E85D75]/40' : 'bg-white border-gray-300 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

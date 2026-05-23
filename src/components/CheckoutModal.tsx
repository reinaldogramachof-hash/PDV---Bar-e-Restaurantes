import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Order, PaymentMethod, PaymentItem } from '../types';
import { X } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface CheckoutModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'credito',  label: 'Crédito'  },
  { id: 'debito',   label: 'Débito'   },
  { id: 'pix',      label: 'PIX'      },
  { id: 'vr',       label: 'VR'       },
  { id: 'va',       label: 'VA'       },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ order, onClose, onSuccess }) => {
  const { theme, closeOrder, waiters } = useApp();
  const isDark = theme === 'dark';

  const [includeService, setIncludeService] = useState(true);
  const [splitCount, setSplitCount] = useState(2);
  const [splitMode, setSplitMode] = useState<'nenhum' | 'pessoas'>('nenhum');
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('credito');
  const [amountInput, setAmountInput] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const serviceCharge = includeService && order.mode === 'mesa' ? order.subtotal * 0.1 : 0;
  const totalAmount = order.subtotal + serviceCharge;

  const amountPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const amountRemaining = Math.max(0, totalAmount - amountPaid);
  const troco = Math.max(0, amountPaid - totalAmount);

  useEffect(() => {
    if (amountInput === '' && amountRemaining > 0) {
      setAmountInput(amountRemaining.toFixed(2));
    }
  }, [amountRemaining, amountInput]);

  const handleAddPayment = () => {
    const val = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    setPayments(prev => [...prev, { method: currentMethod, amount: val }]);
    setAmountInput('');
  };

  const handleRemovePayment = (idx: number) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
    setAmountInput('');
  };

  const handleFinish = () => {
    closeOrder(order, payments, serviceCharge);
    setShowReceipt(true);
  };

  if (showReceipt) {
    return (
      <ReceiptModal
        order={{ ...order, serviceCharge, total: totalAmount, payments }}
        onClose={() => { setShowReceipt(false); onSuccess(); }}
      />
    );
  }

  const waiterName = waiters.find(w => w.id === order.waiterId)?.name || 'Balcão';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-panel border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden
        ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}>

        <div className={`p-5 flex justify-between items-center border-b ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}>
          <div>
            <h2 className="text-lg font-bold">Fechamento de Conta</h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}`}>
              {order.mode === 'mesa' ? `Mesa ${order.tableNumber?.toString().padStart(2, '0')}` : 'Balcão'} · Atendente: {waiterName}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 opacity-60 hover:opacity-100" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Left: summary + split */}
          <div className="space-y-6">
            <div>
              <h3 className={`text-xs font-bold mb-3 tracking-wider ${isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}`}>Resumo</h3>
              <div className={`space-y-2 p-4 rounded-control border text-sm ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className={isDark ? 'text-[var(--color-muted)]' : 'text-gray-600'}>
                      {item.quantity}× {item.product.name}
                    </span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className={`flex justify-between pt-2 mt-2 border-t ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}>
                  <span>Subtotal</span>
                  <span className="font-medium">R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.mode === 'mesa' && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={includeService}
                      onChange={e => setIncludeService(e.target.checked)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span>Taxa de serviço (10%)</span>
                    <span className="ml-auto">R$ {(order.subtotal * 0.1).toFixed(2)}</span>
                  </label>
                )}
                <div className={`flex justify-between text-lg font-bold pt-3 mt-1 border-t ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}>
                  <span>Total</span>
                  <span className="text-[var(--color-accent)]">R$ {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xs font-bold mb-3 tracking-wider ${isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}`}>Divisão de Conta</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSplitMode('nenhum')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors
                    ${splitMode === 'nenhum' ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : isDark ? 'border-[var(--color-border)] hover:bg-white/5' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  Não dividir
                </button>
                <button
                  onClick={() => setSplitMode('pessoas')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors
                    ${splitMode === 'pessoas' ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : isDark ? 'border-[var(--color-border)] hover:bg-white/5' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  Por pessoa
                </button>
              </div>
              {splitMode === 'pessoas' && (
                <div className={`flex items-center gap-3 p-3 rounded-control border ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-sm">Dividir entre</span>
                  <input
                    type="number"
                    min="2"
                    value={splitCount}
                    onChange={e => setSplitCount(Number(e.target.value))}
                    className={`w-14 p-1.5 text-center rounded-lg border text-sm outline-none ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-white' : 'bg-white border-gray-300'}`}
                  />
                  <span className="text-sm ml-auto font-bold text-[var(--color-accent)]">
                    R$ {(totalAmount / splitCount).toFixed(2)} / cada
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: payments */}
          <div className="space-y-5">
            <div>
              <h3 className={`text-xs font-bold mb-3 tracking-wider ${isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}`}>Forma de Pagamento</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setCurrentMethod(pm.id)}
                    className={`py-2 text-sm rounded-lg border transition-colors
                      ${currentMethod === pm.id
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]'
                        : isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] hover:border-[var(--color-border)]' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}`}>R$</span>
                  <input
                    type="text"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border outline-none ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white focus:border-[var(--color-accent)]' : 'bg-white border-gray-300 focus:border-[var(--color-accent)]'}`}
                  />
                </div>
                <button
                  onClick={handleAddPayment}
                  className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-bold hover:brightness-110"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {payments.length > 0 && (
              <div className={`p-4 rounded-control border space-y-2 text-sm ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                {payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="capitalize">{p.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">R$ {p.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemovePayment(idx)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${isDark ? 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-red-800 hover:text-red-500' : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-500'}`}
                      >
                        remover
                      </button>
                    </div>
                  </div>
                ))}
                <div className={`border-t pt-3 mt-2 space-y-1.5 ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}>Total pago</span>
                    <span className="font-bold text-green-500">R$ {amountPaid.toFixed(2)}</span>
                  </div>
                  {amountRemaining > 0.01 && (
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-[var(--color-muted)]' : 'text-gray-500'}>Falta</span>
                      <span className="font-bold text-red-500">R$ {amountRemaining.toFixed(2)}</span>
                    </div>
                  )}
                  {troco > 0.01 && (
                    <div className="flex justify-between font-bold text-amber-400">
                      <span>Troco</span>
                      <span>R$ {troco.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-control text-sm font-medium border transition-colors ${isDark ? 'border-[var(--color-border)] hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Cancelar
          </button>
          <button
            onClick={handleFinish}
            disabled={amountPaid < totalAmount - 0.01}
            className="px-8 py-2.5 rounded-control bg-green-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
};

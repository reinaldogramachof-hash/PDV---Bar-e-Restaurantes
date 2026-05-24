import React, { useMemo, useState } from 'react';
import {
  BellRing, CheckCircle2, ImageIcon, Minus, Plus, ShoppingCart, Utensils, X, Zap,
} from 'lucide-react';
import { Campaign, CartItem, Combo, MenuConfig, OnlineOrderChannel, Product, Promotion } from '../types';
import { DEFAULT_EMPRESA_ID, buildScopedStorageKey } from '../domain/saas';
import { getMenuProducts } from '../services/menuDigitalService';
import { getProductDiscount } from '../services/salesService';

interface CustomerMenuViewProps {
  empresaId?: string;
  productsOverride?: Product[];
  combosOverride?: Combo[];
  promotionsOverride?: Promotion[];
  campaignsOverride?: Campaign[];
  menuConfigOverride?: MenuConfig;
  restaurantName?: string;
  preview?: boolean;
}

const fallbackMenuConfig = (empresaId: string): MenuConfig => ({
  empresaId,
  accentColor: '#E07B4A',
  showPrices: true,
  allowCallWaiter: true,
});

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const getEmpresaFromPath = () => {
  if (typeof window === 'undefined') return DEFAULT_EMPRESA_ID;
  const match = window.location.pathname.match(/\/cardapio\/([^/]+)/);
  return match?.[1] || DEFAULT_EMPRESA_ID;
};

const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CHANNEL_LABELS: Record<OnlineOrderChannel, string> = {
  mesa: 'Mesa', delivery: 'Delivery', balcao: 'Balcão',
};

// ─── Checkout Modal ───────────────────────────────────────────────────────────

interface CheckoutModalProps {
  cart: CartItem[];
  menuConfig: MenuConfig;
  onClose: () => void;
  onSuccess: () => void;
  preview?: boolean;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ cart, menuConfig, onClose, onSuccess, preview }) => {
  const [channel, setChannel] = useState<OnlineOrderChannel>('mesa');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableRef, setTableRef] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleSend = () => {
    if (preview) { setSubmitted(true); return; }
    const phone = menuConfig.whatsappPhone;
    if (!phone) {
      alert('WhatsApp não configurado. Configure em Cardápio Digital → Aparência.');
      return;
    }
    const lines: string[] = [
      `*Novo Pedido — ${CHANNEL_LABELS[channel]}*`,
      `👤 ${customerName}`,
      channel === 'mesa' ? `🪑 Mesa: ${tableRef}` :
        channel === 'delivery' ? `📍 Endereço: ${address}` : '🧾 Balcão',
      '',
      '*Itens:*',
      ...cart.map(item => `• ${item.qty}x ${item.name} — ${formatMoney(item.price * item.qty)}`),
      '',
      `*Total: ${formatMoney(total)}*`,
    ];
    if (customerPhone) lines.push(`📞 ${customerPhone}`);
    if (orderNotes) lines.push(`📝 ${orderNotes}`);

    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
    setSubmitted(true);
    onSuccess();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Pedido enviado!</h3>
          <p className="text-sm text-white/60 mb-6">Aguarde a confirmação do restaurante.</p>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: menuConfig.accentColor }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
      <div className="w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Finalizar Pedido</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canal */}
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-2">Tipo de pedido</p>
          <div className="grid grid-cols-3 gap-2">
            {(['mesa', 'delivery', 'balcao'] as OnlineOrderChannel[]).map(ch => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className="h-10 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: channel === ch ? menuConfig.accentColor : 'rgba(255,255,255,0.1)',
                  backgroundColor: channel === ch ? `${menuConfig.accentColor}22` : 'var(--color-elevated)',
                  color: channel === ch ? menuConfig.accentColor : 'rgba(255,255,255,0.6)',
                }}
              >
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>
        </div>

        {/* Campos */}
        <div className="space-y-3 mb-4">
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Seu nome *"
            className="w-full h-11 px-4 rounded-xl bg-[var(--color-elevated)] text-[var(--color-text)] text-sm border border-white/10 focus:outline-none focus:border-white/30"
          />
          <input
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            placeholder="Telefone (opcional)"
            className="w-full h-11 px-4 rounded-xl bg-[var(--color-elevated)] text-[var(--color-text)] text-sm border border-white/10 focus:outline-none focus:border-white/30"
          />
          {channel === 'mesa' && (
            <input
              value={tableRef}
              onChange={e => setTableRef(e.target.value)}
              placeholder="Número da mesa"
              className="w-full h-11 px-4 rounded-xl bg-[var(--color-elevated)] text-[var(--color-text)] text-sm border border-white/10 focus:outline-none focus:border-white/30"
            />
          )}
          {channel === 'delivery' && (
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Endereço de entrega"
              className="w-full h-11 px-4 rounded-xl bg-[var(--color-elevated)] text-[var(--color-text)] text-sm border border-white/10 focus:outline-none focus:border-white/30"
            />
          )}
          <textarea
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-elevated)] text-[var(--color-text)] text-sm border border-white/10 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        {/* Resumo */}
        <div className="rounded-xl bg-[var(--color-app-base)] p-4 mb-4 space-y-1">
          {cart.map(item => (
            <div key={item.productId} className="flex justify-between text-sm text-white/70">
              <span>{item.qty}x {item.name}</span>
              <span>{formatMoney(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10 mt-2">
            <span>Total</span><span>{formatMoney(total)}</span>
          </div>
        </div>

        {!menuConfig.whatsappPhone && !preview && (
          <p className="text-xs text-amber-400 mb-3 text-center">
            Configure o WhatsApp em Cardápio Digital → Aparência para habilitar o envio.
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={!customerName}
          className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: menuConfig.accentColor }}
        >
          Enviar Pedido via WhatsApp
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  empresaId,
  productsOverride,
  combosOverride,
  promotionsOverride,
  campaignsOverride,
  menuConfigOverride,
  restaurantName = 'Gestao Gastro',
  preview = false,
}) => {
  const resolvedEmpresaId = empresaId || getEmpresaFromPath();
  const products = productsOverride || readStorage<Product[]>(buildScopedStorageKey('products', resolvedEmpresaId), []);
  const combos = combosOverride || readStorage<Combo[]>(buildScopedStorageKey('combos', resolvedEmpresaId), []);
  const promotions = promotionsOverride || readStorage<Promotion[]>(buildScopedStorageKey('promotions', resolvedEmpresaId), []);
  const campaigns = campaignsOverride || readStorage<Campaign[]>(buildScopedStorageKey('campaigns', resolvedEmpresaId), []);
  const menuConfig = menuConfigOverride || readStorage<MenuConfig>(
    buildScopedStorageKey('menuConfig', resolvedEmpresaId),
    fallbackMenuConfig(resolvedEmpresaId),
  );
  const groupedProducts = useMemo(() => getMenuProducts(products, combos), [products, combos]);
  const categories = Object.keys(groupedProducts);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0] || null);
  const [calledWaiter, setCalledWaiter] = useState(false);

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const addToCart = (product: Product, finalPrice: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, qty: 1, price: finalPrice }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.productId === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    );
  };

  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

  const handleCallWaiter = () => {
    setCalledWaiter(true);
    window.setTimeout(() => setCalledWaiter(false), 3000);
  };

  return (
    <div className={`${preview ? 'min-h-full' : 'min-h-screen'} bg-[var(--color-app-base)] text-[var(--color-text)] font-sans`}>
      <header className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${menuConfig.accentColor}22`, color: menuConfig.accentColor }}>
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Cardapio digital</p>
            <h1 className="text-xl font-semibold">{restaurantName}</h1>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-white/70">
          {menuConfig.welcomeMessage || 'Bem-vindo. Escolha seus favoritos e aproveite a experiencia.'}
        </p>
        {/* Badge informativo Fase 3 */}
        <p className="mt-2 text-[10px] text-white/30 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Pedidos em tempo real disponíveis na Fase 3
        </p>
      </header>

      <nav className="sticky top-0 z-10 bg-[var(--color-app-base)]/95 backdrop-blur border-y border-white/10 overflow-x-auto">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="h-9 px-4 rounded-full text-xs font-semibold border transition-all"
              style={{
                borderColor: activeCategory === category ? menuConfig.accentColor : 'rgba(255,255,255,0.1)',
                backgroundColor: activeCategory === category ? `${menuConfig.accentColor}22` : 'var(--color-surface)',
                color: activeCategory === category ? menuConfig.accentColor : 'rgba(255,255,255,0.72)',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 py-5 space-y-8">
        {categories.length === 0 && (
          <div className="py-20 text-center text-white/60">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Cardapio em preparacao.</p>
          </div>
        )}

        {categories.map(category => (
          <section key={category} className="scroll-mt-20">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: menuConfig.accentColor }}>
              {category}
            </h2>
            <div className="space-y-3">
              {groupedProducts[category].map(product => {
                const description = product.menuDigital?.description || product.description;
                const discountInfo = getProductDiscount(product, promotions, campaigns);
                const finalPrice = Math.max(0, product.price - (discountInfo?.discount || 0));
                const cartQty = cart.find(i => i.productId === product.id)?.qty ?? 0;
                return (
                  <article key={product.id} className="rounded-xl p-4 bg-[var(--color-surface)] border border-white/5">
                    <div className="flex gap-4">
                      {product.menuDigital?.imageBase64 ? (
                        <img src={product.menuDigital.imageBase64} alt={product.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-semibold shrink-0" style={{ backgroundColor: `${menuConfig.accentColor}22`, color: menuConfig.accentColor }}>
                          {product.name.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
                          {product.menuDigital?.highlight && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${menuConfig.accentColor}22`, color: menuConfig.accentColor }}>
                              {product.menuDigital.highlightLabel || 'Destaque'}
                            </span>
                          )}
                          {discountInfo && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-emerald-500/15 text-emerald-300">
                              {discountInfo.promotionName}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{description}</p>
                        {menuConfig.showPrices && (
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              {discountInfo && <span className="text-xs text-white/35 line-through">{formatMoney(product.price)}</span>}
                              <p className="text-lg font-semibold" style={{ color: menuConfig.accentColor }}>
                                {formatMoney(finalPrice)}
                              </p>
                            </div>
                            {/* Qty controls */}
                            {cartQty > 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => changeQty(product.id, -1)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center border border-white/20 text-white/60"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold w-4 text-center">{cartQty}</span>
                                <button
                                  onClick={() => addToCart(product, finalPrice)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: menuConfig.accentColor }}
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product, finalPrice)}
                                className="h-8 px-3 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: `${menuConfig.accentColor}22`, color: menuConfig.accentColor }}
                              >
                                + Adicionar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <footer className="px-4 pb-8 pt-2 space-y-4" style={{ paddingBottom: totalItems > 0 ? '5rem' : undefined }}>
        {menuConfig.allowCallWaiter && (
          <button
            onClick={handleCallWaiter}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: menuConfig.accentColor, color: 'var(--color-app-base)' }}
          >
            {calledWaiter ? (
              <><CheckCircle2 className="w-5 h-5 animate-pulse" />Garcom a caminho!</>
            ) : (
              <><BellRing className="w-5 h-5" />Chamar Garcom</>
            )}
          </button>
        )}
        <p className="text-center text-xs text-white/45">
          {menuConfig.footerMessage || 'Consulte nossa equipe em caso de alergias ou restricoes alimentares.'}
        </p>
      </footer>

      {/* Floating cart button */}
      {totalItems > 0 && !cartOpen && !checkoutOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 h-14 rounded-full shadow-lg text-white font-bold text-sm"
          style={{ backgroundColor: menuConfig.accentColor }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
          <span className="opacity-80">{formatMoney(cartTotal)}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="relative w-full bg-[var(--color-surface)] rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Seu pedido</h3>
              <button onClick={() => setCartOpen(false)} className="text-white/40">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.productId, -1)} className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-white">{item.qty}</span>
                    <button onClick={() => changeQty(item.productId, 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: menuConfig.accentColor }}>
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-white w-20 text-right">{formatMoney(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-base font-bold text-white mb-5 pt-4 border-t border-white/10">
              <span>Total</span><span>{formatMoney(cartTotal)}</span>
            </div>
            <button
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              className="w-full h-12 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: menuConfig.accentColor }}
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          menuConfig={menuConfig}
          preview={preview}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => { setCart([]); setCartOpen(false); }}
        />
      )}
    </div>
  );
};

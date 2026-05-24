import React, { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, ImageIcon, Utensils } from 'lucide-react';
import { Campaign, Combo, MenuConfig, Product, Promotion } from '../types';
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

  const handleCallWaiter = () => {
    setCalledWaiter(true);
    window.setTimeout(() => setCalledWaiter(false), 3000);
  };

  return (
    <div className={`${preview ? 'min-h-full' : 'min-h-screen'} bg-[#0F0F11] text-white font-sans`}>
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
      </header>

      <nav className="sticky top-0 z-10 bg-[#0F0F11]/95 backdrop-blur border-y border-white/10 overflow-x-auto">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="h-9 px-4 rounded-full text-xs font-semibold border transition-all"
              style={{
                borderColor: activeCategory === category ? menuConfig.accentColor : 'rgba(255,255,255,0.1)',
                backgroundColor: activeCategory === category ? `${menuConfig.accentColor}22` : '#1A1A1E',
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
                return (
                  <article key={product.id} className="rounded-xl p-4 bg-[#1A1A1E] border border-white/5">
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
                          <div className="mt-2 flex items-baseline gap-2">
                            {discountInfo && <span className="text-xs text-white/35 line-through">{formatMoney(product.price)}</span>}
                            <p className="text-lg font-semibold" style={{ color: menuConfig.accentColor }}>
                              {formatMoney(finalPrice)}
                            </p>
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

      <footer className="px-4 pb-8 pt-2 space-y-4">
        {menuConfig.allowCallWaiter && (
          <button
            onClick={handleCallWaiter}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: menuConfig.accentColor, color: '#0F0F11' }}
          >
            {calledWaiter ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
                Garcom a caminho!
              </>
            ) : (
              <>
                <BellRing className="w-5 h-5" />
                Chamar Garcom
              </>
            )}
          </button>
        )}
        <p className="text-center text-xs text-white/45">
          {menuConfig.footerMessage || 'Consulte nossa equipe em caso de alergias ou restricoes alimentares.'}
        </p>
      </footer>
    </div>
  );
};

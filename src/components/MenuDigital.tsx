import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  ImagePlus,
  MonitorSmartphone,
  QrCode,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MenuConfig, MenuDigitalConfig, Product } from '../types';
import { useApp } from '../store/AppContext';
import { CustomerMenuView } from './CustomerMenuView';
import { downloadQR, generateQRCode, getMenuUrl } from '../services/menuDigitalService';

type Tab = 'cardapio' | 'aparencia' | 'qrcode' | 'preview';

const highlightOptions = ['Chef recomenda', 'Mais pedido', 'Novidade', 'Promocao'];

const resizeImage = async (file: File): Promise<string> => {
  if (file.size > 2 * 1024 * 1024) throw new Error('Imagem acima de 2MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use JPG, PNG ou WEBP.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nao foi possivel processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/webp', 0.82);
};

const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const MenuDigital: React.FC = () => {
  const {
    currentEmpresa,
    products,
    combos,
    promotions,
    campaigns,
    menuConfig,
    updateMenuConfig,
    updateProductMenuDigital,
    theme,
  } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const mutedPanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';
  const [activeTab, setActiveTab] = useState<Tab>('cardapio');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingData, setEditingData] = useState<MenuDigitalConfig>({ visible: false });
  const [imageError, setImageError] = useState('');
  const [draftConfig, setDraftConfig] = useState<MenuConfig>(menuConfig);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const activeProducts = useMemo(() => products.filter(product => product.active !== false), [products]);
  const menuUrl = getMenuUrl(currentEmpresa.id);

  useEffect(() => {
    setDraftConfig(menuConfig);
  }, [menuConfig]);

  useEffect(() => {
    generateQRCode(currentEmpresa.id).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [currentEmpresa.id]);

  const openProductConfig = (product: Product) => {
    setEditingProduct(product);
    setEditingData({
      visible: product.menuDigital?.visible ?? false,
      description: product.menuDigital?.description || product.description,
      imageBase64: product.menuDigital?.imageBase64,
      highlight: product.menuDigital?.highlight || false,
      highlightLabel: product.menuDigital?.highlightLabel || 'Chef recomenda',
    });
    setImageError('');
  };

  const saveProductConfig = () => {
    if (!editingProduct) return;
    updateProductMenuDigital(editingProduct.id, editingData);
    setEditingProduct(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImageError('');
      const imageBase64 = await resizeImage(file);
      setEditingData(prev => ({ ...prev, imageBase64 }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Erro ao processar imagem.');
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cardapio Digital</h2>
          <p className="text-xs text-muted mt-1">Configure produtos, aparencia, QR Code e preview do cliente.</p>
        </div>
        <div className={`flex overflow-x-auto p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
          {([
            ['cardapio', 'Cardapio'],
            ['aparencia', 'Aparencia'],
            ['qrcode', 'QR Code'],
            ['preview', 'Preview'],
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-3 py-2 rounded-control text-xs font-medium whitespace-nowrap ${activeTab === id ? 'bg-accent text-white' : 'text-muted hover:text-current'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'cardapio' && (
        <section className={`rounded-panel border overflow-hidden ${panelClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`text-xs border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                <tr>
                  <th className="px-4 py-3">Visivel</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preco</th>
                  <th className="px-4 py-3">Destaque</th>
                  <th className="px-4 py-3 text-right">Config</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/5">
                {activeProducts.map(product => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateProductMenuDigital(product.id, { visible: !(product.menuDigital?.visible ?? false) })}
                        className={`w-10 h-6 rounded-full relative transition-colors ${product.menuDigital?.visible ? 'bg-success' : 'bg-current/10'}`}
                        aria-label="Alternar visibilidade"
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${product.menuDigital?.visible ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">{product.category}</td>
                    <td className="px-4 py-3 text-xs">{formatMoney(product.price)}</td>
                    <td className="px-4 py-3">
                      {product.menuDigital?.highlight ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                          <Star className="w-3 h-3" /> {product.menuDigital.highlightLabel || 'Destaque'}
                        </span>
                      ) : <span className="text-xs text-muted">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openProductConfig(product)} className="w-8 h-8 rounded-control bg-accent/10 text-accent inline-flex items-center justify-center" aria-label="Editar config">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'aparencia' && (
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
          <div className={`rounded-panel border p-5 space-y-4 ${panelClass}`}>
            <label className="space-y-2 block">
              <span className="text-xs text-muted">Cor de destaque</span>
              <div className="flex items-center gap-3">
                <input type="color" value={draftConfig.accentColor} onChange={event => setDraftConfig(prev => ({ ...prev, accentColor: event.target.value }))} className="w-12 h-10 rounded-control border-0 bg-transparent" />
                <span className="text-sm font-semibold">{draftConfig.accentColor}</span>
              </div>
            </label>
            <label className="space-y-2 block">
              <span className="text-xs text-muted">Mensagem de boas-vindas</span>
              <input maxLength={80} value={draftConfig.welcomeMessage || ''} onChange={event => setDraftConfig(prev => ({ ...prev, welcomeMessage: event.target.value }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
            <label className="space-y-2 block">
              <span className="text-xs text-muted">Mensagem de rodape</span>
              <input maxLength={120} value={draftConfig.footerMessage || ''} onChange={event => setDraftConfig(prev => ({ ...prev, footerMessage: event.target.value }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
            <label className="space-y-2 block">
              <span className="text-xs text-muted">WhatsApp para pedidos</span>
              <input
                maxLength={20}
                value={draftConfig.whatsappPhone || ''}
                onChange={event => setDraftConfig(prev => ({ ...prev, whatsappPhone: event.target.value }))}
                placeholder="11999999999"
                className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}
              />
              <p className="text-[11px] text-muted">Usado pelo cardápio digital para enviar pedidos. Formato: 11999999999 (sem +55, sem espaços)</p>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Exibir precos', 'showPrices'],
                ['Permitir chamar garcom', 'allowCallWaiter'],
              ].map(([label, key]) => (
                <button key={key} type="button" onClick={() => setDraftConfig(prev => ({ ...prev, [key]: !prev[key as keyof MenuConfig] }))} className={`h-11 px-4 rounded-control border text-sm font-medium text-left ${draftConfig[key as keyof MenuConfig] ? 'border-success bg-success/10 text-success' : isDark ? 'border-border' : 'border-border-light'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => updateMenuConfig(draftConfig)} className="h-10 px-5 rounded-control bg-accent text-white text-xs font-medium">
              Salvar Aparencia
            </button>
          </div>

          <div className="rounded-[2rem] bg-[#0F0F11] p-5 text-white shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-4">Preview do header</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${draftConfig.accentColor}22`, color: draftConfig.accentColor }}>
                <MonitorSmartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{currentEmpresa.name}</h3>
                <p className="text-xs text-white/60">{draftConfig.welcomeMessage || 'Bem-vindo ao nosso cardapio digital.'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'qrcode' && (
        <section className={`rounded-panel border p-6 ${panelClass}`}>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-center">
            <div className={`rounded-panel border p-5 flex items-center justify-center ${mutedPanelClass}`}>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code do cardapio" className="w-52 h-52" /> : <QrCode className="w-24 h-24 text-muted" />}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">QR Code do Cardapio Digital</h3>
                <p className="text-sm text-muted mt-1">Imprima e afixe na mesa ou balcao. Clientes escaneiam com a camera do celular.</p>
              </div>
              <div className="flex gap-2">
                <input readOnly value={menuUrl} className={`flex-1 h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                <button onClick={copyUrl} className="h-10 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copiar
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button disabled={!qrDataUrl} onClick={() => downloadQR(qrDataUrl, currentEmpresa.name)} className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium flex items-center gap-2 disabled:opacity-40">
                  <Download className="w-4 h-4" /> Baixar QR Code PNG
                </button>
                <button onClick={() => window.open(`/cardapio/${currentEmpresa.id}`, '_blank')} className={`h-10 px-4 rounded-control border text-xs font-medium flex items-center gap-2 ${mutedPanelClass}`}>
                  <Eye className="w-4 h-4" /> Abrir Preview
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'preview' && (
        <section className="flex justify-center">
          <div className="relative rounded-[2.5rem] border-[10px] border-black bg-black shadow-2xl">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold text-white z-10">
              Preview - como o cliente ve
            </span>
            <div className="w-[375px] max-w-[calc(100vw-4rem)] h-[720px] overflow-y-auto rounded-[1.8rem] bg-[#0F0F11] custom-scrollbar">
              <CustomerMenuView
                preview
                empresaId={currentEmpresa.id}
                productsOverride={products}
                combosOverride={combos}
                promotionsOverride={promotions}
                campaignsOverride={campaigns}
                menuConfigOverride={menuConfig}
                restaurantName={currentEmpresa.name}
              />
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProduct(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.96 }} className={`relative w-full max-w-xl rounded-panel border shadow-2xl ${panelClass}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-current/10">
                <div>
                  <h3 className="text-base font-semibold">{editingProduct.name}</h3>
                  <p className="text-xs text-muted">Config do Cardapio Digital</p>
                </div>
                <button onClick={() => setEditingProduct(null)} className="w-8 h-8 rounded-control flex items-center justify-center text-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <label className="space-y-2 block">
                  <span className="text-xs text-muted">Descricao para o cliente</span>
                  <textarea rows={3} value={editingData.description || ''} onChange={event => setEditingData(prev => ({ ...prev, description: event.target.value }))} className={`w-full px-3 py-2 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
                  <div className={`h-28 rounded-panel border flex items-center justify-center overflow-hidden ${mutedPanelClass}`}>
                    {editingData.imageBase64 ? <img src={editingData.imageBase64} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-8 h-8 text-muted" />}
                  </div>
                  <div className="space-y-2">
                    <label className="h-10 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium inline-flex items-center gap-2 cursor-pointer">
                      <ImagePlus className="w-4 h-4" /> Enviar foto
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <p className="text-xs text-muted">JPG, PNG ou WEBP. Maximo 2MB. Redimensiona para 800px.</p>
                    {imageError && <p className="text-xs text-danger">{imageError}</p>}
                  </div>
                </div>

                <button onClick={() => setEditingData(prev => ({ ...prev, highlight: !prev.highlight }))} className={`h-10 px-4 rounded-control border text-xs font-medium ${editingData.highlight ? 'bg-accent/10 text-accent border-accent/30' : mutedPanelClass}`}>
                  {editingData.highlight ? 'Produto destacado' : 'Destacar produto'}
                </button>

                <label className="space-y-2 block">
                  <span className="text-xs text-muted">Label de destaque</span>
                  <input list="highlight-options" value={editingData.highlightLabel || ''} onChange={event => setEditingData(prev => ({ ...prev, highlightLabel: event.target.value }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  <datalist id="highlight-options">
                    {highlightOptions.map(option => <option key={option} value={option} />)}
                  </datalist>
                </label>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setEditingProduct(null)} className="flex-1 h-10 rounded-control text-xs font-medium text-muted">Cancelar</button>
                <button onClick={saveProductConfig} className="flex-[2] h-10 rounded-control bg-accent text-white text-xs font-medium">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

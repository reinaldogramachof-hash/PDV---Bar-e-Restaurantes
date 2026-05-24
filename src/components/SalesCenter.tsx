import React, { useMemo, useState } from 'react';
import {
  BadgePercent,
  CalendarClock,
  Check,
  Gift,
  History,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Campaign, Combo, LoyaltyEntry, Product, Promotion } from '../types';
import { useApp } from '../store/AppContext';
import { SecurityGate } from './SecurityGate';
import {
  calcComboOriginalPrice,
  calcComboSaving,
  getActiveCampaigns,
  getActivePromotions,
  getCustomerPoints,
} from '../services/salesService';

type Tab = 'promocoes' | 'combos' | 'fidelidade' | 'campanhas';

type PromotionDraft = Omit<Promotion, 'id' | 'empresaId' | 'createdAt'>;
type ComboDraft = Omit<Combo, 'id' | 'empresaId' | 'createdAt'>;
type CampaignDraft = Omit<Campaign, 'id' | 'empresaId' | 'createdAt'>;

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayDate = () => new Date().toISOString().slice(0, 10);
const inSevenDays = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const toDateValue = (iso: string) => (iso || '').slice(0, 10);
const fromDateValue = (date: string, end = false) => `${date || todayDate()}T${end ? '23:59:59.999' : '00:00:00.000'}Z`;

const emptyPromotionDraft = (): PromotionDraft => ({
  name: '',
  type: 'percent',
  value: 10,
  productIds: [],
  categoryIds: [],
  startsAt: fromDateValue(todayDate()),
  endsAt: fromDateValue(inSevenDays(), true),
  active: true,
});

const emptyComboDraft = (): ComboDraft => ({
  name: '',
  description: '',
  items: [],
  originalPrice: 0,
  comboPrice: 0,
  active: true,
  menuDigital: { visible: false, highlight: true, highlightLabel: 'Combo' },
});

const emptyCampaignDraft = (promotionId = ''): CampaignDraft => ({
  name: '',
  promotionId,
  daysOfWeek: [5],
  startsHour: 17,
  endsHour: 19,
  active: true,
});

const resizeImage = async (file: File): Promise<string> => {
  if (file.size > 2 * 1024 * 1024) throw new Error('Imagem acima de 2MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use JPG, PNG ou WEBP.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nao foi possivel processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.82);
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-success' : 'bg-current/15'}`}
    aria-label="Alternar status"
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

export const SalesCenter: React.FC = () => {
  const {
    theme,
    products,
    customers,
    promotions,
    combos,
    loyaltyConfig,
    loyaltyEntries,
    campaigns,
    addPromotion,
    updatePromotion,
    deletePromotion,
    addCombo,
    updateCombo,
    deleteCombo,
    updateLoyaltyConfig,
    addLoyaltyEntry,
    addCampaign,
    updateCampaign,
    deleteCampaign,
  } = useApp();

  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';
  const [activeTab, setActiveTab] = useState<Tab>('promocoes');
  const [promotionDraft, setPromotionDraft] = useState<PromotionDraft | null>(null);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [comboDraft, setComboDraft] = useState<ComboDraft | null>(null);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [historyCustomerId, setHistoryCustomerId] = useState<string | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState<string | null>(null);
  const [manualPoints, setManualPoints] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [pendingDelete, setPendingDelete] = useState<null | { title: string; action: () => void }>(null);

  const categories = useMemo(() => Array.from(new Set(products.map(product => product.category).filter(Boolean))), [products]);
  const activePromotions = useMemo(() => getActivePromotions(promotions), [promotions]);
  const activeCampaigns = useMemo(() => getActiveCampaigns(campaigns, promotions), [campaigns, promotions]);

  const loyaltyRanking = useMemo(() => customers
    .map(customer => ({
      customer,
      points: getCustomerPoints(customer.id, loyaltyEntries) || customer.loyaltyPoints,
      entries: loyaltyEntries.filter(entry => entry.customerId === customer.id),
    }))
    .sort((a, b) => b.points - a.points), [customers, loyaltyEntries]);

  const openPromotion = (promotion?: Promotion) => {
    setEditingPromotionId(promotion?.id || null);
    setPromotionDraft(promotion ? {
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      productIds: promotion.productIds,
      categoryIds: promotion.categoryIds,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      active: promotion.active,
    } : emptyPromotionDraft());
  };

  const savePromotion = () => {
    if (!promotionDraft?.name.trim()) return;
    if (editingPromotionId) updatePromotion(editingPromotionId, promotionDraft);
    else addPromotion(promotionDraft);
    setPromotionDraft(null);
    setEditingPromotionId(null);
  };

  const openCombo = (combo?: Combo) => {
    setEditingComboId(combo?.id || null);
    setComboDraft(combo ? {
      name: combo.name,
      description: combo.description || '',
      items: combo.items,
      originalPrice: combo.originalPrice,
      comboPrice: combo.comboPrice,
      imageBase64: combo.imageBase64,
      menuDigital: combo.menuDigital || { visible: false, highlight: true, highlightLabel: 'Combo' },
      active: combo.active,
    } : emptyComboDraft());
    setImageError('');
  };

  const saveCombo = () => {
    if (!comboDraft?.name.trim() || comboDraft.items.length === 0) return;
    const originalPrice = calcComboOriginalPrice(comboDraft as Combo, products);
    const payload = { ...comboDraft, originalPrice };
    if (editingComboId) updateCombo(editingComboId, payload);
    else addCombo(payload);
    setComboDraft(null);
    setEditingComboId(null);
  };

  const openCampaign = (campaign?: Campaign) => {
    setEditingCampaignId(campaign?.id || null);
    setCampaignDraft(campaign ? {
      name: campaign.name,
      promotionId: campaign.promotionId,
      daysOfWeek: campaign.daysOfWeek,
      startsHour: campaign.startsHour,
      endsHour: campaign.endsHour,
      active: campaign.active,
    } : emptyCampaignDraft(promotions[0]?.id || ''));
  };

  const saveCampaign = () => {
    if (!campaignDraft?.name.trim() || !campaignDraft.promotionId || campaignDraft.daysOfWeek.length === 0) return;
    if (editingCampaignId) updateCampaign(editingCampaignId, campaignDraft);
    else addCampaign(campaignDraft);
    setCampaignDraft(null);
    setEditingCampaignId(null);
  };

  const promotionStatus = (promotion: Promotion) => {
    const current = Date.now();
    const start = new Date(promotion.startsAt).getTime();
    const end = new Date(promotion.endsAt).getTime();
    if (!promotion.active && current >= start && current <= end) return ['Pausada', 'bg-warning/15 text-warning'];
    if (start > current) return ['Agendada', 'bg-accent/15 text-accent'];
    if (end < current) return ['Encerrada', 'bg-current/10 text-muted'];
    return ['Ativa', 'bg-success/15 text-success'];
  };

  const handleComboImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !comboDraft) return;
    try {
      setImageError('');
      const imageBase64 = await resizeImage(file);
      setComboDraft({ ...comboDraft, imageBase64 });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Erro ao processar imagem.');
    }
  };

  const addManualEntry = (customerId: string, mode: 'add' | 'redeem') => {
    const points = Math.abs(Number(manualPoints));
    if (!points || !manualReason.trim()) return;
    addLoyaltyEntry({
      customerId,
      points: mode === 'redeem' ? -points : points,
      description: mode === 'redeem' ? `Resgate - ${manualReason}` : manualReason,
    });
    setManualCustomerId(null);
    setManualPoints('');
    setManualReason('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Central de Vendas</h2>
          <p className="text-xs text-muted mt-1">Promocoes, combos, fidelidade e campanhas por horario.</p>
        </div>
        <div className={`flex overflow-x-auto p-1 gap-1 rounded-panel border ${fieldClass}`}>
          {([
            ['promocoes', 'Promocoes'],
            ['combos', 'Combos'],
            ['fidelidade', 'Fidelidade'],
            ['campanhas', 'Campanhas'],
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-3 py-2 rounded-control text-xs font-medium whitespace-nowrap ${activeTab === id ? 'bg-accent text-white' : 'text-muted hover:text-current'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'promocoes' && (
        <section className={`rounded-panel border overflow-hidden ${panelClass}`}>
          <div className="p-4 border-b border-current/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-panel bg-accent text-white flex items-center justify-center"><BadgePercent className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold">Promocoes</h3>
                <p className="text-xs text-muted">{activePromotions.length} ativas agora</p>
              </div>
            </div>
            <button onClick={() => openPromotion()} className="h-10 px-4 rounded-control bg-accent text-white text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Promocao
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`text-xs border-b ${isDark ? 'bg-elevated border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Aplicacao</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/5">
                {promotions.map(promotion => {
                  const [label, className] = promotionStatus(promotion);
                  return (
                    <tr key={promotion.id}>
                      <td className="px-4 py-3 text-sm font-medium">{promotion.name}</td>
                      <td className="px-4 py-3 text-xs">{promotion.type === 'percent' ? 'Porcentagem' : 'Valor fixo'}</td>
                      <td className="px-4 py-3 text-xs">{promotion.type === 'percent' ? `${promotion.value}%` : formatMoney(promotion.value)}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {promotion.productIds.length === 0 && promotion.categoryIds.length === 0 ? 'Todos os produtos' : `${promotion.categoryIds.length} categorias / ${promotion.productIds.length} produtos`}
                      </td>
                      <td className="px-4 py-3 text-xs">{toDateValue(promotion.startsAt)} a {toDateValue(promotion.endsAt)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${className}`}>{label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Toggle checked={promotion.active} onChange={() => updatePromotion(promotion.id, { active: !promotion.active })} />
                          <button onClick={() => openPromotion(promotion)} className="p-2 rounded-control hover:bg-current/10"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setPendingDelete({ title: 'Excluir promocao', action: () => deletePromotion(promotion.id) })} className="p-2 rounded-control hover:bg-danger/10 text-danger"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {promotions.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">Nenhuma promocao cadastrada.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'combos' && (
        <section className="space-y-4">
          <div className={`rounded-panel border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${panelClass}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-panel bg-accent text-white flex items-center justify-center"><Package className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold">Combos</h3>
                <p className="text-xs text-muted">{combos.filter(combo => combo.active).length} combos ativos</p>
              </div>
            </div>
            <button onClick={() => openCombo()} className="h-10 px-4 rounded-control bg-accent text-white text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Combo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {combos.map(combo => {
              const original = calcComboOriginalPrice(combo, products) || combo.originalPrice;
              const saving = Math.max(0, original - combo.comboPrice);
              return (
                <article key={combo.id} className={`rounded-panel border overflow-hidden ${panelClass}`}>
                  <div className="aspect-[16/9] bg-current/5 flex items-center justify-center">
                    {combo.imageBase64 ? <img src={combo.imageBase64} alt={combo.name} className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-muted" />}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{combo.name}</h4>
                        <p className="text-xs text-muted mt-1">{combo.description || 'Combo sem descricao'}</p>
                      </div>
                      <Toggle checked={combo.active} onChange={() => updateCombo(combo.id, { active: !combo.active })} />
                    </div>
                    <div className="text-xs text-muted space-y-1">
                      {combo.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return <p key={`${item.productId}-${idx}`}>{item.qty}x {product?.name || 'Produto removido'}</p>;
                      })}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted line-through">{formatMoney(original)}</p>
                        <p className="text-lg font-semibold text-accent">{formatMoney(combo.comboPrice)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-success/15 text-success">
                        Economia {formatMoney(saving)} ({calcComboSaving(combo, products)}%)
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => openCombo(combo)} className="p-2 rounded-control hover:bg-current/10"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setPendingDelete({ title: 'Excluir combo', action: () => deleteCombo(combo.id) })} className="p-2 rounded-control hover:bg-danger/10 text-danger"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
            {combos.length === 0 && <div className={`rounded-panel border p-10 text-center text-sm text-muted ${panelClass}`}>Nenhum combo cadastrado.</div>}
          </div>
        </section>
      )}

      {activeTab === 'fidelidade' && (
        <section className="space-y-4">
          <div className={`rounded-panel border p-5 ${panelClass}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Gift className="w-5 h-5 text-accent" /> Programa de Fidelidade</h3>
                <p className="text-xs text-muted mt-1">Configure pontos, resgate e expiracao opcional.</p>
              </div>
              <Toggle checked={loyaltyConfig.active} onChange={() => updateLoyaltyConfig({ active: !loyaltyConfig.active })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
              <label className="text-xs text-muted space-y-1">
                Pontos por R$ 1
                <input type="number" min="0" step="0.1" value={loyaltyConfig.pointsPerReal} onChange={event => updateLoyaltyConfig({ pointsPerReal: Number(event.target.value) })} className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </label>
              <label className="text-xs text-muted space-y-1">
                Pontos para resgate
                <input type="number" min="1" value={loyaltyConfig.redeemThreshold} onChange={event => updateLoyaltyConfig({ redeemThreshold: Number(event.target.value) })} className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </label>
              <label className="text-xs text-muted space-y-1">
                Valor do resgate
                <input type="number" min="0" value={loyaltyConfig.redeemValue} onChange={event => updateLoyaltyConfig({ redeemValue: Number(event.target.value) })} className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </label>
              <label className="text-xs text-muted space-y-1">
                Expira em dias
                <input type="number" min="0" value={loyaltyConfig.expiresInDays || ''} onChange={event => updateLoyaltyConfig({ expiresInDays: event.target.value ? Number(event.target.value) : undefined })} className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </label>
            </div>
          </div>

          {!loyaltyConfig.active ? (
            <div className={`rounded-panel border p-10 text-center ${panelClass}`}>
              <Star className="w-10 h-10 mx-auto text-muted mb-3" />
              <p className="font-semibold">Ative o programa para comecar a fidelizar seus clientes</p>
              <p className="text-xs text-muted mt-1">Quando ativo, o checkout credita pontos automaticamente.</p>
            </div>
          ) : (
            <div className={`rounded-panel border overflow-hidden ${panelClass}`}>
              <table className="w-full text-left">
                <thead className={`text-xs border-b ${isDark ? 'bg-elevated border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Pontos acumulados</th>
                    <th className="px-4 py-3">Ultimo pedido</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {loyaltyRanking.map(({ customer, points }) => (
                    <tr key={customer.id}>
                      <td className="px-4 py-3 text-sm font-medium">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-accent font-semibold">{points}</td>
                      <td className="px-4 py-3 text-xs text-muted">{customer.lastVisit}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setHistoryCustomerId(customer.id)} className="h-9 px-3 rounded-control border text-xs flex items-center gap-2 hover:bg-current/10"><History className="w-4 h-4" /> Historico</button>
                          <button onClick={() => setManualCustomerId(customer.id)} className="h-9 px-3 rounded-control border text-xs flex items-center gap-2 hover:bg-current/10"><Plus className="w-4 h-4" /> Pontos</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'campanhas' && (
        <section className="space-y-4">
          <div className={`rounded-panel border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${panelClass}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-panel bg-accent text-white flex items-center justify-center"><CalendarClock className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold">Campanhas</h3>
                <p className="text-xs text-muted">{activeCampaigns.length} campanhas ativas agora</p>
              </div>
            </div>
            <button onClick={() => openCampaign()} className="h-10 px-4 rounded-control bg-accent text-white text-sm font-medium flex items-center gap-2" disabled={promotions.length === 0}>
              <Plus className="w-4 h-4" /> Nova Campanha
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(campaign => {
              const linked = promotions.find(promotion => promotion.id === campaign.promotionId);
              const isActiveNow = activeCampaigns.some(active => active.id === campaign.id);
              return (
                <article key={campaign.id} className={`rounded-panel border p-4 space-y-4 ${panelClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-xs text-muted mt-1">{linked?.name || 'Promocao removida'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${!campaign.active ? 'bg-warning/15 text-warning' : isActiveNow ? 'bg-success/15 text-success' : 'bg-current/10 text-muted'}`}>
                      {!campaign.active ? 'Pausada' : isActiveNow ? 'Ativa agora' : 'Fora do horario'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dayLabels.map((label, idx) => <span key={label} className={`px-2 py-1 rounded-full text-[10px] font-semibold ${campaign.daysOfWeek.includes(idx) ? 'bg-accent/15 text-accent' : 'bg-current/10 text-muted'}`}>{label}</span>)}
                  </div>
                  <p className="text-xs text-muted">{String(campaign.startsHour).padStart(2, '0')}:00 as {String(campaign.endsHour).padStart(2, '0')}:00</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => updateCampaign(campaign.id, { active: !campaign.active })} className="h-9 px-3 rounded-control border text-xs">{campaign.active ? 'Pausar' : 'Ativar'}</button>
                    <button onClick={() => openCampaign(campaign)} className="p-2 rounded-control hover:bg-current/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setPendingDelete({ title: 'Excluir campanha', action: () => deleteCampaign(campaign.id) })} className="p-2 rounded-control hover:bg-danger/10 text-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </article>
              );
            })}
            {campaigns.length === 0 && <div className={`rounded-panel border p-10 text-center text-sm text-muted ${panelClass}`}>Nenhuma campanha cadastrada.</div>}
          </div>
        </section>
      )}

      <AnimatePresence>
        {promotionDraft && (
          <Modal title={editingPromotionId ? 'Editar Promocao' : 'Nova Promocao'} onClose={() => setPromotionDraft(null)} panelClass={panelClass}>
            <div className="space-y-4">
              <input autoFocus value={promotionDraft.name} onChange={event => setPromotionDraft({ ...promotionDraft, name: event.target.value })} placeholder="Nome da promocao" className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              <div className="grid grid-cols-2 gap-3">
                <select value={promotionDraft.type} onChange={event => setPromotionDraft({ ...promotionDraft, type: event.target.value as PromotionDraft['type'] })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`}>
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
                <input type="number" min="0" value={promotionDraft.value} onChange={event => setPromotionDraft({ ...promotionDraft, value: Number(event.target.value) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={promotionDraft.productIds.length === 0 && promotionDraft.categoryIds.length === 0} onChange={event => event.target.checked && setPromotionDraft({ ...promotionDraft, productIds: [], categoryIds: [] })} />
                Todos os produtos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CheckList title="Categorias" values={categories} selected={promotionDraft.categoryIds} onToggle={value => setPromotionDraft({ ...promotionDraft, categoryIds: toggleValue(promotionDraft.categoryIds, value) })} />
                <CheckList title="Produtos" values={products.map(product => product.id)} labels={Object.fromEntries(products.map(product => [product.id, product.name]))} selected={promotionDraft.productIds} onToggle={value => setPromotionDraft({ ...promotionDraft, productIds: toggleValue(promotionDraft.productIds, value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={toDateValue(promotionDraft.startsAt)} onChange={event => setPromotionDraft({ ...promotionDraft, startsAt: fromDateValue(event.target.value) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
                <input type="date" value={toDateValue(promotionDraft.endsAt)} onChange={event => setPromotionDraft({ ...promotionDraft, endsAt: fromDateValue(event.target.value, true) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </div>
              <label className="flex items-center justify-between text-sm"><span>Ativar imediatamente</span><Toggle checked={promotionDraft.active} onChange={() => setPromotionDraft({ ...promotionDraft, active: !promotionDraft.active })} /></label>
              <ModalActions onCancel={() => setPromotionDraft(null)} onSave={savePromotion} />
            </div>
          </Modal>
        )}

        {comboDraft && (
          <Modal title={editingComboId ? 'Editar Combo' : 'Novo Combo'} onClose={() => setComboDraft(null)} panelClass={panelClass}>
            <div className="space-y-4">
              <input autoFocus value={comboDraft.name} onChange={event => setComboDraft({ ...comboDraft, name: event.target.value })} placeholder="Nome do combo" className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              <textarea value={comboDraft.description} onChange={event => setComboDraft({ ...comboDraft, description: event.target.value })} placeholder="Descricao" className={`w-full min-h-20 p-3 rounded-control border outline-none text-sm resize-none ${fieldClass}`} />
              <label className={`h-20 rounded-control border border-dashed flex items-center justify-center gap-2 text-sm text-muted cursor-pointer ${fieldClass}`}>
                <ImagePlus className="w-4 h-4" /> Upload de imagem
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleComboImage} className="hidden" />
              </label>
              {imageError && <p className="text-xs text-danger">{imageError}</p>}
              <ComboItemsEditor draft={comboDraft} products={products} setDraft={setComboDraft} fieldClass={fieldClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" value={comboDraft.comboPrice} onChange={event => setComboDraft({ ...comboDraft, comboPrice: Number(event.target.value) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} placeholder="Preco do combo" />
                <div className={`rounded-control border px-3 py-2 text-xs ${fieldClass}`}>
                  <span className="text-muted">Economia</span>
                  <p className="font-semibold text-success">{formatMoney(Math.max(0, calcComboOriginalPrice(comboDraft as Combo, products) - comboDraft.comboPrice))} ({calcComboSaving(comboDraft as Combo, products)}%)</p>
                </div>
              </div>
              <label className="flex items-center justify-between text-sm"><span>Ativo</span><Toggle checked={comboDraft.active} onChange={() => setComboDraft({ ...comboDraft, active: !comboDraft.active })} /></label>
              <label className="flex items-center justify-between text-sm"><span>Visivel no Cardapio Digital</span><Toggle checked={comboDraft.menuDigital?.visible || false} onChange={() => setComboDraft({ ...comboDraft, menuDigital: { visible: !(comboDraft.menuDigital?.visible || false), highlight: true, highlightLabel: 'Combo' } })} /></label>
              <ModalActions onCancel={() => setComboDraft(null)} onSave={saveCombo} />
            </div>
          </Modal>
        )}

        {campaignDraft && (
          <Modal title={editingCampaignId ? 'Editar Campanha' : 'Nova Campanha'} onClose={() => setCampaignDraft(null)} panelClass={panelClass}>
            <div className="space-y-4">
              <input autoFocus value={campaignDraft.name} onChange={event => setCampaignDraft({ ...campaignDraft, name: event.target.value })} placeholder="Nome da campanha" className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              <select value={campaignDraft.promotionId} onChange={event => setCampaignDraft({ ...campaignDraft, promotionId: event.target.value })} className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`}>
                <option value="">Selecione a promocao</option>
                {promotions.map(promotion => <option key={promotion.id} value={promotion.id}>{promotion.name}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, idx) => (
                  <button key={label} type="button" onClick={() => setCampaignDraft({ ...campaignDraft, daysOfWeek: toggleNumber(campaignDraft.daysOfWeek, idx) })} className={`h-9 px-3 rounded-full text-xs font-semibold ${campaignDraft.daysOfWeek.includes(idx) ? 'bg-accent text-white' : 'bg-current/10 text-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={`${String(campaignDraft.startsHour).padStart(2, '0')}:00`} onChange={event => setCampaignDraft({ ...campaignDraft, startsHour: Number(event.target.value.slice(0, 2)) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
                <input type="time" value={`${String(campaignDraft.endsHour).padStart(2, '0')}:00`} onChange={event => setCampaignDraft({ ...campaignDraft, endsHour: Number(event.target.value.slice(0, 2)) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
              </div>
              <label className="flex items-center justify-between text-sm"><span>Ativa</span><Toggle checked={campaignDraft.active} onChange={() => setCampaignDraft({ ...campaignDraft, active: !campaignDraft.active })} /></label>
              <ModalActions onCancel={() => setCampaignDraft(null)} onSave={saveCampaign} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {historyCustomerId && (
        <SimpleModal title="Historico de Pontos" onClose={() => setHistoryCustomerId(null)} panelClass={panelClass}>
          <div className="space-y-2">
            {loyaltyEntries.filter(entry => entry.customerId === historyCustomerId).map(entry => (
              <div key={entry.id} className={`p-3 rounded-control border flex justify-between gap-3 text-sm ${fieldClass}`}>
                <div>
                  <p className="font-medium">{entry.description}</p>
                  <p className="text-xs text-muted">{new Date(entry.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className={entry.points >= 0 ? 'text-success font-semibold' : 'text-warning font-semibold'}>{entry.points > 0 ? '+' : ''}{entry.points}</span>
              </div>
            ))}
            {loyaltyEntries.filter(entry => entry.customerId === historyCustomerId).length === 0 && <p className="text-sm text-muted text-center py-8">Sem movimentacoes ainda.</p>}
          </div>
        </SimpleModal>
      )}

      {manualCustomerId && (
        <SimpleModal title="Movimentar Pontos" onClose={() => setManualCustomerId(null)} panelClass={panelClass}>
          <div className="space-y-3">
            <input type="number" min="1" value={manualPoints} onChange={event => setManualPoints(event.target.value)} placeholder="Quantidade de pontos" className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
            <input value={manualReason} onChange={event => setManualReason(event.target.value)} placeholder="Motivo" className={`w-full h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addManualEntry(manualCustomerId, 'add')} className="h-10 rounded-control bg-success text-white text-xs font-medium">Adicionar</button>
              <button onClick={() => addManualEntry(manualCustomerId, 'redeem')} className="h-10 rounded-control bg-warning text-white text-xs font-medium">Resgatar</button>
            </div>
          </div>
        </SimpleModal>
      )}

      <SecurityGate
        isOpen={!!pendingDelete}
        title={pendingDelete?.title || 'Acao protegida'}
        onClose={() => setPendingDelete(null)}
        onSuccess={() => {
          pendingDelete?.action();
          setPendingDelete(null);
        }}
      />
    </div>
  );
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter(item => item !== value) : [...values, value];

const toggleNumber = (values: number[], value: number) =>
  values.includes(value) ? values.filter(item => item !== value) : [...values, value].sort((a, b) => a - b);

const Modal = ({ title, onClose, panelClass, children }: { title: string; onClose: () => void; panelClass: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className={`w-full max-w-3xl rounded-panel border shadow-2xl overflow-hidden ${panelClass}`}>
      <div className="px-5 py-4 border-b border-current/10 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-control hover:bg-current/10"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
    </motion.div>
  </div>
);

const SimpleModal = ({ title, onClose, panelClass, children }: { title: string; onClose: () => void; panelClass: string; children: React.ReactNode }) => (
  <Modal title={title} onClose={onClose} panelClass={panelClass}>{children}</Modal>
);

const ModalActions = ({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button onClick={onCancel} className="h-10 px-4 rounded-control border text-xs font-medium">Cancelar</button>
    <button onClick={onSave} className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
  </div>
);

const CheckList = ({
  title,
  values,
  labels,
  selected,
  onToggle,
}: {
  title: string;
  values: string[];
  labels?: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}) => (
  <div className="rounded-control border border-current/10 p-3 max-h-44 overflow-y-auto">
    <p className="text-xs font-semibold text-muted mb-2">{title}</p>
    <div className="space-y-2">
      {values.map(value => (
        <label key={value} className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />
          <span>{labels?.[value] || value}</span>
        </label>
      ))}
      {values.length === 0 && <p className="text-xs text-muted">Nenhuma opcao.</p>}
    </div>
  </div>
);

const ComboItemsEditor = ({
  draft,
  products,
  setDraft,
  fieldClass,
}: {
  draft: ComboDraft;
  products: Product[];
  setDraft: (draft: ComboDraft) => void;
  fieldClass: string;
}) => {
  const addLine = () => setDraft({ ...draft, items: [...draft.items, { productId: products[0]?.id || '', qty: 1 }] });
  const updateLine = (index: number, data: Partial<{ productId: string; qty: number }>) => {
    setDraft({ ...draft, items: draft.items.map((item, idx) => idx === index ? { ...item, ...data } : item) });
  };
  const removeLine = (index: number) => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== index) });
  const original = calcComboOriginalPrice(draft as Combo, products);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">Itens do combo</p>
        <button type="button" onClick={addLine} className="h-8 px-3 rounded-control border text-xs flex items-center gap-2"><Plus className="w-3 h-3" /> Item</button>
      </div>
      {draft.items.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_80px_36px] gap-2">
          <select value={item.productId} onChange={event => updateLine(index, { productId: event.target.value })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`}>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <input type="number" min="1" value={item.qty} onChange={event => updateLine(index, { qty: Number(event.target.value) })} className={`h-10 px-3 rounded-control border outline-none text-sm ${fieldClass}`} />
          <button type="button" onClick={() => removeLine(index)} className="h-10 rounded-control text-danger hover:bg-danger/10 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="rounded-control border border-current/10 p-3 text-xs flex justify-between">
        <span className="text-muted">Preco original calculado</span>
        <strong>{formatMoney(original)}</strong>
      </div>
    </div>
  );
};

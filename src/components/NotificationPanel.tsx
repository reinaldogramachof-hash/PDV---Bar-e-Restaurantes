import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Info,
  LifeBuoy,
  Megaphone,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNotification } from '../types';
import { useApp } from '../store/AppContext';
import {
  getUnread,
  markAllRead,
  markAsRead,
  addLocalNotification,
  NOTIFICATIONS_UPDATED_EVENT,
} from '../services/notificationService';

const typeIcon: Record<AppNotification['type'], typeof Info> = {
  update: Megaphone,
  security: ShieldAlert,
  feature: Sparkles,
  support: LifeBuoy,
  sales: TrendingUp,
  info: Info,
};

const typeTone: Record<AppNotification['type'], string> = {
  update: 'text-accent bg-accent/10',
  security: 'text-danger bg-danger/10',
  feature: 'text-success bg-success/10',
  support: 'text-blue-500 bg-blue-500/10',
  sales: 'text-warning bg-warning/10',
  info: 'text-muted bg-current/5',
};

const typeLabel: Record<AppNotification['type'], string> = {
  update: 'Atualizacao',
  security: 'Seguranca',
  feature: 'Novidade',
  support: 'Suporte',
  sales: 'Plano',
  info: 'Info',
};

const relativeDate = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  return `ha ${days} dia${days > 1 ? 's' : ''}`;
};

const handleAction = (notification: AppNotification) => {
  if (!notification.actionUrl) return;
  if (/^https?:\/\//.test(notification.actionUrl)) {
    window.open(notification.actionUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = notification.actionUrl;
};

export const NotificationPanel: React.FC = () => {
  const { currentEmpresa, theme, stockItems } = useApp();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getUnread(currentEmpresa.id, currentEmpresa.plano));
  const panelRef = useRef<HTMLDivElement>(null);

  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const rowClass = isDark ? 'hover:bg-elevated border-border' : 'hover:bg-elevated-light border-border-light';

  const refresh = () => {
    setNotifications(getUnread(currentEmpresa.id, currentEmpresa.plano));
  };

  useEffect(() => {
    refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
  }, [currentEmpresa.id, currentEmpresa.plano]);

  // Sync expiring stock items to local notifications
  useEffect(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const existingIds = new Set(
       JSON.parse(sessionStorage.getItem(`gestao-gastro:notifications:local:${currentEmpresa.id}`) || '[]').map((n: any) => n.id)
    );

    stockItems.forEach(item => {
      if (!item.expirationDate || item.currentStock <= 0) return;
      const [year, month, day] = item.expirationDate.split('-').map(Number);
      const expDate = new Date(year, month - 1, day);
      expDate.setHours(0,0,0,0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 15) {
        const level = diffDays < 0 ? 'vencido' : diffDays <= 3 ? '3dias' : diffDays <= 7 ? '7dias' : '15dias';
        const notifId = `stock-alert-${item.id}-${item.expirationDate}-${level}`;
        
        if (!existingIds.has(notifId)) {
          const title = diffDays < 0 ? `Insumo Vencido: ${item.name}` : `Vencimento Próximo: ${item.name}`;
          const body = diffDays < 0 
            ? `Atenção: O insumo ${item.name} (${item.currentStock.toFixed(2)} ${item.unit}) já venceu na data ${item.expirationDate}.` 
            : diffDays <= 3
            ? `Alerta Crítico: O insumo ${item.name} vence em ${diffDays} dias! Sugerimos fazer uma promoção para esgotar o estoque.`
            : `O insumo ${item.name} vencerá em ${diffDays} dias.`;
          const type = diffDays <= 3 ? 'security' : diffDays <= 7 ? 'update' : 'info';
          
          addLocalNotification({
            id: notifId,
            type,
            title,
            body,
            publishedAt: new Date().toISOString(),
          }, currentEmpresa.id);
        }
      }
    });
  }, [stockItems, currentEmpresa.id]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.length;
  const title = useMemo(() => unreadCount === 1 ? '1 notificacao nao lida' : `${unreadCount} notificacoes nao lidas`, [unreadCount]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2.5 rounded-control transition-all active:scale-95 ${isDark ? 'bg-elevated hover:bg-white/10' : 'bg-elevated-light hover:bg-gray-200'}`}
        aria-label={title}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] rounded-panel border shadow-2xl overflow-hidden ${panelClass}`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-current/10">
              <div>
                <h3 className="text-sm font-semibold">Notificacoes</h3>
                <p className="text-[11px] text-muted">{title}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead(currentEmpresa.id, currentEmpresa.plano)}
                  className="h-8 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle2 className="w-9 h-9 text-success mx-auto mb-3" />
                  <p className="text-sm font-semibold">Nenhuma novidade por enquanto.</p>
                  <p className="text-xs text-muted mt-1">Quando houver algo importante, aparece aqui.</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = typeIcon[notification.type];
                  return (
                    <article key={notification.id} className={`border-b last:border-b-0 px-4 py-3 transition-colors ${rowClass}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${typeTone[notification.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold leading-snug">{notification.title}</h4>
                            <span className="rounded-full bg-current/5 px-2 py-0.5 text-[10px] text-muted whitespace-nowrap">
                              {typeLabel[notification.type]}
                            </span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed mt-1">{notification.body}</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                            <span className="text-[11px] text-muted">{relativeDate(notification.publishedAt)}</span>
                            <div className="flex items-center gap-2">
                              {notification.action && (
                                <button
                                  onClick={() => {
                                    markAsRead(notification.id, currentEmpresa.id);
                                    handleAction(notification);
                                  }}
                                  className="h-7 px-2 rounded-control bg-accent text-white text-[11px] font-medium inline-flex items-center gap-1"
                                >
                                  {notification.action}
                                  {notification.actionUrl && <ExternalLink className="w-3 h-3" />}
                                </button>
                              )}
                              <button
                                onClick={() => markAsRead(notification.id, currentEmpresa.id)}
                                className="h-7 px-2 rounded-control text-[11px] font-medium text-muted hover:text-current"
                              >
                                Lida
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

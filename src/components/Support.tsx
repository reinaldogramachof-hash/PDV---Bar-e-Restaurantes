import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  Headset,
  MessageCircle, 
  Mail, 
  Phone, 
  ExternalLink, 
  Globe,
  Instagram,
  Facebook
} from 'lucide-react';
import { motion } from 'motion/react';
import { APP_NAME } from '../domain/saas';

export const Support: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const contactMethods = [
    {
      title: 'WhatsApp',
      value: '(12) 99219-1018',
      sub: 'Atendimento via chat',
      icon: MessageCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      link: 'https://wa.me/5512992191018'
    },
    {
      title: 'E-mail',
      value: 'tecnologia@plenainformatica.com.br',
      sub: 'Suporte técnico oficial',
      icon: Mail,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      link: 'mailto:tecnologia@plenainformatica.com.br'
    },
    {
      title: 'Horário',
      value: 'Seg a Sex',
      sub: 'Das 09h às 17h',
      icon: Phone,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      link: '#'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-dashed border-current/10 pb-5">
        <div className="w-10 h-10 rounded-panel bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <Headset className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Central de Suporte</h1>
          <p className="text-xs text-muted">Estamos aqui para ajudar você a tirar o máximo proveito do {APP_NAME}</p>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactMethods.map((method, i) => (
          <motion.a
            key={i}
            href={method.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`group p-5 rounded-panel border transition-all hover:border-[var(--color-accent)]/30
              ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}
          >
            <div className={`w-9 h-9 rounded-control ${method.bg} ${method.color} flex items-center justify-center mb-4`}>
              <method.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted mb-0.5">{method.title}</p>
            <p className="text-sm font-semibold break-all leading-snug">{method.value}</p>
            <p className="text-xs text-muted mt-1">{method.sub}</p>
          </motion.a>
        ))}
      </div>

      {/* Website Card */}
      <div className={`p-5 rounded-panel border flex flex-col md:flex-row items-center justify-between gap-4
        ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div>
          <h2 className="text-sm font-semibold">Suporte Plena Informática</h2>
          <p className="text-xs text-muted mt-0.5">Acesse nosso site e conheça outras soluções</p>
        </div>
        <a
          href="https://www.plenainformatica.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 h-10 bg-[var(--color-accent)] text-white rounded-control font-medium text-xs flex items-center gap-2 hover:opacity-90 transition-all shrink-0"
        >
          Visitar Nosso Site
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Footer Text */}
      <p className="text-center text-xs text-muted opacity-50 pt-2">
        {APP_NAME} v1.0.0 — © 2026 Plena Informática. Todos os direitos reservados.
      </p>
    </div>
  );
}

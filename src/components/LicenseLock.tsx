import React from 'react';
import { Globe, Lock, Mail, Phone, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { LicenseCheckResult } from '../services/licenseService';

interface LicenseLockProps {
  license?: LicenseCheckResult;
}

const formatDate = (date?: string) =>
  date ? new Intl.DateTimeFormat('pt-BR').format(new Date(date)) : 'Sem data informada';

export const LicenseLock: React.FC<LicenseLockProps> = ({ license }) => (
  <div className="fixed inset-0 z-[9999] bg-[#0A0A0B] flex items-center justify-center p-6 overflow-hidden font-sans">
    <div className="absolute inset-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-accent)]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="max-w-md w-full bg-[var(--color-surface)] border border-white/10 rounded-section p-8 relative z-10 shadow-2xl shadow-black/50 text-center space-y-7"
    >
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-section bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
          <Lock className="w-9 h-9" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white border-4 border-[var(--color-surface)]"
        >
          <ShieldAlert className="w-4 h-4" />
        </motion.div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white leading-tight">
          Acesso <span className="text-[var(--color-accent)]">bloqueado</span>
        </h1>
        <p className="text-sm font-medium text-white/50 leading-relaxed">
          A licenca deste terminal expirou ou foi suspensa pela administracao.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-panel border border-white/5 bg-white/5 p-4">
          <p className="text-xs text-white/40">Plano</p>
          <p className="mt-1 text-sm font-semibold capitalize text-white">{license?.plan || 'gestao'}</p>
        </div>
        <div className="rounded-panel border border-white/5 bg-white/5 p-4">
          <p className="text-xs text-white/40">Expiracao</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatDate(license?.expiresAt)}</p>
        </div>
      </div>

      <div className="p-5 rounded-section bg-white/5 border border-white/5 space-y-4 text-left">
        <p className="text-xs font-medium text-white/60">Entre em contato para liberar:</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-control bg-white/5 flex items-center justify-center">
              <Phone className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <span className="text-xs font-medium">(12) 99219-1018</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-control bg-white/5 flex items-center justify-center">
              <Mail className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <span className="text-xs font-medium break-all">tecnologia@plenainformatica.com.br</span>
          </div>
        </div>
        <a
          href="https://wa.me/5512992191018"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-full items-center justify-center rounded-control bg-[var(--color-accent)] px-4 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Falar com a Plena
        </a>
      </div>

      <div className="pt-2 border-t border-white/5 space-y-3">
        <p className="text-xs font-medium text-white/40">Plena Informatica</p>
        <a
          href="https://www.plenainformatica.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          <Globe className="w-3 h-3" /> Visitar site oficial
        </a>
      </div>
    </motion.div>
  </div>
);

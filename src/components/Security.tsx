import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  Shield, Lock, FileText, Database, 
  AlertCircle, ShieldCheck, UserCheck, 
  ArrowRight, HardDrive, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { APP_NAME } from '../domain/saas';

export const Security: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const sections = [
    {
      title: "Segurança do Sistema",
      icon: Lock,
      color: "text-blue-500",
      content: `${APP_NAME} utiliza armazenamento local segmentado por empresa nesta fase de preparação SaaS. Seus dados de vendas, clientes e estoque permanecem no navegador até a evolução para API autenticada e banco relacional.`
    },
    {
      title: "Políticas de Produto",
      icon: ShieldCheck,
      color: "text-emerald-500",
      content: "O produto é desenhado para proteger dados operacionais por empresa, preparar auditoria futura e reduzir dependência de customizações individuais por restaurante."
    },
    {
      title: "Responsabilidade de Backup",
      icon: Database,
      color: "text-amber-500",
      content: "Como o sistema opera em modo 'Local-First' para maior velocidade, a responsabilidade pela integridade dos dados a longo prazo é do usuário. Recomendamos a exportação semanal do backup em JSON (disponível no módulo Configurações) para evitar perdas em caso de formatação ou limpeza de cache."
    }
  ];

  const terms = [
    { title: "Uso de Dados", desc: "O usuário é proprietário absoluto de todos os dados inseridos." },
    { title: "Privacidade", desc: "Cumprimento total com as diretrizes da LGPD brasileira." },
    { title: "Suporte", desc: "Acesso direto à equipe técnica para questões de segurança." },
    { title: "Continuidade", desc: "O backup garante a portabilidade total dos seus dados." }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      {/* Hero Header */}
      <div className="flex items-center gap-4 border-b border-dashed border-current/10 pb-5">
        <div className="w-10 h-10 rounded-panel bg-blue-500/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Central de Segurança</h1>
          <p className="text-xs text-muted">Transparência, Privacidade e Responsabilidade</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-panel border space-y-4 transition-all
              ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20'}`}
          >
            <div className={`w-9 h-9 rounded-control bg-current/10 ${section.color} flex items-center justify-center`}>
              <section.icon className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{section.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Terms and Details */}
      <div className={`rounded-panel border p-5
        ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/30'}`}>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold">Termos de Uso & Políticas</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {terms.map((term, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-control bg-current/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold">{term.title}</h4>
                    <p className="text-xs text-muted">{term.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`md:w-64 p-5 rounded-panel space-y-4 border border-dashed flex flex-col justify-between
            ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <div className="space-y-3 text-center">
              <div className="inline-flex p-2.5 rounded-control bg-amber-500/10 text-amber-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold">Aviso Importante</h4>
              <p className="text-xs text-muted leading-relaxed">
                A limpeza de dados do navegador pode resultar na perda permanente de informações não exportadas.
              </p>
            </div>
            <button
              className="w-full h-10 rounded-control bg-current/10 font-medium text-xs flex items-center justify-center gap-2 hover:bg-current/20 transition-all"
              onClick={() => window.location.href = '#'}
            >
              Baixar Termos em PDF <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="flex justify-center">
        <div className={`px-5 py-3 rounded-panel border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-xs text-muted">{APP_NAME} - base preparada para LGPD e isolamento multiempresa</span>
        </div>
      </div>
    </div>
  );
};

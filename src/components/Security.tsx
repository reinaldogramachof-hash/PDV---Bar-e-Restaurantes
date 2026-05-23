import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  Shield, Lock, FileText, Database, 
  AlertCircle, ShieldCheck, UserCheck, 
  ArrowRight, HardDrive, Info, Download, Filter, Calendar
} from 'lucide-react';
import { queryLogs, exportCSV } from '../services/auditService';
import { AuditLogEntry } from '../types';
import { motion } from 'motion/react';
import { APP_NAME } from '../domain/saas';

export const Security: React.FC = () => {
  const { theme, currentEmpresa, hasPermission } = useApp();
  const isDark = theme === 'dark';

  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [filterType, setFilterType] = React.useState('');

  const canView = hasPermission('seguranca:read');

  const loadLogs = React.useCallback(() => {
    if (!canView) return;
    const res = queryLogs(currentEmpresa.id, { page, pageSize: 10, type: filterType || undefined });
    setLogs(res.logs);
    setTotalPages(res.pages);
  }, [canView, currentEmpresa.id, page, filterType]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
        <Shield className="w-8 h-8" />
        <p className="text-sm font-medium">Acesso restrito</p>
        <p className="text-xs text-muted">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  const handleExportLogs = () => {
    const res = queryLogs(currentEmpresa.id, { page: 1, pageSize: 10000 });
    const csv = exportCSV(res.logs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${currentEmpresa.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sections = [
    {
      title: "Segurança do Sistema",
      icon: Lock,
      color: "text-accent",
      content: `${APP_NAME} utiliza armazenamento local segmentado por empresa nesta fase de preparação SaaS. Seus dados de vendas, clientes e estoque permanecem no navegador até a evolução para API autenticada e banco relacional.`
    },
    {
      title: "Políticas de Produto",
      icon: ShieldCheck,
      color: "text-success",
      content: "O produto é desenhado para proteger dados operacionais por empresa, preparar auditoria futura e reduzir dependência de customizações individuais por restaurante."
    },
    {
      title: "Responsabilidade de Backup",
      icon: Database,
      color: "text-warning",
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
              ${isDark ? 'bg-surface-light border-[var(--color-border)]' : 'bg-surface border-gray-100 shadow-xl shadow-gray-200/20'}`}
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
        ${isDark ? 'bg-surface-light border-[var(--color-border)]' : 'bg-surface border-gray-100 shadow-xl shadow-gray-200/30'}`}>

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
            ${isDark ? 'bg-elevated-light border-white/10' : 'bg-elevated border-gray-200'}`}>
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


      {/* Audit Logs Section */}
      <div className={`rounded-panel border p-5 ${isDark ? 'bg-surface-light border-[var(--color-border)]' : 'bg-surface border-gray-100 shadow-xl shadow-gray-200/20'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-[var(--color-accent)]" /> Log de Auditoria</h2>
            <p className="text-xs text-muted mt-1">Registros de segurança e operações críticas</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={filterType} 
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className={`h-10 px-3 rounded-control text-sm font-medium border outline-none ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
            >
              <option value="">Todos os Eventos</option>
              <option value="login">Logins</option>
              <option value="permission_change">Permissões</option>
              <option value="cashier_open">Caixa Abertura</option>
              <option value="cashier_close">Caixa Fechamento</option>
              <option value="order_cancel">Cancelamentos</option>
              <option value="product_delete">Exclusão de Produtos</option>
              <option value="data_export">Exportação</option>
            </select>
            <button 
              onClick={handleExportLogs}
              className="px-4 h-10 rounded-control bg-current/10 font-medium text-xs flex items-center justify-center gap-2 hover:bg-current/20 transition-all"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-medium text-muted border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/[0.03]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Nenhum registro encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : logs.map(l => (
                <tr key={l.id} className="group hover:bg-current/[0.01] transition-all">
                  <td className="px-4 py-3 text-xs opacity-60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(l.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-widest bg-current/5`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {l.userName || l.userId}
                  </td>
                  <td className="px-4 py-3 text-xs opacity-80">
                    {l.detail}
                    {l.extra && (
                      <span className="block mt-1 text-[10px] opacity-50 font-mono truncate max-w-xs" title={JSON.stringify(l.extra)}>
                        {JSON.stringify(l.extra)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-current/5">
            <span className="text-xs text-muted">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-control bg-current/5 hover:bg-current/10 disabled:opacity-30 text-xs font-medium"
              >Anterior</button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-control bg-current/5 hover:bg-current/10 disabled:opacity-30 text-xs font-medium"
              >Próxima</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Badge */}
      <div className="flex justify-center mt-6">
        <div className={`px-5 py-3 rounded-panel border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-xs text-muted">{APP_NAME} - base preparada para LGPD e isolamento multiempresa</span>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, Plus } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { addMessage, createTicket, listMessages, listMyTickets, type SupportMessage, type SupportTicket } from '../services/supportService';

const statusColor: Record<SupportTicket['status'], string> = {
  open: 'text-warning',
  in_progress: 'text-accent',
  resolved: 'text-success',
  closed: 'text-muted',
};

export const Support: React.FC = () => {
  const { theme, currentEmpresa, currentUser } = useApp();
  const isDark = theme === 'dark';
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('normal');
  const [reply, setReply] = useState('');

  const refresh = async () => {
    const next = await listMyTickets(currentEmpresa.id);
    setTickets(next);
  };

  useEffect(() => {
    void refresh();
  }, [currentEmpresa.id]);

  const openMoreThan24h = useMemo(() => {
    const now = Date.now();
    return tickets.some(item => item.status === 'open' && now - new Date(item.createdAt).getTime() > 24 * 60 * 60 * 1000);
  }, [tickets]);

  return (
    <div className="space-y-5">
      <div className={`p-4 rounded-panel border flex items-start gap-3 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
        <p className="text-xs">Antes de abrir um chamado, consulte o Manual de Uso (módulo Manual).</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Meus chamados</h2>
        <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-control bg-accent text-white text-xs inline-flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Abrir chamado
        </button>
      </div>

      <div className="space-y-2">
        {tickets.map(ticket => (
          <button
            key={ticket.id}
            onClick={async () => { setSelected(ticket); setMessages(await listMessages(ticket.id)); }}
            className={`w-full p-3 rounded-panel border text-left ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{ticket.title}</span>
              <span className={`text-xs ${statusColor[ticket.status]}`}>{ticket.status}</span>
            </div>
            <p className="text-xs text-muted mt-1">{ticket.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <section className={`p-4 rounded-panel border space-y-3 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
          <h3 className="text-sm font-semibold">{selected.title}</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className={`p-3 rounded-control border text-xs ${message.isMaster ? 'border-accent/40' : ''}`}>
                <p className="font-medium">{message.authorName}</p>
                <p className="text-muted mt-1">{message.body}</p>
              </div>
            ))}
          </div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} className="w-full rounded-control border px-3 py-2 text-xs" />
          <button
            onClick={async () => {
              if (!reply.trim()) return;
              await addMessage(selected.id, currentUser.name, reply, false);
              setReply('');
              setMessages(await listMessages(selected.id));
              await refresh();
            }}
            className="h-9 px-4 rounded-control bg-accent text-white text-xs"
          >
            Responder
          </button>
        </section>
      )}

      {openMoreThan24h && (
        <a href="https://wa.me/5512992191018" target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-control bg-emerald-500 text-white text-xs inline-flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (chamado aberto +24h)
        </a>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-section border p-4 space-y-3 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
            <h3 className="text-sm font-semibold">Abrir chamado</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" className="h-10 w-full rounded-control border px-3 text-xs" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Descreva seu problema" className="w-full rounded-control border px-3 py-2 text-xs" />
            <select value={priority} onChange={e => setPriority(e.target.value as SupportTicket['priority'])} className="h-10 w-full rounded-control border px-3 text-xs">
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-control border text-xs">Cancelar</button>
              <button
                onClick={async () => {
                  if (!title.trim() || !description.trim()) return;
                  await createTicket(currentEmpresa.id, {
                    title,
                    description,
                    priority,
                    createdBy: currentUser.id,
                  });
                  setShowCreate(false);
                  setTitle('');
                  setDescription('');
                  setPriority('normal');
                  await refresh();
                }}
                className="h-9 px-4 rounded-control bg-accent text-white text-xs"
              >
                Criar chamado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

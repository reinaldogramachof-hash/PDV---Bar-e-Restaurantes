create table if not exists public.diario_entries (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_codigo text,
  categoria text not null check (categoria in ('funcionario','fornecedor','cliente','operacional','financeiro','outro')),
  titulo text not null,
  corpo text not null,
  resolucao text,
  ocorrencias integer not null default 1,
  status text not null default 'aberto' check (status in ('aberto','escalado','resolvido','arquivado')),
  escalado_em timestamptz,
  attachments text[] default '{}',
  expires_at timestamptz default (now() + interval '2 years'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

create table if not exists public.diario_respostas (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diario_entries(id) on delete cascade,
  empresa_id text not null references public.empresas(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_codigo text,
  corpo text not null,
  created_at timestamptz default now()
);

create table if not exists public.diario_audit_log (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id) on delete cascade,
  entry_id uuid references public.diario_entries(id) on delete set null,
  user_id uuid not null references public.profiles(id),
  user_codigo text,
  user_role text not null,
  action text not null check (action in ('view','create','edit','escalate','resolve','archive','delete','respond')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.diario_entries enable row level security;
alter table public.diario_respostas enable row level security;
alter table public.diario_audit_log enable row level security;

drop policy if exists gerente_own_entries on public.diario_entries;
create policy gerente_own_entries on public.diario_entries
  for all using (
    empresa_id = (select empresa_id from public.profiles where id = auth.uid())
    and (get_auth_user_role() = 'master' or author_id = auth.uid())
  );

drop policy if exists empresa_respostas on public.diario_respostas;
create policy empresa_respostas on public.diario_respostas
  for all using (
    empresa_id = (select empresa_id from public.profiles where id = auth.uid())
  );

drop policy if exists empresa_audit on public.diario_audit_log;
create policy empresa_audit on public.diario_audit_log
  for select using (
    empresa_id = (select empresa_id from public.profiles where id = auth.uid())
    and get_auth_user_role() in ('master','gerente')
  );

create index if not exists idx_diario_empresa on public.diario_entries (empresa_id, status);
create index if not exists idx_diario_author on public.diario_entries (author_id);
create index if not exists idx_audit_entry on public.diario_audit_log (entry_id);
create index if not exists idx_audit_user on public.diario_audit_log (user_id, created_at);

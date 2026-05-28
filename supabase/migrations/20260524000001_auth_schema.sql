-- Sprint 1: Auth JWT — empresas + profiles
-- Executar no Supabase SQL Editor antes de rodar a aplicação

-- Tabela de empresas (clientes SaaS)
create table if not exists public.empresas (
  id         text primary key,
  name       text not null,
  document   text,
  plano      text not null default 'essencial',
  license_status text not null default 'trial',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de perfis (vincula auth.users → empresa + role)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  empresa_id text not null references public.empresas(id),
  name       text not null,
  role       text not null default 'staff',
  active     boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.empresas enable row level security;
alter table public.profiles enable row level security;

-- Perfil lê os próprios dados
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

-- Usuário lê a própria empresa
create policy "empresas_read_own" on public.empresas
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.empresa_id = empresas.id
    )
  );

-- Master pode ler todos os perfis da mesma empresa
create policy "profiles_master_read_empresa" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid()
      and p2.empresa_id = profiles.empresa_id
      and p2.role in ('master', 'admin')
    )
  );

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger empresas_updated_at before update on public.empresas
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Seed: empresa demo para desenvolvimento
insert into public.empresas (id, name, document, plano, license_status)
values ('demo-empresa', 'Gestão Gastro Demo', '00.000.000/0001-00', 'gestao', 'active')
on conflict (id) do nothing;

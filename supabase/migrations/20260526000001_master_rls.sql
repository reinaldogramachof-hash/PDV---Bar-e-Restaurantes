-- Sprint Master: RLS cross-empresa para role 'master' (operador Plena)

-- Empresa Plena master (id fixo da Plena como operador)
-- role 'master' de qualquer empresa pode ler TODAS as empresas
create policy "empresas_master_read_all" on public.empresas
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'master'
    )
  );

-- role 'master' pode atualizar plano e license_status de qualquer empresa
create policy "empresas_master_update_all" on public.empresas
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'master'
    )
  ) with check (true);

-- role 'master' pode inserir novas empresas (criar empresa de teste)
create policy "empresas_master_insert" on public.empresas
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'master'
    )
  );

-- role 'master' pode ler TODOS os perfis (cross-empresa)
create policy "profiles_master_read_all" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid()
      and p2.role = 'master'
    )
  );

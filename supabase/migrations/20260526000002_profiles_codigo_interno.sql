alter table public.profiles add column if not exists codigo_interno text;

with ranked as (
  select id, role, row_number() over (partition by role order by created_at) as seq
  from public.profiles
  where codigo_interno is null
),
prefixes as (
  select
    id,
    case role
      when 'master' then 'MST'
      when 'gerente' then 'GER'
      when 'caixa' then 'CXA'
      when 'garcom' then 'GAR'
      when 'cozinha' then 'COZ'
      when 'estoque' then 'EST'
      when 'suporte' then 'SUP'
      else 'USR'
    end as prefix,
    seq
  from ranked
)
update public.profiles p
set codigo_interno = pr.prefix || '-' || lpad(pr.seq::text, 3, '0')
from prefixes pr
where p.id = pr.id;

create unique index if not exists idx_profiles_codigo_interno_empresa
  on public.profiles (empresa_id, codigo_interno)
  where codigo_interno is not null;

-- Admin write permissions + tenant-scoped RLS
-- Já aplicada via MCP.
--
-- Antes desta migration, o authenticated (admin logado) só tinha SELECT nas
-- tabelas de catalogo. Qualquer CREATE/UPDATE/DELETE via Supabase JS retornava
-- "permission denied for table X". Agora:
--   1. authenticated ganha INSERT/UPDATE/DELETE nas tabelas de catalogo
--   2. RLS + policy filtra por tenant_members: so escreve se o user for
--      membro do tenant dono da row
--   3. Reservas e reserva_extras continuam service_role-only (escritas pelo
--      backend Chatwoot controller)

-- Helper: verifica se o usuario logado eh membro de um tenant
create or replace function reserva_hotel.is_tenant_member(check_tenant_id bigint)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from reserva_hotel.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = check_tenant_id
  );
$$;

grant execute on function reserva_hotel.is_tenant_member(bigint) to authenticated, anon;

-- Pattern aplicado em cada tabela de catalogo:
--   alter table <t> enable row level security
--   grant insert/update/delete to authenticated
--   policy public_read: select true
--   policy members_write: for all to authenticated using/with check is_tenant_member(tenant_id)

-- MARCAS
alter table reserva_hotel.marcas enable row level security;
grant insert, update, delete on reserva_hotel.marcas to authenticated;
drop policy if exists "public_read_marcas" on reserva_hotel.marcas;
create policy "public_read_marcas" on reserva_hotel.marcas for select using (true);
drop policy if exists "members_write_marcas" on reserva_hotel.marcas;
create policy "members_write_marcas" on reserva_hotel.marcas
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- UNIDADES
alter table reserva_hotel.unidades enable row level security;
grant insert, update, delete on reserva_hotel.unidades to authenticated;
drop policy if exists "public_read_unidades" on reserva_hotel.unidades;
create policy "public_read_unidades" on reserva_hotel.unidades for select using (true);
drop policy if exists "members_write_unidades" on reserva_hotel.unidades;
create policy "members_write_unidades" on reserva_hotel.unidades
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- SUITES
alter table reserva_hotel.suites enable row level security;
grant insert, update, delete on reserva_hotel.suites to authenticated;
drop policy if exists "public_read_suites" on reserva_hotel.suites;
create policy "public_read_suites" on reserva_hotel.suites for select using (true);
drop policy if exists "members_write_suites" on reserva_hotel.suites;
create policy "members_write_suites" on reserva_hotel.suites
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- SUITES_UNIDADES (junction — sem tenant_id direto, resolve via unidade)
alter table reserva_hotel.suites_unidades enable row level security;
grant insert, update, delete on reserva_hotel.suites_unidades to authenticated;
drop policy if exists "public_read_suites_unidades" on reserva_hotel.suites_unidades;
create policy "public_read_suites_unidades" on reserva_hotel.suites_unidades for select using (true);
drop policy if exists "members_write_suites_unidades" on reserva_hotel.suites_unidades;
create policy "members_write_suites_unidades" on reserva_hotel.suites_unidades
  for all to authenticated
  using (exists (
    select 1 from reserva_hotel.unidades u
    where u.id = suites_unidades.id_unidade
      and reserva_hotel.is_tenant_member(u.tenant_id)
  ))
  with check (exists (
    select 1 from reserva_hotel.unidades u
    where u.id = suites_unidades.id_unidade
      and reserva_hotel.is_tenant_member(u.tenant_id)
  ));

-- CONTAS_PAGAMENTO
alter table reserva_hotel.contas_pagamento enable row level security;
grant insert, update, delete on reserva_hotel.contas_pagamento to authenticated;
drop policy if exists "public_read_contas_pagamento" on reserva_hotel.contas_pagamento;
create policy "public_read_contas_pagamento" on reserva_hotel.contas_pagamento for select using (true);
drop policy if exists "members_write_contas_pagamento" on reserva_hotel.contas_pagamento;
create policy "members_write_contas_pagamento" on reserva_hotel.contas_pagamento
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- PRECOS
alter table reserva_hotel.precos enable row level security;
grant insert, update, delete on reserva_hotel.precos to authenticated;
drop policy if exists "public_read_precos" on reserva_hotel.precos;
create policy "public_read_precos" on reserva_hotel.precos for select using (true);
drop policy if exists "members_write_precos" on reserva_hotel.precos;
create policy "members_write_precos" on reserva_hotel.precos
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- FOTOS_CATEGORIA
alter table reserva_hotel.fotos_categoria enable row level security;
grant insert, update, delete on reserva_hotel.fotos_categoria to authenticated;
drop policy if exists "public_read_fotos" on reserva_hotel.fotos_categoria;
create policy "public_read_fotos" on reserva_hotel.fotos_categoria for select using (true);
drop policy if exists "members_write_fotos" on reserva_hotel.fotos_categoria;
create policy "members_write_fotos" on reserva_hotel.fotos_categoria
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- EXTRAS
alter table reserva_hotel.extras enable row level security;
grant insert, update, delete on reserva_hotel.extras to authenticated;
drop policy if exists "public_read_extras" on reserva_hotel.extras;
create policy "public_read_extras" on reserva_hotel.extras for select using (true);
drop policy if exists "members_write_extras" on reserva_hotel.extras;
create policy "members_write_extras" on reserva_hotel.extras
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

-- APP_CONFIG (public SELECT ja existia via migration anterior)
grant insert, update, delete on reserva_hotel.app_config to authenticated;
drop policy if exists "members_write_app_config" on reserva_hotel.app_config;
create policy "members_write_app_config" on reserva_hotel.app_config
  for all to authenticated
  using (reserva_hotel.is_tenant_member(tenant_id))
  with check (reserva_hotel.is_tenant_member(tenant_id));

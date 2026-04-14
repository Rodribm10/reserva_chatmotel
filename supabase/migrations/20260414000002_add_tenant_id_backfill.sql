-- Adiciona tenant_id em todas as tabelas existentes + cria tenant default
-- + backfill de tudo pro tenant 1 ("Grupo Nova / Rede 1001")
-- Já aplicada via MCP.

-- 1. Tenant default
insert into reserva_hotel.tenants (slug, nome, ativo)
values ('grupo-1001', 'Grupo Nova — Rede 1001', true)
on conflict (slug) do nothing;

-- 2. app_config default
insert into reserva_hotel.app_config
  (tenant_id, nome_rede, titulo_hero, subtitulo_hero, tagline, footer_text,
   cor_primaria, cor_secundaria, cor_fundo, cor_superficie, cor_texto,
   fonte_display, fonte_corpo)
select
  t.id,
  'Rede 1001',
  'Reserva Rede 1001',
  'Experiência exclusiva',
  'Escolha, confirme e receba seu PIX na hora.',
  '© 2026 Rede 1001 · Experiência Exclusiva',
  '#C9A961', '#E8B4A0', '#0B0D12', '#0F1A2E', '#F5F1E8',
  'Fraunces', 'Inter'
from reserva_hotel.tenants t
where t.slug = 'grupo-1001'
on conflict (tenant_id) do nothing;

-- 3. Adiciona tenant_id (nullable pra backfill)
alter table reserva_hotel.marcas            add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.unidades          add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.suites            add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.precos            add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.contas_pagamento  add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.reservas          add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.fotos_categoria   add column if not exists tenant_id bigint references reserva_hotel.tenants(id);
alter table reserva_hotel.extras            add column if not exists tenant_id bigint references reserva_hotel.tenants(id);

-- 4. Backfill
do $$
declare v_tenant_id bigint;
begin
  select id into v_tenant_id from reserva_hotel.tenants where slug = 'grupo-1001';

  update reserva_hotel.marcas           set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.unidades         set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.suites           set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.precos           set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.contas_pagamento set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.reservas         set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.fotos_categoria  set tenant_id = v_tenant_id where tenant_id is null;
  update reserva_hotel.extras           set tenant_id = v_tenant_id where tenant_id is null;
end $$;

-- 5. NOT NULL
alter table reserva_hotel.marcas            alter column tenant_id set not null;
alter table reserva_hotel.unidades          alter column tenant_id set not null;
alter table reserva_hotel.suites            alter column tenant_id set not null;
alter table reserva_hotel.precos            alter column tenant_id set not null;
alter table reserva_hotel.contas_pagamento  alter column tenant_id set not null;
alter table reserva_hotel.reservas          alter column tenant_id set not null;
alter table reserva_hotel.fotos_categoria   alter column tenant_id set not null;
alter table reserva_hotel.extras            alter column tenant_id set not null;

-- 6. Indexes
create index if not exists idx_marcas_tenant           on reserva_hotel.marcas(tenant_id);
create index if not exists idx_unidades_tenant         on reserva_hotel.unidades(tenant_id);
create index if not exists idx_precos_tenant           on reserva_hotel.precos(tenant_id);
create index if not exists idx_reservas_tenant         on reserva_hotel.reservas(tenant_id);
create index if not exists idx_fotos_categoria_tenant  on reserva_hotel.fotos_categoria(tenant_id);
create index if not exists idx_extras_tenant           on reserva_hotel.extras(tenant_id);

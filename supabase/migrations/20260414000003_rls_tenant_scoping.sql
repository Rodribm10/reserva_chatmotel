-- RLS + grants pras tabelas publicas de tenant
-- Já aplicada via MCP.

alter table reserva_hotel.tenants enable row level security;
alter table reserva_hotel.app_config enable row level security;

drop policy if exists "public_read_tenants" on reserva_hotel.tenants;
create policy "public_read_tenants" on reserva_hotel.tenants
  for select using (ativo = true);

drop policy if exists "public_read_app_config" on reserva_hotel.app_config;
create policy "public_read_app_config" on reserva_hotel.app_config
  for select using (true);

grant select on reserva_hotel.tenants to anon, authenticated;
grant select on reserva_hotel.app_config to anon, authenticated;

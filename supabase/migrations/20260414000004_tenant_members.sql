-- Tenant members: mapeia usuarios auth.users a um tenant com role
-- Já aplicada via MCP.

create table if not exists reserva_hotel.tenant_members (
  id          bigserial primary key,
  tenant_id   bigint not null references reserva_hotel.tenants(id) on delete cascade,
  user_id     uuid not null,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_members_user on reserva_hotel.tenant_members(user_id);
create index if not exists idx_tenant_members_tenant on reserva_hotel.tenant_members(tenant_id);

alter table reserva_hotel.tenant_members enable row level security;

drop policy if exists "members_read_own" on reserva_hotel.tenant_members;
create policy "members_read_own" on reserva_hotel.tenant_members
  for select using (auth.uid() = user_id);

grant select on reserva_hotel.tenant_members to authenticated;

-- Seed: admin@reserva.test (criado via Auth API) é membro do tenant grupo-1001
-- INSERT executado manualmente apos criar o user via /auth/v1/signup.

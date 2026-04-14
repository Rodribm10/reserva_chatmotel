-- Multi-tenancy foundation: tenants + app_config
-- Já aplicada via MCP.

create table if not exists reserva_hotel.tenants (
  id          bigserial primary key,
  slug        text not null unique,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tenants_slug on reserva_hotel.tenants(slug);

create table if not exists reserva_hotel.app_config (
  id              bigserial primary key,
  tenant_id       bigint not null unique references reserva_hotel.tenants(id) on delete cascade,
  nome_rede       text not null,              -- "Rede 1001"
  titulo_hero     text not null,              -- "Reserva Rede 1001"
  subtitulo_hero  text,                       -- "Experiência exclusiva"
  tagline         text,                       -- "Escolha, confirme e receba seu PIX na hora."
  footer_text     text,                       -- "© 2026 Rede 1001 · Experiência Exclusiva"
  logo_url        text,
  favicon_url     text,
  cor_primaria    text not null default '#C9A961',
  cor_secundaria  text not null default '#E8B4A0',
  cor_fundo       text not null default '#0B0D12',
  cor_superficie  text not null default '#0F1A2E',
  cor_texto       text not null default '#F5F1E8',
  fonte_display   text not null default 'Fraunces',
  fonte_corpo     text not null default 'Inter',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

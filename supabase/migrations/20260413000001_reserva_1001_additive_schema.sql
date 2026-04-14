-- Reserva Rede 1001 — adições ao schema reserva_hotel existente
-- Já aplicada via MCP. Este arquivo é a fonte de verdade histórica.
-- Zero alteração destrutiva. Tudo aditivo.

-- === 1. Fotos por categoria de suíte (linked por unidade + nome da categoria) ===
create table if not exists reserva_hotel.fotos_categoria (
  id          uuid primary key default gen_random_uuid(),
  id_unidade  uuid not null references reserva_hotel.unidades(id) on delete cascade,
  categoria   text not null,
  url_foto    text not null,
  alt         text,
  ordem       int not null default 0,
  ativa       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_fotos_categoria_unidade on reserva_hotel.fotos_categoria(id_unidade);
create index if not exists idx_fotos_categoria_lookup on reserva_hotel.fotos_categoria(id_unidade, categoria);

-- === 2. Extras (adicionais por marca) ===
create table if not exists reserva_hotel.extras (
  id           uuid primary key default gen_random_uuid(),
  id_marca     uuid not null references reserva_hotel.marcas(id) on delete cascade,
  titulo       text not null,
  descricao    text,
  preco        numeric not null check (preco >= 0),
  imagem_url   text,
  ativo        boolean not null default true,
  ordem        int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_extras_marca on reserva_hotel.extras(id_marca);

-- === 3. Junction reserva ↔ extras ===
create table if not exists reserva_hotel.reserva_extras (
  id_reserva   uuid not null references reserva_hotel.reservas(id) on delete cascade,
  id_extra     uuid not null references reserva_hotel.extras(id),
  preco        numeric not null check (preco >= 0),
  created_at   timestamptz not null default now(),
  primary key (id_reserva, id_extra)
);

-- === 4. Integração Chatwoot em unidades ===
alter table reserva_hotel.unidades
  add column if not exists chatwoot_unit_id bigint;

create index if not exists idx_unidades_chatwoot_unit on reserva_hotel.unidades(chatwoot_unit_id);

-- === 5. Integração Chatwoot em reservas ===
alter table reserva_hotel.reservas
  add column if not exists chatwoot_contact_id bigint;

alter table reserva_hotel.reservas
  add column if not exists chatwoot_conversation_id bigint;

alter table reserva_hotel.reservas
  add column if not exists chatwoot_pix_charge_id bigint;

create index if not exists idx_reservas_chatwoot_conversation on reserva_hotel.reservas(chatwoot_conversation_id);
create index if not exists idx_reservas_txid_pix on reserva_hotel.reservas(txid_pix);

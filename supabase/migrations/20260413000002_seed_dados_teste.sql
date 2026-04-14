-- Seed de dados de teste para Reserva Rede 1001 (Fase 2+3)
-- Já aplicada via MCP. Este arquivo é source of truth.
--
-- Popula:
--  • 1 unidade (Hotel 1001 Águas Lindas) amarrada ao Captain::Unit id=4 do Chatwoot
--  • 6 preços (2 categorias × 3 permanências)
--  • 4 fotos por categoria (URLs Unsplash de placeholder)
--  • 2 extras
--
-- Idempotente: checa existência antes de inserir.

do $$
declare
  v_marca_id   uuid;
  v_unidade_id uuid;
  v_conta_id   uuid;
begin
  -- 1. Garante a marca com categorias e permanências coerentes
  select id into v_marca_id from reserva_hotel.marcas where nome = 'Hotel 1001 Noites' limit 1;

  if v_marca_id is null then
    insert into reserva_hotel.marcas (nome, categorias, permanencias, ativa)
    values ('Hotel 1001 Noites',
            array['Standard','Hidromassagem'],
            array['3hrs','4hrs','Pernoite'],
            true)
    returning id into v_marca_id;
  else
    update reserva_hotel.marcas
       set categorias = array['Standard','Hidromassagem'],
           permanencias = array['3hrs','4hrs','Pernoite']
     where id = v_marca_id;
  end if;

  -- 2. Pega a primeira conta_pagamento existente (o POC tinha uma seedada)
  select id into v_conta_id from reserva_hotel.contas_pagamento limit 1;

  -- 3. Cria a unidade amarrada ao Captain::Unit id=4 (Hotel 1001 Águas Lindas)
  select id into v_unidade_id from reserva_hotel.unidades where chatwoot_unit_id = 4 limit 1;

  if v_unidade_id is null then
    insert into reserva_hotel.unidades
      (nome, id_marca, id_conta_pagamento, categorias_visiveis,
       endereco, telefone, ativa, chatwoot_unit_id)
    values
      ('Hotel 1001 Águas Lindas',
       v_marca_id,
       v_conta_id,
       array['Standard','Hidromassagem'],
       'Águas Lindas, GO',
       '(61) 99999-0000',
       true,
       4)
    returning id into v_unidade_id;
  end if;

  -- 4. Preços
  if not exists (
    select 1 from reserva_hotel.precos
    where id_marca = v_marca_id and categoria = 'Standard' and permanencia = '3hrs'
  ) then
    insert into reserva_hotel.precos (id_marca, categoria, permanencia, periodo_semana, valor, ativo) values
      (v_marca_id, 'Standard',      '3hrs',     'default', 120.00, true),
      (v_marca_id, 'Standard',      '4hrs',     'default', 150.00, true),
      (v_marca_id, 'Standard',      'Pernoite', 'default', 220.00, true),
      (v_marca_id, 'Hidromassagem', '3hrs',     'default', 170.00, true),
      (v_marca_id, 'Hidromassagem', '4hrs',     'default', 210.00, true),
      (v_marca_id, 'Hidromassagem', 'Pernoite', 'default', 290.00, true);
  end if;

  -- 5. Fotos
  if not exists (select 1 from reserva_hotel.fotos_categoria where id_unidade = v_unidade_id) then
    insert into reserva_hotel.fotos_categoria (id_unidade, categoria, url_foto, alt, ordem) values
      (v_unidade_id, 'Standard',      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Suíte Standard 1', 0),
      (v_unidade_id, 'Standard',      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 'Suíte Standard 2', 1),
      (v_unidade_id, 'Hidromassagem', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'Suíte Hidromassagem 1', 0),
      (v_unidade_id, 'Hidromassagem', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'Suíte Hidromassagem 2', 1);
  end if;

  -- 6. Extras
  if not exists (select 1 from reserva_hotel.extras where id_marca = v_marca_id) then
    insert into reserva_hotel.extras (id_marca, titulo, descricao, preco, ativo, ordem) values
      (v_marca_id, 'Tira-gosto',          'Porção de petiscos servida na suíte', 35.00, true, 0),
      (v_marca_id, 'Decoração romântica', 'Pétalas, velas e champanhe',          90.00, true, 1);
  end if;
end $$;

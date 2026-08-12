-- Sondagem do mercado da casa, minuto a minuto.
--
-- Existe para responder uma pergunta que hoje é palpite: em que minuto a
-- Bateu Bet fecha o mercado de escanteios? Foi observado que aos 68' o grupo
-- "Escanteios" existe e aos 89' não — e as estratégias de canto FT disparam
-- entre 86' e 89'. Se o mercado já estiver fechado nessa faixa, o sinal está
-- certo e inapostável, que é pior do que sinal errado: parece que funciona.
--
-- Não alimenta nenhuma decisão do motor. É instrumento de medição, para
-- recalibrar a janela das estratégias com dado em vez de intuição.

create table if not exists public.house_market_probes (
  id uuid primary key default gen_random_uuid(),
  provider_match_id text not null,
  -- Minuto da partida no momento da sondagem, segundo o NOSSO provedor.
  minute integer not null,
  -- A casa estava oferecendo mercado de escanteios total?
  has_corner_market boolean not null,
  -- Linhas de "mais de X" disponíveis, para saber não só se havia mercado
  -- mas se havia a linha que a estratégia pediria.
  available_lines numeric[] not null default '{}',
  -- Casamento com o evento da casa: matched / not_found / ambiguous.
  match_status text not null,
  house_event_id text,
  probed_at timestamptz not null default now()
);

-- Uma sondagem por partida por minuto: o tick roda a cada 60s e o minuto
-- pode repetir entre ticks (acréscimo, atraso do provedor). Sem isto a
-- amostra ficaria enviesada para as partidas de tick mais lento.
create unique index if not exists house_market_probes_match_minute_idx
  on public.house_market_probes (provider_match_id, minute);

create index if not exists house_market_probes_minute_idx
  on public.house_market_probes (minute);

alter table public.house_market_probes enable row level security;

-- Só o service role escreve e lê: é dado operacional interno, não conteúdo
-- de usuário. Sem policy para authenticated, o RLS já barra o resto.
create policy "service role manages house market probes"
  on public.house_market_probes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

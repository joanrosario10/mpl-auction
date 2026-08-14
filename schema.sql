-- ============================================================
-- Auction app schema. Paste into Supabase SQL Editor and run.
-- ============================================================

-- 1. TABLES ---------------------------------------------------

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null unique references auth.users(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  purse      numeric(12,2) not null check (purse > 0),   -- money at start, e.g. 5000
  squad_size int           not null check (squad_size > 0), -- players you must end up with
  base_price numeric(12,2) not null default 100 check (base_price > 0)
);

create table public.players (
  id        uuid primary key default gen_random_uuid(),
  team_id   uuid not null references public.teams(id) on delete cascade,
  name      text not null check (length(trim(name)) > 0),
  price     numeric(12,2) not null check (price > 0),
  bought_at timestamptz not null default now()
);
create index players_team_id_idx on public.players(team_id);

-- 2. THE LIMIT RULE (single source of truth) ------------------
-- You may never spend so much that you can't still fill your
-- remaining slots at base price.
--   max_bid = balance - (slots_left - 1) * base_price
-- 5000 purse, 11 slots  -> can bid 4000 on one player
-- 3000 left,  5 slots   -> capped at 2600
-- squad already full    -> 0

create or replace function public.max_bid(
  balance numeric, slots_left int, base_price numeric
) returns numeric language sql immutable as $$
  select case
    when slots_left <= 0 then 0
    else greatest(0, balance - (slots_left - 1) * base_price)
  end
$$;

-- 3. BALANCE / CALCULATION VIEW -------------------------------
-- Balance is never stored, always derived. No drift possible.

create or replace view public.team_status
with (security_invoker = on) as
select
  s.*,
  public.max_bid(s.balance, s.slots_left, s.base_price) as max_bid
from (
  select
    t.id, t.owner_id, t.name, t.purse, t.squad_size, t.base_price,
    coalesce(sum(p.price), 0)                      as spent,
    t.purse - coalesce(sum(p.price), 0)            as balance,
    count(p.id)::int                               as bought,
    t.squad_size - count(p.id)::int                as slots_left
  from public.teams t
  left join public.players p on p.team_id = t.id
  group by t.id
) s;

-- 4. ENFORCEMENT ----------------------------------------------
-- The rule lives in the DB, not the UI. Client cannot bypass it.
-- `for update` locks the team row so two concurrent buys can't
-- both pass the check and overdraw the purse.

create or replace function public.enforce_max_bid()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_balance numeric; v_slots int; v_base numeric; v_max numeric;
begin
  select t.purse - coalesce((select sum(price) from players where team_id = t.id), 0),
         t.squad_size - (select count(*) from players where team_id = t.id),
         t.base_price
    into v_balance, v_slots, v_base
  from teams t where t.id = new.team_id
  for update;

  if not found then raise exception 'team not found'; end if;
  if v_slots <= 0 then raise exception 'Squad is full (% players)', v_slots; end if;

  v_max := public.max_bid(v_balance, v_slots, v_base);
  if new.price > v_max then
    raise exception
      'Bid % is over your limit of %. Balance %, % slots left, % reserved for them.',
      new.price, v_max, v_balance, v_slots, (v_slots - 1) * v_base;
  end if;
  return new;
end $$;

create trigger players_max_bid
  before insert on public.players
  for each row execute function public.enforce_max_bid();

-- 5. ROW LEVEL SECURITY ---------------------------------------
-- An owner sees and touches only their own team and players.

alter table public.teams   enable row level security;
alter table public.players enable row level security;

create policy teams_own on public.teams
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy players_own on public.players
  for all to authenticated
  using (exists (select 1 from public.teams t
                 where t.id = players.team_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.teams t
                      where t.id = players.team_id and t.owner_id = auth.uid()));

-- 6. LIVE AUCTION BLOCK ---------------------------------------
-- One auctioneer puts a player up; every owner sees it live.

create table public.auctioneers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.auctioneers enable row level security;

-- You only ever need to know whether *you* are one.
create policy auctioneers_read_self on public.auctioneers
  for select to authenticated using (user_id = auth.uid());

-- Single row: id is always true, so upsert replaces whoever was up.
create table public.block (
  id          boolean primary key default true check (id),
  player_name text not null check (length(trim(player_name)) > 0),
  put_up_at   timestamptz not null default now()
);
alter table public.block enable row level security;

create policy block_read on public.block
  for select to authenticated using (true);

create policy block_write on public.block
  for all to authenticated
  using      (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()));

alter publication supabase_realtime add table public.block;

-- 7. PLAYER POOL ----------------------------------------------
-- Registrations from the MPL Google Form. Every signed-in owner
-- can read the pool; only the auctioneer can change it.
-- Contact numbers are deliberately NOT stored here — the pool is
-- readable by every owner, and phone numbers are not theirs to see.

create table public.player_pool (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  age         int check (age > 0 and age < 120),
  all_rounder boolean not null default false,
  batting     text,
  bowling     text,
  photo_id    text,                    -- Google Drive file id, rendered via lh3.googleusercontent.com
  form_ts     timestamptz,             -- form submission time, doubles as the idempotency key
  unique (name, form_ts)
);
create index player_pool_name_idx on public.player_pool(name);

alter table public.player_pool enable row level security;

create policy pool_read on public.player_pool
  for select to authenticated using (true);

create policy pool_write on public.player_pool
  for all to authenticated
  using      (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()));

alter publication supabase_realtime add table public.player_pool;

-- Link a bought player back to their registration, for the photo.
alter table public.players add column pool_id uuid references public.player_pool(id);

-- The player on the block is now a pool registration, not free text.
-- player_name stays denormalised: realtime payloads carry no joins.
alter table public.block add column pool_id uuid references public.player_pool(id);

-- A registered player can only be sold once. Enforced here, not in the UI:
-- two owners can click "I won this" at the same time.
create unique index players_pool_id_key on public.players(pool_id) where pool_id is not null;

-- 8. WHO RECORDS A SALE ---------------------------------------
-- Owners used to enter their own purchases, which made every squad a claim
-- nobody could verify. The auctioneer runs the room and hears the hammer, so
-- the auctioneer is the only writer. Owners read; they cannot add or remove.

drop policy if exists players_own on public.players;

create policy players_read_own on public.players
  for select to authenticated
  using (exists (select 1 from public.teams t
                 where t.id = players.team_id and t.owner_id = auth.uid()));

create policy players_auctioneer on public.players
  for all to authenticated
  using      (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()));

-- The auctioneer needs every team in the dropdown to record who won.
create policy teams_read_auctioneer on public.teams
  for select to authenticated
  using (exists (select 1 from public.auctioneers a where a.user_id = auth.uid()));

-- Owners no longer write, so their squad only changes from someone else's
-- action — it has to arrive over realtime or they'd stare at a stale screen.
do $$ begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null; end $$;

-- 9. THE PUBLIC RESULT ----------------------------------------
-- An auction is played in the open: every owner watches every lot and knows
-- who bought whom for how much. So reads on teams and players are open to any
-- signed-in owner. Writes stay exactly where section 8 put them.
-- Nothing sensitive lives in these rows: player phone numbers were deliberately
-- never imported (see section 7).

drop policy if exists players_read_own on public.players;

create policy players_read_all on public.players
  for select to authenticated using (true);

create policy teams_read_all on public.teams
  for select to authenticated using (true);

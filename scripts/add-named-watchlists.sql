-- Named watchlists: up to 5 lists, each with multiple symbols
create table if not exists named_watchlists (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Watchlist',
  color text not null default '#22c55e',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists watchlist_symbols (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references named_watchlists(id) on delete cascade,
  ticker text not null,
  added_at timestamptz not null default now(),
  unique(watchlist_id, ticker)
);

-- RLS
alter table named_watchlists enable row level security;
alter table watchlist_symbols enable row level security;

create policy allow_all_named_watchlists on named_watchlists for all using (true) with check (true);
create policy allow_all_watchlist_symbols on watchlist_symbols for all using (true) with check (true);

-- Seed a default watchlist
insert into named_watchlists (name, color, position)
values
  ('My Watchlist', '#22c55e', 0)
on conflict do nothing;

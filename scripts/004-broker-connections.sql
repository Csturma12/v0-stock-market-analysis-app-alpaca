-- Broker account connection records.
-- Stores credentials for third-party brokers (Alpaca, Tradier, Webull, Robinhood).
-- NOTE: Credentials are stored as JSONB. In production these should be encrypted
-- at rest (e.g. via Supabase Vault or pgcrypto). For now we rely on
-- service-role-only access via the API layer.

create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  broker text not null,                       -- 'alpaca' | 'tradier' | 'webull' | 'robinhood'
  label text,                                 -- user-supplied nickname
  environment text not null default 'paper',  -- 'paper' | 'live' | 'sandbox' | 'production'
  status text not null default 'connected',   -- 'connected' | 'error' | 'disconnected'
  credentials jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broker, label)
);

create index if not exists broker_connections_broker_idx
  on public.broker_connections (broker);

alter table public.broker_connections enable row level security;

drop policy if exists allow_all_broker_connections on public.broker_connections;
create policy allow_all_broker_connections
  on public.broker_connections
  for all
  using (true)
  with check (true);

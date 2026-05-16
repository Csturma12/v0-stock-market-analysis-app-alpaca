create table if not exists public.dashboard_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  watchlists jsonb,
  layouts jsonb,
  hidden_widgets jsonb,
  collapsed_widgets jsonb,
  templates jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_preferences enable row level security;

create policy "Users can read their own dashboard preferences"
on public.dashboard_preferences
for select
using (auth.uid() = user_id);

create policy "Users can insert their own dashboard preferences"
on public.dashboard_preferences
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own dashboard preferences"
on public.dashboard_preferences
for update
using (auth.uid() = user_id);

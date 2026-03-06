-- Ejecuta esto en Supabase > SQL Editor

create table if not exists calendars (
  user_id   text primary key,
  data      jsonb not null,
  updated_at timestamptz default now()
);

-- Allow public access (anon users)
alter table calendars enable row level security;

create policy "Users can manage their own calendar"
  on calendars for all
  using (true)
  with check (true);

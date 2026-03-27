create table ai_logs (
  id          uuid primary key default gen_random_uuid(),
  caller      text not null,              -- e.g. 'url-import', 'text-import', 'photo-import'
  model       text not null,              -- e.g. 'claude-haiku-4'
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd    numeric(10, 6) not null default 0,
  source_url  text,                       -- set for URL imports (used for cache lookup)
  created_at  timestamptz not null default now()
);

alter table ai_logs enable row level security;

-- Service role only — this table is written server-side, never from the client
create policy "service role only" on ai_logs
  using (false)
  with check (false);
